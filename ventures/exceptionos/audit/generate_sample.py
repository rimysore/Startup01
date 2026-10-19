"""Synthetic, Epicor-shaped exports for a fictional machinery shop. No real company or customer data.

Writes four CSVs in the same shape a planner would export from Epicor Kinetic (field names follow common Epicor
tables; confirm against your own system):
  po_releases.csv   PORel + PODetail + Vendor: one row per open PO release
  job_materials.csv JobMtl + JobHead: one row per open job material requirement
  on_hand.csv       PartWhse: on-hand quantity per purchased part
  job_orders.csv    JobProd + OrderHed: which customer order each job builds, ship-by date and value
"""
import csv
import random
from datetime import date, timedelta
from pathlib import Path

AS_OF = date(2026, 10, 19)
OUT = Path(__file__).parent / "sample_data"
rng = random.Random(7)

SUPPLIERS = ["Midwest Bearing Supply", "Great Lakes Castings", "Precision Motion Inc", "Allied Hydraulics", "Keystone Fasteners",
             "Northern Electric Controls", "Tri-State Steel Service", "Summit Sensors"]
PARTS = [
    ("BRG-6205-2RS", "Ball bearing 6205-2RS", 0), ("BRG-22216", "Spherical roller bearing 22216", 0), ("CST-GBX-110", "Gearbox housing casting 110", 1),
    ("CST-BRK-40", "Bracket casting 40", 1), ("SRV-750W", "Servo motor 750W", 2), ("LNR-RAIL-25", "Linear rail 25mm x 1200", 2),
    ("HYD-CYL-63", "Hydraulic cylinder 63 bore", 3), ("HYD-PMP-12", "Gear pump 12cc", 3), ("FST-M12-KIT", "M12 fastener kit", 4),
    ("FST-SHCS-M8", "SHCS M8x30 (box)", 4), ("PLC-1769", "PLC controller", 5), ("VFD-7K5", "VFD 7.5kW", 5), ("HMI-10", "10in HMI panel", 5),
    ("STL-PL-12", "Plate steel 12mm", 6), ("STL-TUBE-80", "Square tube 80x80", 6), ("SNS-PROX-18", "Proximity sensor M18", 7),
    ("SNS-ENC-1024", "Rotary encoder 1024ppr", 7), ("SNS-LC-500", "Load cell 500kg", 7),
]
CUSTOMERS = ["Riverbend Packaging", "Hartwell Foods", "Cobalt Plastics", "Delta Agri Equipment", "Northgate Logistics", "Pinecrest Paper"]


def d(n):
    return (AS_OF + timedelta(days=n)).isoformat()


def main():
    OUT.mkdir(exist_ok=True)
    # Jobs and their customer orders
    jobs = []
    for i in range(28):
        start = rng.randint(2, 40)
        jobs.append({"JobNum": f"J{4100 + i}", "StartDate": start, "ShipBy": start + rng.randint(10, 25),
                     "OrderNum": 51000 + i // 2, "Customer": CUSTOMERS[(i // 2) % len(CUSTOMERS)],
                     "OrderValue": rng.choice([18_500, 42_000, 66_000, 95_000, 140_000, 210_000])})
    # Material requirements: each job needs 4-7 purchased parts, required on its start date (+ a few days for later ops)
    mtl = []
    for j in jobs:
        for p in rng.sample(PARTS, rng.randint(4, 7)):
            qty = rng.choice([1, 2, 2, 4, 6, 8, 12]) if not p[0].startswith("FST") else rng.choice([1, 2, 3])
            mtl.append({"JobNum": j["JobNum"], "MtlSeq": len([m for m in mtl if m["JobNum"] == j["JobNum"]]) * 10 + 10, "PartNum": p[0],
                        "Description": p[1], "RequiredQty": qty, "IssuedQty": 0, "ReqDate": d(j["StartDate"] + rng.choice([0, 0, 0, 2, 5])),
                        "JobStartDate": d(j["StartDate"])})
    # On hand: a little stock per part (10-35% of demand), consumed by the earliest jobs.
    demand = {}
    for m in mtl:
        demand[m["PartNum"]] = demand.get(m["PartNum"], 0) + m["RequiredQty"]
    on_hand = [{"PartNum": p[0], "Description": p[1], "Warehouse": "MAIN", "OnhandQty": int(demand.get(p[0], 0) * rng.uniform(0.1, 0.35))} for p in PARTS]
    # Open PO releases, planned just in time the way MRP does: whatever stock doesn't cover, one release per job
    # requirement, due 2-6 days before it's needed. Then suppliers respond: most confirm, some push the promise
    # date (only the promise date is updated, the due date stays), a few haven't acknowledged at all.
    rels, po = [], 21000
    for p in PARTS:
        stock = next(o["OnhandQty"] for o in on_hand if o["PartNum"] == p[0])
        for r in sorted((m for m in mtl if m["PartNum"] == p[0]), key=lambda m: (m["ReqDate"], m["JobNum"])):
            use = min(stock, r["RequiredQty"])
            stock -= use
            qty = r["RequiredQty"] - use
            if qty <= 0:
                continue
            due = max(date.fromisoformat(r["ReqDate"]) - timedelta(days=rng.randint(2, 6)), AS_OF + timedelta(days=1))
            roll = rng.random()
            if roll < 0.03:
                # The buyer already re-dated this PO: due date moved past the need date (visible in Epicor today).
                due = date.fromisoformat(r["ReqDate"]) + timedelta(days=rng.randint(2, 6))
                promise = due
            elif roll < 0.68:
                promise = due
            elif roll < 0.9:
                promise = due + timedelta(days=rng.choice([1, 2, 3, 5, 7, 10, 14, 21]))
            else:
                promise = None
            po += 1
            rels.append({"PONum": po, "POLine": 1, "PORelNum": 1, "VendorName": SUPPLIERS[p[2]], "PartNum": p[0], "Description": p[1],
                         "RelQty": qty, "ReceivedQty": 0, "DueDate": due.isoformat(), "PromiseDt": promise.isoformat() if promise else "",
                         "LastChangeDate": d(-rng.randint(0, 6)) if promise and promise != due else ""})
    jo = [{"JobNum": j["JobNum"], "OrderNum": j["OrderNum"], "CustomerName": j["Customer"], "ShipByDate": d(j["ShipBy"]), "OrderValue": j["OrderValue"]} for j in jobs]
    for name, rows in [("po_releases", rels), ("job_materials", mtl), ("on_hand", on_hand), ("job_orders", jo)]:
        with open(OUT / f"{name}.csv", "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
    print(f"wrote {len(rels)} PO releases, {len(mtl)} job material lines, {len(on_hand)} parts, {len(jo)} jobs to {OUT}")


if __name__ == "__main__":
    main()
