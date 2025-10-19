# Stripe Embedded Checkout Integration Guide

## Overview

Your ProofStack application now supports **both** Stripe checkout methods:

1. **Embedded Checkout** (NEW) - Payment form embedded directly in your site
2. **Hosted Checkout** (Existing) - Redirects to Stripe's hosted payment page

## 🎯 Implementation Summary

### Files Created/Modified

#### New Files:
- `app/checkout/page.tsx` - Embedded checkout page with Stripe form
- `app/checkout/return/page.tsx` - Return page after payment completion
- `app/api/stripe/session-status/route.ts` - API to check payment status
- `public/checkout-example.html` - Plain HTML example (for reference)

#### Modified Files:
- `app/api/stripe/create-checkout-session/route.ts` - Added support for both modes
- `app/pricing/page.tsx` - Added embedded checkout button option
- `.env.local` - Cleaned up (removed invalid line)

## 🚀 How It Works

### 1. User Flow (Embedded Checkout)

```
Pricing Page → Click "Upgrade to Pro" → Checkout Page (Embedded Form) → 
Fill Payment Details → Return Page → Dashboard
```

### 2. Technical Flow

#### Step 1: Initialize Checkout (Client-Side)
```typescript
// In app/checkout/page.tsx
const stripe = await loadStripe(PUBLISHABLE_KEY)
const checkout = await stripe.initEmbeddedCheckout({
  fetchClientSecret: async () => {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        plan: 'pro-monthly',
        userId: user.id,
        mode: 'embedded' // 🔑 Key parameter
      })
    })
    const { clientSecret } = await response.json()
    return clientSecret
  }
})
checkout.mount('#checkout')
```

#### Step 2: Create Session (Server-Side)
```typescript
// In app/api/stripe/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  ui_mode: 'embedded', // 🔑 For embedded checkout
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
})

return { clientSecret: session.client_secret }
```

#### Step 3: Handle Return
```typescript
// In app/checkout/return/page.tsx
const response = await fetch(`/api/stripe/session-status?session_id=${sessionId}`)
const { status } = await response.json()

if (status === 'complete') {
  // Payment successful!
  router.push('/dashboard?upgrade=success')
}
```

## 🔧 Configuration

### Environment Variables Required

```bash
# Already configured in your .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_TGQqqugJMw4w6e
STRIPE_PRO_YEARLY_PRICE_ID=price_TGQvtRRDzlezpk
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Dashboard Setup

1. **Products & Prices** ✅ Already configured
   - Pro Monthly: `price_TGQqqugJMw4w6e`
   - Pro Yearly: `price_TGQvtRRDzlezpk`

2. **Webhook Configuration**
   - Endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`

## 📝 Usage Examples

### Option 1: Using the Embedded Checkout Flow

```typescript
// From pricing page
router.push('/checkout?plan=pro-monthly')
// User completes payment in embedded form
// Returns to /checkout/return
```

### Option 2: Using Express Checkout (Modal)

```typescript
// From pricing page - opens modal with express checkout options
setShowPaymentModal(true)
// User can use Apple Pay, Google Pay, etc.
```

### Option 3: Using Hosted Checkout (Legacy)

```typescript
// Direct API call
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({
    plan: 'pro-monthly',
    userId: user.id,
    mode: 'hosted' // or omit (defaults to hosted)
  })
})
const { url } = await response.json()
window.location.href = url // Redirects to Stripe
```

## 🎨 UI Components

### Pricing Page (`/pricing`)

Two buttons for Pro plan:
- **"Upgrade to Pro"** → Embedded checkout (recommended)
- **"Or use Express Checkout"** → Modal with Apple Pay/Google Pay

### Checkout Page (`/checkout`)

- Clean embedded Stripe form
- Matches your forest/sage theme
- Loading states and error handling
- Back button to pricing

### Return Page (`/checkout/return`)

- Processing state while verifying payment
- Success state with auto-redirect
- Error state with retry options
- Session ID display (dev mode only)

## 🧪 Testing

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Testing the Flow

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/pricing

3. Click "Upgrade to Pro"

4. Use test card: `4242 4242 4242 4242`

5. Verify redirect to return page

6. Check Stripe Dashboard for the session

## 🔒 Security Considerations

✅ **Secure Implementation**
- API keys properly scoped (publishable vs secret)
- Server-side session creation
- Client secret never exposed in URLs
- User authentication required before checkout
- Webhook signature verification

## 🐛 Troubleshooting

### Issue: Checkout form doesn't load

**Solution:** Check browser console for errors. Verify:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- User is authenticated
- API endpoint is responding

### Issue: "Session not found" on return page

**Solution:** 
- Check that `{CHECKOUT_SESSION_ID}` template is in return_url
- Verify session was created successfully
- Check Stripe Dashboard logs

### Issue: Payment succeeds but subscription not created

**Solution:**
- Verify webhook endpoint is configured
- Check webhook secret is correct
- Review webhook logs in Stripe Dashboard

## 📚 Additional Resources

- [Stripe Embedded Checkout Docs](https://stripe.com/docs/payments/checkout/embedded)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)

## 🎉 Next Steps

1. **Test in development** with test cards
2. **Configure webhooks** for production
3. **Update email templates** for payment confirmations
4. **Add analytics** to track conversion rates
5. **Implement subscription management** in user dashboard

---

**Your Stripe integration is now complete and ready to accept payments!** 🚀

The main checkout button uses embedded checkout by default, providing a seamless experience without leaving your site.
