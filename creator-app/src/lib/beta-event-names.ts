/**
 * Beta events, shared by the browser and the server. Each answers a question in docs/BETA.md: where creators
 * come from, whether they come back, whether they reuse Video Doctor, whether fixes work, how the language reads
 * and what they'd pay.
 */
export const EVENT_NAMES = [
  "landing_view",
  "signup_click",
  "session_start",
  "doctor_run",
  "output_feedback",
  "fix_committed",
  "studio_generate",
  "thumbnail_download",
  "progress_view",
  "result_shared",
  "wtp_survey",
  "benchmark_sample",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** Server-only events (recorded by the server itself, never accepted from the browser). */
export type ServerEventName = "channel_connected";
