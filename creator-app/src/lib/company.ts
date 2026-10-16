/**
 * Who operates Mitra, shown on the legal and contact pages. During the beta Mitra is run by an individual;
 * when a company is registered, change legalName/operatorType/address (and the governing law in the Terms).
 * The legal pages show a warning banner while any [bracketed] placeholder remains.
 */
const OPERATOR = "[Your full legal name]";

/** The public site address: APP_URL, else Vercel's production URL (e.g. mitra.vercel.app), else the planned domain. */
export const SITE_URL =
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://mitracreators.com");

/**
 * Mitra's official inbox: support, privacy, grievance and creator outreach all use it until the domain's own
 * addresses exist. NEXT_PUBLIC_CONTACT_EMAIL can override it without a code change.
 */
export const OFFICIAL_EMAIL = "mitracontentsupport@gmail.com";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || OFFICIAL_EMAIL;

export const COMPANY = {
  product: "Mitra",
  legalName: OPERATOR,
  /** How the operator is described: "an individual" now, e.g. "a private limited company" later. */
  operatorType: "an individual",
  address: "Bloomington, Indiana, United States",
  supportEmail: EMAIL,
  privacyEmail: EMAIL,
  /** Optional; leave empty to hide. */
  phone: "",
  grievanceOfficer: OPERATOR,
  grievanceEmail: EMAIL,
  /** Outreach to creators is sent from this account. */
  outreachEmail: EMAIL,
  governingLaw: "the State of Indiana, United States",
  jurisdictionCity: "Monroe County, Indiana",
  website: SITE_URL,
};

/** Date the current versions of the legal pages take effect. Update whenever the text changes. */
export const LEGAL_EFFECTIVE_DATE = "15 October 2026";

export function hasPlaceholders(): boolean {
  return Object.values(COMPANY).some((v) => v.includes("["));
}
