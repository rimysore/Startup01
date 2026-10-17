import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/Legal";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Contact — Mitra" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

const sections: LegalSection[] = [
  {
    id: "support",
    title: "Support",
    body: (
      <dl>
        <Row label="Email"><a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></Row>
        {COMPANY.phone && <Row label="Phone">{COMPANY.phone}</Row>}
        <Row label="Response time">Within 1 business day (we&apos;re a small team in beta)</Row>
      </dl>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <>
        <p>
          For complaints about the Service, your data or a payment, you can contact our Grievance Officer, appointed under the Information
          Technology Act, 2000 and rules made under it, and the Consumer Protection (E-Commerce) Rules, 2020.
        </p>
        <dl>
          <Row label="Name">{COMPANY.grievanceOfficer}</Row>
          <Row label="Email"><a href={`mailto:${COMPANY.grievanceEmail}`}>{COMPANY.grievanceEmail}</a></Row>
          <Row label="Address">{COMPANY.address}</Row>
        </dl>
        <p>We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>
      </>
    ),
  },
  {
    id: "company",
    title: "Who runs Mitra",
    body: (
      <dl>
        <Row label="Operated by">{COMPANY.legalName}, {COMPANY.operatorType}</Row>
        <Row label="Based in">{COMPANY.address}</Row>
        <Row label="Website"><a href={COMPANY.website}>{COMPANY.website.replace("https://", "")}</a></Row>
        <Row label="Privacy requests"><a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a></Row>
      </dl>
    ),
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Help"
      title="Contact us"
      current="/contact"
      sections={sections}
      summary={<p>Questions about your account, a payment or a refund? Email us and a real person will reply within one business day.</p>}
    />
  );
}
