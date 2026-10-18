# Where the CFO numbers come from

- "per day" in numbers.json means per month (days_per_month = 1): volumes are paying creators in that month.
- Price ₹83.90 = ₹99 Pro price with 18% GST taken out (GST is inside the ₹99). Source: creator-app/src/lib/plans.ts.
- AI ₹23 and reports ₹2 per Pro creator: founders' estimate in creator-app/docs/UNIT_ECONOMICS.md (Oct 2026), from token counts × published model prices at ₹88/$. **Estimate**: replace with Admin → AI costs once paying users exist.
- Razorpay: ~2% of ₹99 + 18% GST on the fee ≈ ₹2.34 (Razorpay's published standard rate; confirm on your account).
- Fixed: Vercel Pro $20, Neon $0–19, Cloudflare $0–5, domain (UNIT_ECONOMICS.md). Midpoint used. **Estimate.**
- Free/Founder users: ~₹7 each (UNIT_ECONOMICS.md), 100 assumed. **Estimate.**
- Founder salaries: ₹0 — the founders are unpaid. This flatters every number below.
- Startup spend and the ramp (0 → 100 paying creators in year 1, plan 150): **pure estimates**, not from data. There are 0 paying customers today and billing is off.
