"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDashboard, useQueryParam } from "@/components/dashboard-context";
import { Button, Card, DemoNote, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { AGENCY, PLANS, rupees, type PlanId } from "@/lib/plans";

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Razorpay"));
    document.body.appendChild(s);
  });
}

function fmtDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
}

async function post<T>(url: string, body?: unknown): Promise<T & { error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await post("/api/account/delete", { confirm: typed });
    setBusy(false);
    if (res.error) setError(res.error);
    else router.push("/");
  }

  return (
    <section className="mt-12 rounded-2xl border border-bad/30 p-5 sm:p-6">
      <h2 className="font-semibold text-bad">Delete my account</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        Permanently deletes your account, your saved YouTube connection and your usage history, and cancels any subscription immediately. This
        can&apos;t be undone. See our <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link> for what Razorpay keeps.
      </p>
      {!open ? (
        <Button variant="ghost" className="mt-4 !border-bad/40 !text-bad" onClick={() => setOpen(true)}>
          Delete my account…
        </Button>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Type DELETE to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-bad"
              autoComplete="off"
            />
          </label>
          <Button onClick={remove} disabled={busy || typed !== "DELETE"} className="!bg-bad !text-white">
            {busy ? "Deleting…" : "Permanently delete"}
          </Button>
          <Button variant="ghost" onClick={() => { setOpen(false); setTyped(""); }} disabled={busy}>
            Keep my account
          </Button>
        </div>
      )}
      {error && <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>}
    </section>
  );
}

