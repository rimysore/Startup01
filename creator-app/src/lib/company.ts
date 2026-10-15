/**
 * Business details shown on the legal and contact pages. Replace every [bracketed] value before launch;
 * the legal pages show a warning banner while any placeholder remains.
 */
export const COMPANY = {
  product: "Mitra",
  legalName: "[Registered company name, e.g. Mitra Labs Private Limited]",
  address: "[Registered office address, City, State, PIN]",
  supportEmail: "[support@your-domain.com]",
  privacyEmail: "[privacy@your-domain.com]",
  phone: "[+91 phone number]",
  grievanceOfficer: "[Name of Grievance Officer]",
  grievanceEmail: "[grievance@your-domain.com]",
  jurisdictionCity: "[City]",
  website: "[https://your-domain.com]",
};

/** Date the current versions of the legal pages take effect. Update whenever the text changes. */
export const LEGAL_EFFECTIVE_DATE = "15 October 2026";

export function hasPlaceholders(): boolean {
  return Object.values(COMPANY).some((v) => v.includes("["));
}
