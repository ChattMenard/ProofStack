# ⚠️ SSL Certificate Error - DNS Zone Not Enabled

**Error:** "DNS zone not enabled for proofstacked.com. Cannot solve dns-01 ACME cert challenge."

**Status:** ⏳ DNS propagation in progress

---

## What This Means

Vercel detected your domain but DNS nameservers haven't fully propagated globally yet. The SSL certificate can't be issued until Vercel's DNS is fully resolving.

**Timeline:**
- ✅ You updated nameservers in registrar
- 🟡 Vercel confirmed domain added (showing 307 error)
- ⏳ Global DNS still propagating (24-48 hours)
- ⏳ SSL certificate waiting for full propagation
- 🚀 (Soon) Everything works automatically

---

## What You Need To Do

### Option 1: Wait (Recommended)

**Best approach:**
1. DNS takes 24-48 hours to propagate globally
2. Vercel auto-retries SSL cert every 5-10 minutes
3. SSL will auto-provision when DNS fully propagates
4. **No action needed** - just wait

**Check status:**
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Watch for status to change from 307/error to ✅

**Timeline:**
- Now: Domain added, waiting for DNS
- 1-4 hours: Most DNS servers updated
- 4-24 hours: Global propagation continues
- 24-48 hours: 100% propagated, SSL provisions

---

### Option 2: Verify DNS Is Actually Updated (5 minutes)

Check if nameservers changed in your registrar:

```powershell
# Run this in PowerShell
nslookup -type=NS proofstacked.com
```

**Expected output (shows Vercel nameservers):**
```
proofstacked.com  nameserver = ns1.vercel-dns.com
proofstacked.com  nameserver = ns2.vercel-dns.com
```

**If still shows old nameservers:**
- Go back to your registrar
- Confirm nameservers still point to Vercel's
- Some registrars revert changes - reapply if needed
- Wait another 5-10 minutes before retrying

---

### Option 3: Force Vercel to Retry SSL (Advanced)

**If DNS is confirmed updated but SSL still failing:**

1. Go to Vercel Dashboard
2. Settings → Domains → proofstacked.com
3. Click the three dots (⋮) → Remove domain
4. Wait 1 minute
5. Click "Add Domain" again
6. Enter `proofstacked.com`
7. Select "Use Vercel's Nameservers"
8. Wait 5 minutes

This forces Vercel to regenerate the SSL certificate request.

---

## Verify Everything Is Working

### Check 1: Nameservers Updated?
```powershell
nslookup -type=NS proofstacked.com
```
Should show:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

### Check 2: DNS Resolves to Vercel IP?
```powershell
nslookup proofstacked.com
```
Should show IP: `76.76.21.21` (Vercel)

### Check 3: A Records Set?
```powershell
nslookup -type=A proofstacked.com
```
Should show: `76.76.21.21` (Vercel's IP)

---

## Common Reasons for "DNS Zone Not Enabled"

| Issue | Cause | Fix |
|-------|-------|-----|
| DNS still propagating | Too soon after nameserver change | Wait 24-48 hours |
| Nameservers not updated | Registrar settings not saved | Go back to registrar, confirm they're still Vercel's |
| Partial propagation | ISP cache outdated | Clear DNS cache: `ipconfig /flushdns` |
| Wrong nameservers | Accidentally used different ones | Verify with `nslookup -type=NS proofstacked.com` |
| Registrar reverted changes | Some registrars auto-revert | Log back in, reapply nameservers |

---

## DNS Propagation Checker Tools

Use these to verify DNS is working:

**WHATSMYDNS.net:**
- Go to https://www.whatsmydns.net/
- Enter: `proofstacked.com`
- Check "A" record
- Should show mostly green checkmarks with IP `76.76.21.21`

**DNSChecker.org:**
- Go to https://dnschecker.org/
- Enter: `proofstacked.com`
- Select record type: "A"
- Should show `76.76.21.21` across all locations

**Result you're looking for:**
- At least 50%+ of global DNS servers showing Vercel IP
- Ideally 90%+ within 24 hours
- 100% within 48 hours

---

## If Still Not Working After 48 Hours

### Step 1: Verify Registrar Changes Saved
```
1. Log into your domain registrar
2. Go to nameserver settings
3. Confirm nameservers are STILL:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
4. If they reverted, reapply them
```

### Step 2: Clear DNS Cache
```powershell
# Windows DNS cache
ipconfig /flushdns

# Try different DNS server
nslookup proofstacked.com 8.8.8.8

# Or
nslookup proofstacked.com 1.1.1.1
```

### Step 3: Force Vercel Re-verification
```
1. Vercel Dashboard → Settings → Domains
2. Remove proofstacked.com
3. Wait 2 minutes
4. Click "Add Domain"
5. Add proofstacked.com again
6. Select "Use Vercel's Nameservers"
7. Wait 10 minutes
```

### Step 4: Contact Support
If still failing after these steps:
- **Vercel Support:** https://vercel.com/help
- **Your Registrar Support:** (check your domain receipt for contact info)

---

## In The Meantime

### Your Site IS Live

✅ Temporary URL works:
- https://proofstack-two.vercel.app/forum

### Will Work Soon

✅ Production domain will work:
- https://proofstacked.com/forum (once SSL provisions)

### What To Do Now

1. **Test forum on temporary URL** to ensure everything works
2. **Wait for DNS propagation** (24-48 hours typically)
3. **Verify nameservers** with `nslookup` command above
4. **Monitor Vercel dashboard** for SSL cert status change

---

## Expected Timeline

| Hour | Status | Action |
|------|--------|--------|
| 0 | ⏳ Domain added to Vercel | Check Vercel dashboard |
| 1-4 | 🟡 Partial DNS propagation | SSL cert provisioning |
| 4-12 | 🟡 Most DNS servers updated | SSL cert provisioning |
| 12-24 | 🟡 ~90% global propagation | SSL cert provisioning |
| 24-48 | ✅ Full DNS propagation | SSL certificate auto-provisions |
| 48+ | 🚀 LIVE | proofstacked.com fully functional |

---

## Current Status

**✅ Done:**
- Domain registered
- Nameservers updated in registrar
- Domain added to Vercel
- Waiting for DNS propagation

**⏳ In Progress:**
- Global DNS propagation (24-48 hours)
- SSL certificate provisioning (after DNS ready)

**🚀 Soon:**
- Full production deployment
- proofstacked.com live with HTTPS

---

## Recommended Next Action

**Right now:**
```powershell
# Check current DNS status
nslookup -type=NS proofstacked.com
```

**If shows Vercel nameservers:**
- ✅ Everything is correct
- ⏳ Just wait 24-48 hours
- 🔄 SSL will auto-provision

**If shows old nameservers:**
- ⚠️ Go back to registrar
- Confirm and reapply Vercel nameservers
- Wait 5-10 minutes
- Retry nslookup

**No action needed** if nameservers are correct - DNS just needs time to propagate globally!

---

*Troubleshooting guide created: October 29, 2025*  
*Expected resolution: October 30-31, 2025*