export default function BillingPage() {
  const { me, reload } = useDashboard();
  const highlighted = useQueryParam("plan");
  const [busy, setBusy] = useState<PlanId | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!me) return <Spinner label="Loading your plan" />;

  if (!me.user) {
    return (
      <div className="rise">
        <PageHeader eyebrow="Plan & billing" title="Sign in to choose a plan" />
        <Card className="grain flex flex-col items-center py-14 text-center">
          <p className="font-display text-3xl">Start free. Upgrade when Mitra earns it.</p>
          <p className="mt-2 text-sm text-muted">You get {PLANS.free.credits} AI credits every month on the free plan.</p>
          <Link href={`/login?next=${encodeURIComponent(`/dashboard/billing${highlighted ? `?plan=${highlighted}` : ""}`)}`} className="mt-6 rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink">
            Sign in free
          </Link>
        </Card>
      </div>
    );
  }

  const current = me.plan?.id ?? "free";
  const sub = me.subscription;
  const usage = me.usage;

  async function upgrade(plan: PlanId) {
    setBusy(plan);
    setError(null);
    setNotice(null);
    try {
      const start = await post<{ mode: "razorpay" | "simulate"; keyId?: string; subscriptionId?: string; planName?: string; prefill?: Record<string, string> }>(
        "/api/billing/checkout",
        { plan },
      );
      if (start.error) throw new Error(start.error);

      if (start.mode === "simulate") {
        const ok = window.confirm(`Test mode: Razorpay isn't configured, so no money moves.\n\nActivate ${PLANS[plan].name} as if the payment succeeded?`);
        if (!ok) return;
        const sim = await post("/api/billing/simulate", { plan });
        if (sim.error) throw new Error(sim.error);
        setNotice(`${PLANS[plan].name} is active (test mode).`);
        reload();
        return;
      }

      await loadRazorpay();
      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: start.keyId,
          subscription_id: start.subscriptionId,
          name: "Mitra",
          description: `${start.planName} — monthly`,
          prefill: start.prefill,
          theme: { color: "#e2620b" },
          handler: async (resp: RazorpayCheckoutResponse) => {
            const verified = await post("/api/billing/verify", resp);
            if (verified.error) reject(new Error(verified.error));
            else resolve();
          },
          modal: { ondismiss: () => resolve() },
        });
        checkout.open();
      });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel your subscription? You keep your plan until the end of the period you've paid for.")) return;
    setBusy("cancel");
    setError(null);
    const res = await post("/api/billing/cancel");
    setBusy(null);
    if (res.error) setError(res.error);
    else {
      setNotice("Your subscription won't renew. You keep your plan until the end of this period.");
      reload();
    }
  }

  const hasLiveSub = Boolean(sub && !sub.cancelAtCycleEnd && sub.status !== "cancelled");

  return (
    <div className="rise">
      <PageHeader eyebrow="Plan & billing" title="Your plan" />
      {!me.config.billing && !me.config.simulateBilling && (
        <div className="mb-4">
          <DemoNote>Mitra is in free beta. Paid plans open soon; until then you can&apos;t be charged.</DemoNote>
        </div>
      )}
      {!me.config.billing && me.config.simulateBilling && (
        <div className="mb-4">
          <DemoNote>Razorpay keys aren&apos;t set, so upgrades run in test mode and no money moves.</DemoNote>
        </div>
      )}
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}
      {notice && <p className="mb-4 rounded-xl border border-good/40 px-3 py-2 text-sm text-good">{notice}</p>}

      <Card className="grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Current plan</p>
          <p className="mt-1 font-display text-4xl">{PLANS[current].name}</p>
          <p className="mt-1 text-sm text-muted">
            {current === "free"
              ? "Free forever"
              : sub?.cancelAtCycleEnd || sub?.status === "cancelled"
                ? `Ends on ${fmtDate(sub?.currentEnd ?? me.plan?.renewsAt)}`
                : me.plan?.renewsAt
                  ? `Renews on ${fmtDate(me.plan.renewsAt)}`
                  : "Active"}
          </p>
        </div>
        {usage && (
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">AI credits this month</span>
              <span className="font-semibold tabular-nums">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-2">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">Resets on the 1st of every month.</p>
          </div>
        )}
        {hasLiveSub && (
          <Button variant="ghost" onClick={cancel} disabled={busy !== null}>
            {busy === "cancel" ? "Cancelling…" : "Cancel subscription"}
          </Button>
        )}
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Object.values(PLANS)).map((p) => {
          const isCurrent = p.id === current;
          const featured = highlighted ? highlighted === p.id : p.id === "pro";
          return (
            <div key={p.id} className={`card flex flex-col p-6 ${featured && !isCurrent ? "!border-accent ring-2 ring-accent/30" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.name}</p>
                {isCurrent && <span className="rounded-full bg-good/15 px-2.5 py-1 text-[11px] font-semibold text-good">Current</span>}
              </div>
              <p className="mt-4 font-display text-5xl">
                {rupees(p.pricePaise)}
                {p.pricePaise > 0 && <span className="font-sans text-sm text-muted">/month</span>}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2"><span className="text-accent">✓</span>{pt}</li>
                ))}
              </ul>
              {p.id !== "free" && !isCurrent && (
                <Button className="mt-6" variant={featured ? "primary" : "ghost"} onClick={() => upgrade(p.id)} disabled={busy !== null || hasLiveSub}>
                  {busy === p.id ? "Opening checkout…" : `Get ${p.name}`}
                </Button>
              )}
            </div>
          );
        })}
        <div className="card flex flex-col p-6">
          <p className="font-semibold">{AGENCY.name}</p>
          <p className="mt-4 font-display text-5xl">{rupees(AGENCY.pricePaise)}<span className="font-sans text-sm text-muted">/month</span></p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-2">
            {AGENCY.points.map((pt) => (
              <li key={pt} className="flex gap-2"><span className="text-accent">✓</span>{pt}</li>
            ))}
          </ul>
          <a href={`mailto:${COMPANY.supportEmail}?subject=Mitra%20Agency%20plan`} className="mt-6 rounded-full border border-line px-4 py-2.5 text-center text-sm font-semibold hover:bg-surface-2">
            Talk to us
          </a>
        </div>
      </div>
      {hasLiveSub && <p className="mt-4 text-xs text-muted">To switch plans, cancel your current subscription first; the new plan can start right away.</p>}
      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted">
        Paid plans renew automatically every month at the price shown until you cancel, which you can do here at any time. By subscribing you
        agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
        <Link href="/refunds" className="underline underline-offset-2">Refund &amp; Cancellation Policy</Link>. Payments are processed by
        Razorpay; UPI Autopay, cards and netbanking are supported.
      </p>

      <DeleteAccount />
    </div>
  );
}
