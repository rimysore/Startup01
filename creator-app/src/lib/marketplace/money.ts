import { z } from "zod";

/*
 * Deal money. A deal is a base fee for making and posting (or barter instead), plus an optional bonus for every
 * customer who redeems the creator's code, up to a cap. All of it goes to the creator; Mitra takes no cut
 * (businesses pay for the platform instead; see docs/BUSINESS_MODEL.md).
 */

export type Terms = { kind: "paid" | "barter"; feeInr: number | null; barterNote: string | null; bonusPerCustomerInr: number | null; bonusCapInr: number | null };

const inrAmount = z.coerce.number().int().min(0).max(10_000_000);
const optAmount = z.union([inrAmount, z.literal("").transform(() => null), z.null()]).optional();

/** The money part of an invite or tracked post. A bonus needs a per-customer amount; a cap can't be below it. */
export const TermsInput = z
  .object({
    kind: z.enum(["paid", "barter"]).default("paid"),
    feeInr: optAmount,
    barterNote: z.union([z.string().trim().max(160), z.null()]).optional(),
    bonusPerCustomerInr: optAmount,
    bonusCapInr: optAmount,
  })
  .refine((t) => t.kind === "barter" || (t.feeInr ?? 0) > 0 || (t.bonusPerCustomerInr ?? 0) > 0, { message: "A paid deal needs a fee or a bonus", path: ["feeInr"] })
  .refine((t) => t.kind === "paid" || Boolean(t.barterNote?.trim()), { message: "Say what the creator gets", path: ["barterNote"] })
  .refine((t) => !t.bonusCapInr || (t.bonusPerCustomerInr ?? 0) > 0, { message: "A cap needs a bonus per customer", path: ["bonusCapInr"] })
  .refine((t) => !t.bonusCapInr || !t.bonusPerCustomerInr || t.bonusCapInr >= t.bonusPerCustomerInr, { message: "The cap is below one customer's bonus", path: ["bonusCapInr"] });

/** Normalises parsed input: barter has no fee, paid has no barter note, zero bonus means none. */
export function terms(t: z.infer<typeof TermsInput>): Terms {
  const bonus = t.bonusPerCustomerInr || null;
  return {
    kind: t.kind,
    feeInr: t.kind === "paid" ? (t.feeInr ?? null) : null,
    barterNote: t.kind === "barter" ? (t.barterNote?.trim() || null) : null,
    bonusPerCustomerInr: bonus,
    bonusCapInr: bonus ? t.bonusCapInr || null : null,
  };
}

/** Terms from a stored row (invite, deal or tracked post). */
export function termsOf(r: { kind?: string | null; feeInr?: number | null; baseFeeInr?: number | null; barterNote?: string | null; barter?: string | null; bonusPerCustomerInr: number | null; bonusCapInr: number | null }): Terms {
  const barterNote = r.barterNote ?? r.barter ?? null;
  return {
    kind: r.kind === "barter" || (!r.kind && barterNote && !(r.feeInr ?? r.baseFeeInr)) ? "barter" : "paid",
    feeInr: r.feeInr ?? r.baseFeeInr ?? null,
    barterNote,
    bonusPerCustomerInr: r.bonusPerCustomerInr,
    bonusCapInr: r.bonusCapInr,
  };
}

/** Bonus earned for this many counted customers. */
export function bonusDue(t: Pick<Terms, "bonusPerCustomerInr" | "bonusCapInr">, customers: number): number {
  if (!t.bonusPerCustomerInr || customers <= 0) return 0;
  const raw = t.bonusPerCustomerInr * customers;
  return t.bonusCapInr ? Math.min(raw, t.bonusCapInr) : raw;
}

/** What the creator is owed so far: base fee plus bonus earned. */
export const amountDue = (t: Pick<Terms, "feeInr" | "bonusPerCustomerInr" | "bonusCapInr">, customers: number) => (t.feeInr ?? 0) + bonusDue(t, customers);

/** The most the creator can earn (null when the bonus has no cap). */
export function maxEarn(t: Pick<Terms, "feeInr" | "bonusPerCustomerInr" | "bonusCapInr">): number | null {
  if (t.bonusPerCustomerInr && !t.bonusCapInr) return null;
  return (t.feeInr ?? 0) + (t.bonusCapInr ?? 0);
}

/** Money spent per counted customer (none until a customer is counted, or when nothing is paid). */
export function costPerCustomer(t: Pick<Terms, "feeInr" | "bonusPerCustomerInr" | "bonusCapInr">, customers: number): number | null {
  const spent = amountDue(t, customers);
  return customers > 0 && spent > 0 ? Math.round(spent / customers) : null;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** The terms in one plain sentence, for offers the checker reads and messages people see. */
export function termsText(t: Terms): string {
  const base = t.kind === "barter" ? (t.barterNote ? `${t.barterNote} (barter)` : "barter") : t.feeInr ? `${inr(t.feeInr)} for the post` : "";
  const bonus = t.bonusPerCustomerInr ? `${inr(t.bonusPerCustomerInr)} for every customer who uses your code${t.bonusCapInr ? `, up to ${inr(t.bonusCapInr)}` : ""}` : "";
  return [base, bonus].filter(Boolean).join(" plus ");
}
