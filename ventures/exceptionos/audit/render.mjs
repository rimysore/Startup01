// Renders an HTML page to PDF (Letter) and a PNG preview with the preinstalled Chromium.
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
const [html, pdf, png, landscape] = process.argv.slice(2);
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: landscape === "portrait" ? { width: 816, height: 1056 } : { width: 1056, height: 816 } });
await p.goto("file://" + html);
await p.pdf({ path: pdf, format: "Letter", landscape: landscape !== "portrait", printBackground: true, preferCSSPageSize: true });
await p.screenshot({ path: png, fullPage: true });
await b.close();
