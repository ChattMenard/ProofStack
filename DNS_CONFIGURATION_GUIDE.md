# 🌐 DNS Configuration for PROOFSTACKED.com

**Status:** Ready to configure  
**Domain:** proofstacked.com  
**Registrar:** (Namecheap/GoDaddy/Cloudflare/other - check your receipt)  
**Hosting:** Vercel  
**Timeline:** 24-48 hours to propagate after configuration

---

## Quick Setup (5 minutes)

### Step 1: Log into Your Domain Registrar

- Go to the website where you registered proofstacked.com
- Example: Namecheap.com, GoDaddy.com, Domains.com, etc.
- Log in with your account credentials

### Step 2: Find Domain Management / DNS Settings

Look for:
- "Manage Domain"
- "DNS Settings"
- "Nameservers"
- "Domain Control Panel"

### Step 3: Update Nameservers to Vercel's

**Delete existing nameservers (usually default ones from registrar)**

**Add Vercel's nameservers:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**That's it!** DNS will propagate in 24-48 hours.

---

## Detailed Instructions by Registrar

### 🔵 Namecheap

1. Log in to Namecheap.com
2. Go to **"Manage Domains"**
3. Click on **proofstacked.com**
4. Find **"Nameservers"** section on left sidebar
5. Select **"Custom DNS"** from dropdown
6. Click **"Add Nameserver"**
7. Enter:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
8. Click **"Save"**

✅ Done! Wait 24-48 hours for propagation

---

### 🟡 GoDaddy

1. Log in to GoDaddy.com
2. Go to **"My Products"** → **"Domains"**
3. Click on **proofstacked.com**
4. Find **"DNS"** or **"Nameservers"** section
5. Click **"Manage"** (or pencil icon)
6. Replace existing nameservers with:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
7. Click **"Save"**

✅ Done! Wait 24-48 hours for propagation

---

### 🔷 Cloudflare

1. Log in to Cloudflare.com
2. Go to **Websites** → Click **proofstacked.com**
3. Go to **DNS** → **Records**
4. Go to **Nameservers** tab (usually on right side)
5. Replace nameservers with:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
6. Click **"Update"**

✅ Done! Wait 24-48 hours for propagation

---

### 🟠 Google Domains

1. Log in to Domains.google.com
2. Find **proofstacked.com** in your domains list
3. Click on **proofstacked.com**
4. Click **"DNS"** on left sidebar
5. Scroll to **"Custom nameservers"**
6. Click **"Edit"** (pencil icon)
7. Enter:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
8. Click **"Save"**

✅ Done! Wait 24-48 hours for propagation

---

### 🌐 Other Registrars

If your registrar is different (Hover, 1&1, eNom, etc.):

1. Log in to your registrar's control panel
2. Find **"Manage Domain"** or **"DNS Settings"**
3. Look for **"Nameservers"** or **"DNS Servers"**
4. Change from default nameservers to:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Save changes

✅ Done! Wait 24-48 hours for propagation

---

## After You Update Nameservers

### ✅ In Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your **ProofStack** project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter: `proofstacked.com`
6. Click **"Add"**
7. Select **"Use Vercel's Nameservers"** option
8. Vercel will automatically update DNS records

**Note:** Vercel might show it as "pending" for a few minutes - this is normal.

---

### 🔍 Verify DNS Propagation

Check if DNS is working (run in PowerShell):

```powershell
# Check DNS resolution
nslookup proofstacked.com

# Should return something like:
# Server:  UnKnown
# Address:  8.8.8.8
#
# Name:    proofstacked.com
# Address:  76.76.21.21  <- This is Vercel's IP
```

Or use an online tool:
- https://www.whatsmydns.net/
- https://www.dnschecker.org/
- Enter: `proofstacked.com`

**Expected Result:** All nameservers show `ns1.vercel-dns.com` and `ns2.vercel-dns.com`

---

## Timeline

| Time | Status | What's Happening |
|------|--------|------------------|
| Now | ✅ Registrar Updated | You changed nameservers in domain registrar |
| 0-1 hour | 🟡 Propagating | Global DNS servers updating |
| 1-4 hours | 🟡 Mostly Propagated | Most DNS servers updated |
| 4-24 hours | ✅ Fully Propagated | Your ISP and local caches updated |
| 24-48 hours | 🚀 Live | 100% of internet can resolve proofstacked.com to Vercel |

