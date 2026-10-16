import type { Metadata } from "next";
import Link from "next/link";
import { Ext, LegalPage, type LegalSection } from "@/components/Legal";
import { COMPANY } from "@/lib/company";
import { FEATURE_CREDITS, FOUNDER_PERKS, FOUNDING_SPOTS, PLANS, rupees } from "@/lib/plans";

export const metadata: Metadata = { title: "Terms of Service — Mitra" };

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Who we are and this agreement",
    body: (
      <>
        <p>
          {COMPANY.product} is operated by <strong>{COMPANY.legalName}</strong>, {COMPANY.operatorType} based in {COMPANY.address}{" "}
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;). {COMPANY.product} is currently in beta: features may change, and we&apos;ll tell you before
          anything you rely on is removed.
          These Terms of Service (&ldquo;Terms&rdquo;) are a contract between you and us for your use of the {COMPANY.product} website,
          dashboard and related services (the &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account or using the Service you agree to these Terms, our <Link href="/privacy">Privacy Policy</Link> and our{" "}
          <Link href="/refunds">Refund &amp; Cancellation Policy</Link>. If you don&apos;t agree, please don&apos;t use the Service.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and your account",
    body: (
      <ul>
        <li>You must be at least 18 years old and able to enter into a binding contract under the law that applies to you.</li>
        <li>
          You sign in with Google. You&apos;re responsible for activity under your account and for keeping access to your Google account secure.
          Tell us at <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a> if you think your account has been misused.
        </li>
        <li>If you use the Service for a business or on behalf of a channel you manage, you confirm you have authority to bind that business or channel owner to these Terms.</li>
      </ul>
    ),
  },
  {
    id: "youtube",
    title: "Connecting YouTube",
    body: (
      <>
        <p>
          The Service uses YouTube API Services. By connecting a YouTube channel, you also agree to be bound by the{" "}
          <Ext href="https://www.youtube.com/t/terms">YouTube Terms of Service</Ext>, and you acknowledge Google&apos;s{" "}
          <Ext href="https://policies.google.com/privacy">Privacy Policy</Ext> applies to Google&apos;s handling of your data.
        </p>
        <ul>
          <li>We request read-only access. We never upload, edit, delete or post anything on your channel.</li>
          <li>
            You can disconnect at any time from <Link href="/dashboard/connections">Connections</Link>, and revoke our access from your{" "}
            <Ext href="https://myaccount.google.com/permissions">Google account permissions page</Ext>.
          </li>
          <li>Only connect channels you own or are authorised to manage.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI features and results",
    body: (
      <>
        <p>
          The Service uses artificial intelligence to generate diagnoses, titles, thumbnail text, comment summaries, replies and other
          suggestions (&ldquo;Outputs&rdquo;). Outputs are generated automatically and may be inaccurate, incomplete or unsuitable for your audience.
        </p>
        <ul>
          <li>Review Outputs before you publish or rely on them. You decide what to publish and are responsible for it.</li>
          <li>
            <strong>We don&apos;t promise any particular result</strong> — including more views, subscribers, watch time or revenue. YouTube&apos;s
            recommendations depend on many factors outside our control.
          </li>
          <li>Trend and benchmark information may be estimated or sample data and is labelled where that&apos;s the case.</li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service to create content that is unlawful, defamatory, hateful, sexually explicit involving minors, or that infringes anyone&apos;s rights;</li>
          <li>use Outputs to mislead viewers in ways that break YouTube&apos;s policies (for example, deceptive clickbait or impersonation);</li>
          <li>access accounts or channels you aren&apos;t authorised to use;</li>
          <li>scrape, reverse engineer, overload or interfere with the Service, or get around usage limits or credits;</li>
          <li>resell or share your account, or use the Service to build a competing product.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules, after notice where reasonable.</p>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans, credits and payments",
    body: (
      <>
        <ul>
          <li>
            We offer a Free plan and paid subscriptions: {PLANS.pro.name} ({rupees(PLANS.pro.pricePaise)}/month) and {PLANS.creator.name} (
            {rupees(PLANS.creator.pricePaise)}/month). Current prices and what each plan includes are shown on our{" "}
            <Link href="/dashboard/billing">billing page</Link>. Applicable taxes are shown at checkout.
          </li>
          <li>
            Each plan includes a number of <strong>AI credits per calendar month</strong>. Each AI answer uses credits: a Video Doctor diagnosis
            uses {FEATURE_CREDITS.doctor}; a set of titles, a comment summary or a chat reply uses {FEATURE_CREDITS.chat}. Asking the exact same
            question again within a few hours is answered from cache at no charge. Unused credits don&apos;t roll over. If an AI request fails,
            its credits are returned.
          </li>
          <li>
            Paid plans <strong>renew automatically every month</strong> until you cancel. Payments are processed by Razorpay Software Private Limited
            using UPI Autopay, cards, netbanking or other methods they support. We never see or store your full card or UPI credentials.
          </li>
          <li>If a renewal payment fails and can&apos;t be recovered, your account moves to the Free plan.</li>
          <li>
            We may change prices or plan contents. We&apos;ll give at least 30 days&apos; notice by email before a price increase applies to your
            subscription, and you can cancel before it takes effect.
          </li>
          <li>Cancellations and refunds are covered by our <Link href="/refunds">Refund &amp; Cancellation Policy</Link>.</li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content and ours",
    body: (
      <>
        <p>
          <strong>You own your content</strong> — your channel data, the text and images you provide, and the Outputs generated for you, to the extent
          the law allows ownership of them. You give us a limited licence to process that content only to run and improve the Service for you, as
          described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Similar Outputs may be generated for other users; we don&apos;t guarantee that Outputs are unique. The Service itself — its software,
          design, brand and documentation — belongs to us and our licensors.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep the Service available but don&apos;t guarantee it will be uninterrupted or error-free. Features that depend on Google,
        YouTube, our AI provider or Razorpay can stop working if those services change or are unavailable. We may add, change or remove features;
        if we remove a core paid feature, we&apos;ll offer a pro-rata refund for the unused part of your current paid period.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Ending your account",
    body: (
      <p>
        You can delete your account at any time from the <Link href="/dashboard/billing">Plan &amp; billing</Link> page; this also stops any
        subscription. We may suspend or end your access if you seriously or repeatedly break these Terms, or if required by law. Sections that by
        their nature should survive (such as ownership, disclaimers, liability limits and governing law) continue after your account ends.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and limitation of liability",
    body: (
      <>
        <p>
          Except as required by law, the Service and Outputs are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of
          any kind, including fitness for a particular purpose or that Outputs will be accurate.
        </p>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect, incidental, special or consequential losses, or for loss of
          profits, revenue, views, subscribers, data or goodwill. Our total liability for any claim relating to the Service is limited to the
          amount you paid us in the 12 months before the claim arose (or ₹1,000 if you haven&apos;t paid us anything).
        </p>
        <p>Nothing in these Terms limits liability that can&apos;t be limited under applicable law, including your rights as a consumer.</p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to compensate us for reasonable losses and costs arising from content you publish using the Service or from your breach of
        these Terms or of YouTube&apos;s terms, except to the extent caused by us.
      </p>
    ),
  },
  {
    id: "founding",
    title: "Founding creators",
    body: (
      <>
        <p>
          The first {FOUNDING_SPOTS} people to connect a YouTube channel to {COMPANY.product} become founding creators (one spot per channel). For as long as{" "}
          {COMPANY.product} operates, a founding creator keeps, at no charge:
        </p>
        <ul>
          {FOUNDER_PERKS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>
          The perks are personal and can&apos;t be transferred or sold. We may end them for an account that breaks these Terms. If {COMPANY.product} is
          discontinued, we&apos;ll give founding creators at least 30 days&apos; notice.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of {COMPANY.governingLaw}. Before going to court, please contact our Grievance Officer (see{" "}
        <Link href="/contact">Contact</Link>) so we can try to resolve the issue. The courts of {COMPANY.jurisdictionCity} have jurisdiction,
        but nothing in these Terms removes consumer-protection rights you have under the law of the country where you live, including
        India&apos;s Consumer Protection Act, 2019, or your right to bring a claim there.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    body: (
      <p>
        We may update these Terms. For material changes we&apos;ll notify you by email or in the dashboard at least 15 days before they take
        effect. Continuing to use the Service after that date means you accept the updated Terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      current="/terms"
      sections={sections}
      summary={
        <ul className="list-disc space-y-1.5 pl-5">
          <li>You must be 18+. You sign in with Google, and connect YouTube with read-only access.</li>
          <li>AI suggestions can be wrong. Review them before publishing. We can&apos;t guarantee views or subscribers.</li>
          <li>Paid plans renew monthly until you cancel. Cancel any time; you keep your plan until the period ends.</li>
          <li>You own your content. Don&apos;t use Mitra for anything unlawful or misleading.</li>
          <li>Indiana (USA) law applies, but you keep the consumer rights you have where you live.</li>
        </ul>
      }
    />
  );
}
