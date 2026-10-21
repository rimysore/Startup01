"""Run this at your plant, before sending anything. Standard-library Python, no network.

Replaces customer, supplier, part, job, PO and order identifiers with consistent codes, and drops anything the
audit doesn't need (prices, costs, descriptions, contact details). The same value always becomes the same code,
so the files still join, but nobody without your secret can turn a code back into a name. Keep the secret; we
never need it. To read our report against your real data, run with --key-file to get a lookup table that stays
with you.

    python3 sanitize.py exports/ sanitized/ --secret "pick-a-long-phrase" [--keep-descriptions] [--key-file key.csv]
"""
import argparse
import csv
import hashlib
import hmac
from pathlib import Path

# Which columns each export keeps, and which of those become codes.
KEEP = {
    "po_releases.csv": ["PONum", "POLine", "PORelNum", "VendorName", "PartNum", "Description", "RelQty", "ReceivedQty", "DueDate", "PromiseDt", "LastChangeDate"],
    "job_materials.csv": ["JobNum", "MtlSeq", "PartNum", "Description", "RequiredQty", "IssuedQty", "ReqDate", "JobStartDate"],
    "on_hand.csv": ["PartNum", "Description", "Warehouse", "OnhandQty"],
    "job_orders.csv": ["JobNum", "OrderNum", "CustomerName", "ShipByDate", "OrderValue"],
}
CODE = {"PONum": "PO", "VendorName": "SUP", "PartNum": "PRT", "JobNum": "JOB", "OrderNum": "SO", "CustomerName": "CUS", "Warehouse": "WH"}


def code(secret, kind, value):
    if value == "":
        return ""
    digest = hmac.new(secret.encode(), f"{kind}:{value}".encode(), hashlib.sha256).hexdigest()[:8].upper()
    return f"{kind}-{digest}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--secret", required=True, help="a long phrase only you know; use the same one every time")
    ap.add_argument("--keep-descriptions", action="store_true", help="keep part descriptions (helps us explain findings)")
    ap.add_argument("--round-order-values", action="store_true", default=True, help="round order values to the nearest $10K (default on)")
    ap.add_argument("--key-file", help="also write a code → real value table, for you to keep")
    a = ap.parse_args()
    src, dst = Path(a.src), Path(a.dst)
    dst.mkdir(parents=True, exist_ok=True)
    key = {}
    for name, cols in KEEP.items():
        path = src / name
        if not path.exists():
            print(f"skip {name}: not found")
            continue
        with open(path, newline="", encoding="utf-8-sig") as fh:
            rows = list(csv.DictReader(fh))
        cols = [c for c in cols if rows and c in rows[0] and (c != "Description" or a.keep_descriptions)]
        out = []
        for r in rows:
            o = {}
            for c in cols:
                v = (r.get(c) or "").strip()
                if c in CODE:
                    coded = code(a.secret, CODE[c], v)
                    key[coded] = v
                    v = coded
                elif c == "OrderValue" and v and a.round_order_values:
                    v = str(round(float(v) / 10_000) * 10_000)
                o[c] = v
            out.append(o)
        with open(dst / name, "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=cols)
            w.writeheader()
            w.writerows(out)
        dropped = sorted(set(rows[0]) - set(cols)) if rows else []
        print(f"{name}: {len(out)} rows, kept {len(cols)} columns" + (f", dropped {', '.join(dropped)}" if dropped else ""))
    if a.key_file:
        with open(a.key_file, "w", newline="") as fh:
            w = csv.writer(fh)
            w.writerow(["code", "real_value"])
            w.writerows(sorted(key.items()))
        print(f"key table (keep it, don't send it): {a.key_file}")


if __name__ == "__main__":
    main()
