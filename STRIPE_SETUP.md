# Stripe Integration Setup Guide

## 🎯 Quick Start

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete verification
3. Go to Dashboard

### 2. Get API Keys
1. Dashboard → Developers → API keys
2. Copy **Secret key** → Add to `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   ```

### 3. Create Products & Prices
1. Dashboard → Products → **Create product**
2. **Product 1: ProofStack Pro Monthly**
   - Name: ProofStack Pro Monthly
   - Price: $9.00 USD
   - Billing: Recurring - Monthly
   - Copy price ID (starts with `price_`)
   
3. **Product 2: ProofStack Pro Yearly**
   - Name: ProofStack Pro Yearly  
   - Price: $90.00 USD
   - Billing: Recurring - Yearly
   - Copy price ID

4. Add to `.env.local`:
   ```bash
   STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
   STRIPE_PRO_YEARLY_PRICE_ID=price_yyy
   ```

### 4. Configure Webhook
1. Dashboard → Developers → Webhooks → **Add endpoint**
2. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy **Signing secret** → Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

### 5. Enable Customer Portal
1. Dashboard → Settings → Billing → Customer portal
2. Click **Activate test link**
3. Configure:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to cancel subscriptions
4. Save

### 6. Run Database Migration
Run in Supabase SQL Editor:
```sql
-- Add Stripe fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);

UPDATE profiles
SET plan = 'free'
WHERE plan IS NULL;
```

## 🚀 Testing

### Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry date, any CVC

### Test Flow
1. Go to `/pricing`
2. Click "Upgrade to Pro"
3. Use test card
4. Check webhook received in Stripe Dashboard
5. Verify user upgraded in database

## 📋 Environment Variables Checklist

Add these to `.env.local` AND Vercel:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_yyy
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## 🔄 Webhook Testing Locally

1. Install Stripe CLI:
   ```bash
   # Windows
   scoop install stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook secret shown and use for local testing

## ✅ Go Live Checklist

Before production:
1. ✅ Switch to **Live mode** in Stripe
2. ✅ Get live API keys (start with `sk_live_` and `pk_live_`)
3. ✅ Create products with live prices
4. ✅ Update webhook URL to production domain
5. ✅ Get live webhook secret
6. ✅ Update all env vars in Vercel with live keys
7. ✅ Test with real card (small amount)
8. ✅ Refund test transaction

## 🎯 Files Created

- `lib/stripe.ts` - Stripe client & config
- `app/api/stripe/create-checkout-session/route.ts` - Checkout
- `app/api/stripe/create-portal-session/route.ts` - Customer portal
- `app/api/stripe/webhook/route.ts` - Webhook handler
- `app/pricing/page.tsx` - Pricing page
- `supabase/migrations/20251019_add_stripe_fields.sql` - DB schema

## 🚨 Important Notes

- Webhook endpoint must be publicly accessible
- Use webhook secret to verify requests
- Never expose secret key in client code
- Test webhooks thoroughly before going live
- Set up monitoring for failed payments

## 📊 Monitoring

Check these regularly:
- Stripe Dashboard → Payments
- Stripe Dashboard → Subscriptions  
- Stripe Dashboard → Webhooks → Logs
- Supabase → Profiles table (plan column)

## 🆘 Troubleshooting

**Checkout not working?**
- Check price IDs are correct
- Verify secret key is set
- Check browser console for errors

**Webhook not firing?**
- Verify webhook URL is correct
- Check endpoint is publicly accessible
- Verify signing secret matches
- Check Stripe Dashboard → Webhooks → Logs

**User not upgraded?**
- Check webhook received
- Check Supabase logs
- Verify userId in session metadata
- Check profiles table updated
