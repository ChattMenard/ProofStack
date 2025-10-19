# Custom Subdomain Setup Guide

## Overview
ProofStack now supports custom subdomains for user portfolios on Vercel!

## How It Works

### Current Setup (Free)
- **Main site:** `https://proofstack.vercel.app`
- **User portfolios:** `https://username.proofstack.vercel.app`
- **Fallback:** `https://proofstack.vercel.app/portfolio/username`

### Username Generation
- Automatically extracts from email: `mattchenard2009@gmail.com` → `mattchenard2009`
- Sanitizes to alphanumeric: removes special characters, converts to lowercase
- Used for both subdomain and path-based routing

## Vercel Configuration

### 1. Enable Wildcard Subdomains
Go to Vercel project settings:
1. Navigate to: https://vercel.com/[your-username]/proofstack/settings/domains
2. Click **"Add Domain"**
3. Add: `*.proofstack.vercel.app`
4. Vercel will automatically configure SSL for all subdomains

### 2. Environment Variables
Make sure these are set in Vercel:
```bash
NEXT_PUBLIC_VERCEL_URL=proofstack.vercel.app
```

## Files Modified

### `vercel.json`
Added subdomain rewrites and security headers:
```json
{
  "rewrites": [
    {
      "source": "/:username",
      "destination": "/portfolio/:username",
      "has": [
        {
          "type": "host",
          "value": "(?<subdomain>.*)\\.proofstack\\.vercel\\.app"
        }
      ]
    }
  ]
}
```

### `middleware.ts` (if created)
Handles subdomain routing at the edge for better performance.

### `lib/domains.ts`
Utilities for:
- `getUserSubdomain(email)` - Extract username from email
- `getSubdomainUrl(email)` - Generate full subdomain URL
- `isCustomDomain(hostname)` - Detect if request is from custom domain

### `app/dashboard/page.tsx`
Shows user their custom subdomain URL with copy button.

## Testing Locally

Local development uses path-based routing:
- **Main site:** `http://localhost:3000`
- **Portfolio:** `http://localhost:3000/portfolio/username`

To test subdomain routing locally:
1. Edit your hosts file: `C:\Windows\System32\drivers\etc\hosts`
2. Add: `127.0.0.1 mattchenard.localhost`
3. Visit: `http://mattchenard.localhost:3000`

## Future: Custom Domains (Premium Feature)

When you buy `proofstack.com`:

### Setup
1. Add domain to Vercel project
2. Configure DNS records at your registrar:
   ```
   A     @           76.76.21.21
   CNAME *           cname.vercel-dns.com
   ```
3. Update `NEXT_PUBLIC_VERCEL_URL=proofstack.com`

### Pro User Custom Domains
For Pro subscribers wanting their own domain:
1. User provides their domain: `john.dev`
2. They add CNAME: `john.dev` → `cname.vercel-dns.com`
3. You add domain to Vercel project
4. Update user's profile with custom domain
5. Portfolio accessible at: `https://john.dev`

## Troubleshooting

### Subdomain not working?
1. Verify wildcard domain added in Vercel settings
2. Check `NEXT_PUBLIC_VERCEL_URL` environment variable
3. Wait 5-10 minutes for DNS propagation
4. Try clearing browser cache

### SSL errors?
- Vercel automatically provisions SSL for all subdomains
- Can take up to 10 minutes for new subdomains
- Check Vercel deployment logs for SSL provisioning status

### Build errors?
- Ensure `vercel.json` is valid JSON
- Check that `lib/domains.ts` exports are correct
- Verify no TypeScript errors in modified files

## Benefits

### For Users
- ✅ Professional portfolio URL
- ✅ Easy to share and remember
- ✅ SEO-friendly
- ✅ Looks more credible than path-based URLs

### For Platform
- ✅ Better branding
- ✅ Premium feature differentiation
- ✅ Scalable architecture
- ✅ No additional infrastructure costs (on Vercel)

## Next Steps

1. **Test deployment** - Visit your subdomain after deploy completes
2. **Update documentation** - Add subdomain info to README
3. **Marketing** - Highlight custom subdomains in landing page
4. **Premium tier** - Use as selling point for Pro subscriptions
5. **Custom domains** - Implement for Pro users ($9/mo value!)
