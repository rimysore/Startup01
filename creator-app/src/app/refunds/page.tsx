import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/Legal";
import { COMPANY } from "@/lib/company";
import { PLANS, rupees } from "@/lib/plans";

export const metadata: Metadata = { title: "Refund & Cancellation Policy — Mitra" };

/** Business rule for first-payment refunds. Keep this in sync with what support actually honours. */
const REFUND_WINDOW_DAYS = 7;
const REFUND_MAX_CREDITS_USED = 20;

const sections: LegalSection[] = [
  {
    id: "cancel",
    title: "Cancelling your subscription",
    body: (
      <>
        <p>
          You can cancel any time from the <Link href="/dashboard/billing">Plan &amp; billing</Link> page — no emails or calls needed. Cancelling
          stops future renewals; it also cancels the UPI Autopay mandate or card instruction with Razorpay.
        </p>
        <ul>
          <li>You <strong>keep your paid plan until the end of the period you&apos;ve already paid for</strong>, then move to the Free plan.</li>
          <li>Your account, settings and connected channel stay as they are; only your monthly AI credits change.</li>
          <li>You can subscribe again whenever you like.</li>
        </ul>
      </>
    ),
  },
  {
    id: "first-payment",
    title: "Refund on your first payment",
    body: (
      <>
        <p>
          If {COMPANY.product} isn&apos;t right for you, you can ask for a <strong>full refund of your first subscription payment</strong> within{" "}
          {REFUND_WINDOW_DAYS} days of paying, as long as you&apos;ve used no more than {REFUND_MAX_CREDITS_USED} AI credits in that time.
        </p>
        <p>
          Email <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> from your account email address with the subject
          &ldquo;Refund request&rdquo;. When we refund, we cancel the subscription and your account moves to the Free plan straight away.
        </p>
      </>
    ),
  },
  {
    id: "renewals",
    title: "Renewals and partial months",
    body: (
      <p>
        Monthly renewals aren&apos;t refundable, and we don&apos;t give refunds for part of a month after you cancel — you keep access until the
        end of that month instead. Exceptions are the cases in the next section, and anything required by law.
      </p>
    ),
  },
  {
    id: "always",
    title: "When we always refund",
    body: (
      <ul>
        <li><strong>Duplicate or wrong charges</strong> — for example, being charged twice for the same month, or charged after you cancelled.</li>
        <li><strong>Charged but plan not activated</strong> — if payment went through and your plan didn&apos;t upgrade, and we can&apos;t fix it within 2 business days.</li>
        <li><strong>Major outage</strong> — if the paid features are unavailable for more than 72 hours in a row, we refund that month on request.</li>
        <li><strong>Removed features</strong> — if we remove a core paid feature, we refund the unused part of your current period on request.</li>
      </ul>
    ),
  },
  {
    id: "how",
    title: "How refunds are paid",
    body: (
      <ul>
        <li>We confirm your request by email within 2 business days.</li>
        <li>Approved refunds are issued to the <strong>original payment method</strong> (UPI, card or bank account) through Razorpay.</li>
        <li>Banks usually credit the money within <strong>5–7 business days</strong> of the refund being issued; some banks take longer.</li>
        <li>We don&apos;t charge any fee for refunds.</li>
      </ul>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <p>
        {COMPANY.product} is an online service. Paid plans are activated in your account immediately after payment is confirmed; nothing is
        shipped physically. If your plan doesn&apos;t activate within a few minutes, contact us.
      </p>
    ),
  },
  {
    id: "prices",
    title: "Current prices",
    body: (
      <p>
        {PLANS.pro.name}: {rupees(PLANS.pro.pricePaise)}/month. {PLANS.creator.name}: {rupees(PLANS.creator.pricePaise)}/month. The Free plan
        costs nothing. Applicable taxes are shown at checkout.
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      current="/refunds"
      sections={sections}
      summary={
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Cancel any time in two clicks. You keep your plan until the period you paid for ends.</li>
          <li>Full refund of your first payment within {REFUND_WINDOW_DAYS} days if you&apos;ve used {REFUND_MAX_CREDITS_USED} or fewer AI credits.</li>
          <li>Duplicate or wrong charges are always refunded.</li>
          <li>Refunds go back to your original payment method, usually within 5–7 business days.</li>
        </ul>
      }
    />
  );
}
