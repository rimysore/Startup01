import { currentUser, isAdmin } from "@/lib/auth";
import { loadBetaMetrics, loadLanguageReviews } from "@/lib/beta-metrics";

/**
 * Admins only: the beta's numbers. `?format=wtp` downloads the price answers as the CSV founder-pricing's
 * van_westendorp.py reads; `?format=reviews` downloads every rated AI answer for the native-speaker review.
 */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!isAdmin(user)) return Response.json({ error: "Not found" }, { status: 404 });
  const format = new URL(request.url).searchParams.get("format");

  if (format === "reviews") {
    const rows = await loadLanguageReviews();
    return new Response(rows.map((r) => JSON.stringify({ at: r.at, ...r.props })).join("\n") + "\n", {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Content-Disposition": 'attachment; filename="mitra-language-reviews.jsonl"' },
    });
  }

  const metrics = await loadBetaMetrics();
  if (format === "wtp") {
    const csv = ["too_cheap,cheap,expensive,too_expensive,segment", ...metrics.wtp.map((w) => [w.too_cheap, w.cheap, w.expensive, w.too_expensive, w.segment ?? ""].join(","))];
    return new Response(csv.join("\n") + "\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="mitra-price-survey.csv"' },
    });
  }
  return Response.json(metrics);
}
