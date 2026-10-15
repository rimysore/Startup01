/**
 * Who operates Mitra, shown on the legal and contact pages. During the beta Mitra is run by an individual;
 * when a company is registered, change legalName/operatorType/address (and the governing law in the Terms).
 * The legal pages show a warning banner while any [bracketed] placeholder remains.
 */
const OPERATOR = "[Your full legal name]";

export const COMPANY = {
  product: "Mitra",
  legalName: OPERATOR,
  /** How the operator is described: "an individual" now, e.g. "a private limited company" later. */
  operatorType: "an individual",
  address: "Bloomington, Indiana, United States",
  supportEmail: "support@mitracreators.com",
  privacyEmail: "privacy@mitracreators.com",
  /** Optional; leave empty to hide. */
  phone: "",
  grievanceOfficer: OPERATOR,
  grievanceEmail: "grievance@mitracreators.com",
  governingLaw: "the State of Indiana, United States",
  jurisdictionCity: "Monroe County, Indiana",
  website: "https://mitracreators.com",
};

/** Date the current versions of the legal pages take effect. Update whenever the text changes. */
export const LEGAL_EFFECTIVE_DATE = "15 October 2026";

export function hasPlaceholders(): boolean {
  return Object.values(COMPANY).some((v) => v.includes("["));
}
