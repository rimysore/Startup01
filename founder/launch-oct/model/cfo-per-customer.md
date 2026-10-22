# CFO: per-counted-customer pricing for cafés

Tool output: `cfo-E.md` (inputs in `numbers-E.json`). The comparison table comes from `per_customer.py` (run it with `python3 per_customer.py`). Amounts are in ₹, before GST, with the same fixed costs as `cfo.md`: ₹10,167 a month and no rep. This is not financial, tax or legal advice.

## The assumption that decides everything: how many customers each café gets
No café has counted customers with Mitra yet, so this spread is a guess. It matches the plan-D assumption that 70% of active cafés reach 10+ a month.

| Counted customers in a month | Share of active cafés, base case | Share, pessimistic case |
| --- | ---: | ---: |
| 0–4 (avg 2) | 15% | 30% |
| 5–9 (avg 7) | 15% | 25% |
| 10–15 (avg 12) | 25% | 20% |
| 16–24 (avg 20) | 25% | 15% |
| 25+ (avg 35) | 20% | 10% |

Active cafés grow 0, 0, 7, 14, 21, 29, 37, 46, 54, 63, 71, 80 (the ramp from `cfo.md`, assuming 70% of active cafés pay).

## Results (year 1, before the creator pass)
| Scheme | Avg bill per active café | Break-even (active cafés) | Year 1, base | Year 1, pessimistic |
| --- | ---: | ---: | ---: | ---: |
| D: ₹299 only in months with 10+ | ₹209 | 51 | -₹37,452 | -₹68,252 |
| ₹15 per customer, 5 free, cap ₹299 (my first suggestion) | ₹147 | 73 | -₹63,204 | -₹85,722 |
| **₹20 per customer, 3 free, cap ₹399 (recommended)** | **₹222** | **48** | **-₹32,301** | **-₹63,163** |
| ₹20 per customer, none free, cap ₹399 | ₹267 | 40 | -₹13,863 | -₹43,447 |
| ₹25 per customer, 3 free, cap ₹499 | ₹277 | 38 | -₹9,433 | -₹48,021 |

The tool's run of the recommended scheme gives -₹32,116 for year 1 (the difference is rounding). It needs about ₹63,500 in cash. With 20% fewer cafés, year 1 is -₹50,093.

## CFO's note
- **My first suggestion was too cheap.** ₹15 a customer with 5 free brings in about 30% less than plan D, because quiet cafés pay little and busy ones hit the ₹299 cap.
- **₹20 a customer, first 3 free, capped at ₹399 a month** is the fairest scheme that still earns at least as much as plan D, in both the base and the pessimistic case.
  - **For a café:** ₹20 for a customer who spends ₹250–400 is about 5–8% of that bill, with no fee for the first 3 customers and never more than ₹399 a month. The cap sits below the café panel's "getting expensive" median of ₹599.
  - **It removes the 10-customer cliff.** There is no point where one more customer suddenly costs ₹299, so a café gains nothing by not counting.
  - **For Mitra:** an average bill of ₹222 and break-even at 48 active cafés, against 51 under plan D.
- **Adding the ₹199 creator pass from month 7** (135 passes, +₹26,190) makes year 1 about **-₹6,000**, and every month from about month 8 is profitable.
- **If you want more margin, drop the free customers** rather than raising the per-customer price. That gives -₹13,863 in year 1, but it removes the "first 3 free" line that makes the first message easy to say yes to. My advice is to keep the free 3 at launch and review after 3 months of real counts.
- **The pessimistic case:** if only 45% of cafés reach 10 customers, every scheme loses ₹43,000–86,000 in year 1. The count spread matters more than the price. Measure it in the 2-week test before choosing.
- **Fees:** Razorpay takes 2% plus GST on every bill. Small bills (₹20–60) cost about ₹1 each. Collecting by UPI request once a month keeps that to one charge per café.
