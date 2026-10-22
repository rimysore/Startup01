# Counted customers per active café per month: (share, avg count). 70% reach 10+, matching plan D.
BASE=[(.15,2),(.15,7),(.25,12),(.25,20),(.20,35)]
LOW=[(.30,2),(.25,7),(.20,12),(.15,20),(.10,35)]   # pessimistic: only 45% reach 10+
active=[0,0,7,14,21,29,37,46,54,63,71,80]; FIXED=10167; WA=4
def fee(n,s):
    if s=="D": return 299 if n>=10 else 0
    per,free,cap=s; return min(cap,max(0,n-free)*per)
def per_cafe(s,dist):
    rev=sum(p*fee(n,s) for p,n in dist)
    cost=sum(p*(fee(n,s)*0.0236) for p,n in dist)+WA
    return rev,rev-cost
schemes={"D: ₹299 if 10+":"D","₹15/cust, 5 free, cap ₹299":(15,5,299),"₹20/cust, 3 free, cap ₹399":(20,3,399),"₹25/cust, 3 free, cap ₹499":(25,3,499),"₹20/cust, 0 free, cap ₹399":(20,0,399)}
for name,s in schemes.items():
    for dn,d in (("base",BASE),("low",LOW)):
        r,c=per_cafe(s,d); yr=sum(a*c for a in active)-FIXED*12
        print(f"{name:30s} {dn:4s} rev/café ₹{r:6.0f} contrib ₹{c:6.0f} breakeven {FIXED/c:5.0f} cafés  year1 ₹{yr:9,.0f}  y1rev ₹{sum(a*r for a in active):9,.0f}")