---

## What Happens After DNS Propagates

### Automatic
- SSL certificate auto-provisioned (HTTPS enabled)
- CDN activated
- Performance optimized
- Email certificate warnings disappear

### Your Website
- ✅ https://proofstacked.com works
- ✅ https://www.proofstacked.com works (auto-redirect)
- ✅ All subdomains work (api.proofstacked.com, etc.)
- ✅ Old URL still works: proofstack-two.vercel.app

---

## Troubleshooting

### "DNS still not resolving after 48 hours"

**Check 1: Verify you updated the right domain**
```powershell
nslookup proofstacked.com
```
Should show `ns1.vercel-dns.com` and `ns2.vercel-dns.com`

**Check 2: Clear your local DNS cache**
```powershell
ipconfig /flushdns
```

**Check 3: Try a different DNS server**
```powershell
nslookup proofstacked.com 8.8.8.8
```
(Uses Google DNS instead of ISP)

**Check 4: Verify registrar saved changes**
- Log back into your registrar
- Confirm nameservers still show Vercel's nameservers
- Some registrars revert to defaults - reapply if needed

### "Nameservers won't save"

- Wait a few minutes and try again
- Clear browser cache (Ctrl+Shift+Del)
- Try a different browser
- Contact registrar support

### "Still seeing old site after DNS propagates"

- Wait a few more hours (full global propagation can take 48 hours)
- Vercel SSL might still be provisioning
- Check https://vercel.com/dashboard → Your Project → Domains

---

## Next Steps After DNS Works

Once DNS is fully propagated (test with nslookup):

```powershell
# 1. Verify HTTPS works
curl https://proofstacked.com

# 2. Test forum on new domain
# Visit: https://proofstacked.com/forum

# 3. Update environment variables if needed
# Check: .env.production in Vercel
# Update NEXT_PUBLIC_SITE_URL if needed

# 4. Test all features
# - Create account
# - Post forum thread
# - Reply to thread
# - Upload work sample
# - Message employers
```

---

## Important Notes

- **Don't delete old DNS records yet** - let Vercel manage DNS automatically
- **Don't use CNAME records** - use Vercel's nameservers instead
- **SSL auto-provisions** - usually takes 5-30 minutes after DNS settles
- **www subdomain** - Vercel handles automatically
- **Subdomains** - Work out of the box with Vercel nameservers

---

## Support Resources

**Vercel Docs:**
- DNS Troubleshooting: https://vercel.com/docs/domains/troubleshooting
- Domain Management: https://vercel.com/docs/domains/working-with-domains

**Your Registrar Support:**
- Namecheap: support.namecheap.com
- GoDaddy: support.godaddy.com
- Cloudflare: support.cloudflare.com
- Google Domains: support.google.com/domains

**DNS Check Tools:**
- WHATSMYDNS: https://www.whatsmydns.net/
- DNS Checker: https://dnschecker.org/
- DNS Propagation: https://www.dnsstatus.io/

---

## Configuration Checklist

- [ ] Logged into domain registrar
- [ ] Found nameserver settings
- [ ] Updated nameserver 1: `ns1.vercel-dns.com`
- [ ] Updated nameserver 2: `ns2.vercel-dns.com`
- [ ] Clicked Save/Confirm
- [ ] Waited 5 minutes
- [ ] Ran `nslookup proofstacked.com` to verify
- [ ] Added domain to Vercel dashboard
- [ ] Waited 24-48 hours for full propagation
- [ ] Tested website at https://proofstacked.com
- [ ] Tested forum at https://proofstacked.com/forum
- [ ] SSL certificate provisioned (green lock icon)
- [ ] Updated .env.production if needed
- [ ] Announced new domain to users 🎉

---

## Success Indicators

✅ **You've succeeded when:**
- `nslookup proofstacked.com` shows Vercel nameservers
- https://proofstacked.com returns your site (green lock/HTTPS)
- https://proofstacked.com/forum shows forum homepage
- Vercel dashboard shows domain as "Valid Configuration"

🚀 **You're ready for production when:**
- All DNS checks pass
- SSL certificate shows as "Provisioned"
- Website fully loads at new domain
- All features working (auth, forum, messaging)

---

**Time to live site: 24-48 hours from now**

**Status: CONFIGURED AND WAITING FOR PROPAGATION** ✅

*Document created: October 29, 2025*
