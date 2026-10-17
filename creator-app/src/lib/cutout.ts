"use client";

/**
 * Cuts people out of photos in the browser with Google's MediaPipe selfie segmenter (Apache-2.0, a 250 KB model),
 * the "sticker" look modern YouTube thumbnails use. Free, and the photos never leave the device for this step.
 * The model and its runtime load from public CDNs only when a creator first blends photos.
 */
import type { ImageSegmenter } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
/** Photos are segmented at this size: plenty for a thumbnail, fast on a phone. */
const MAX_SIDE = 1024;
/** Less than this share of the photo is a person: treat it as having no one to cut out. */
const MIN_PERSON = 0.03;

export interface Cutout {
  /** The person on a transparent background, cropped to them. */
  canvas: HTMLCanvasElement;
  /** Share of the photo that is person, 0-1. */
  share: number;
}

let segmenter: Promise<ImageSegmenter> | null = null;

function load(): Promise<ImageSegmenter> {
  segmenter ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: "GPU" | "CPU") =>
      ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "IMAGE", outputConfidenceMasks: true, outputCategoryMask: false });
    // Some phones have no usable GPU in the browser; the CPU path is slower but works everywhere.
    return make("GPU").catch(() => make("CPU"));
  })().catch((err) => {
    segmenter = null;
    throw err;
  });
  return segmenter;
}

/** The person in `img`, or null when there's nobody clearly in the photo. */
export async function cutOutPerson(img: HTMLImageElement): Promise<Cutout | null> {
  const seg = await load();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  src.getContext("2d")!.drawImage(img, 0, 0, w, h);

  const result = seg.segment(src);
  const mask = result.confidenceMasks?.[0];
  if (!mask) return null;
  const conf = mask.getAsFloat32Array();
  const mw = mask.width;
  const mh = mask.height;

  // Alpha from confidence, a little contrast so edges are clean but not jagged; track the person's bounds.
  const alpha = new ImageData(mw, mh);
  let count = 0;
  let x0 = mw;
  let y0 = mh;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const c = conf[y * mw + x];
      const a = Math.min(1, Math.max(0, (c - 0.3) / 0.4));
      alpha.data[(y * mw + x) * 4 + 3] = Math.round(a * 255);
      if (a > 0.5) {
        count++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  result.close();
  const share = count / (mw * mh);
  if (share < MIN_PERSON) return null;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = mw;
  maskCanvas.height = mh;
  maskCanvas.getContext("2d")!.putImageData(alpha, 0, 0);

  // Photo × feathered mask, cropped to the person with a small margin.
  const full = document.createElement("canvas");
  full.width = w;
  full.height = h;
  const fx = full.getContext("2d")!;
  fx.drawImage(src, 0, 0);
  fx.globalCompositeOperation = "destination-in";
  fx.filter = "blur(1.5px)";
  fx.drawImage(maskCanvas, 0, 0, w, h);

  const sx = w / mw;
  const sy = h / mh;
  const pad = 6;
  const cx = Math.max(0, Math.floor(x0 * sx) - pad);
  const cy = Math.max(0, Math.floor(y0 * sy) - pad);
  const cw = Math.min(w, Math.ceil((x1 + 1) * sx) + pad) - cx;
  const ch = Math.min(h, Math.ceil((y1 + 1) * sy) + pad) - cy;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d")!.drawImage(full, cx, cy, cw, ch, 0, 0, cw, ch);
  return { canvas, share };
}
