# ProofStack Tech Stack

## 📦 Complete Service Inventory

ProofStack uses **9 third-party services** across 4 categories:

### Infrastructure & Hosting (3)
1. **Vercel** - Serverless deployment, edge network, CI/CD
2. **Supabase** - PostgreSQL database, authentication, real-time
3. **Cloudinary** - File storage, media processing, CDN

### AI & Analysis (3)
4. **OpenAI** - GPT models for skill extraction, Whisper for transcription
5. **Anthropic** - Claude AI for alternative analysis
6. **Hugging Face** - Open-source ML models and datasets

### Developer Tools (1)
7. **GitHub** - OAuth authentication, repository verification

### Monitoring & Analytics (2)
8. **Sentry** - Error monitoring, performance tracking
9. **PostHog** - Product analytics, feature flags

---

## 🎨 Brand Assets

### Current Status
✅ **Implemented:** BuiltWith component with service logos  
✅ **Footer:** Dynamic logo display with hover effects  
✅ **About Page:** Full tech stack showcase with details  
✅ **Documentation:** Logo usage guidelines in `/public/brand-assets/README.md`

### Logo Sources
All logos are loaded from official CDNs or public assets:
- Vercel: Vercel CDN
- Supabase: Local asset (already downloaded)
- Cloudinary: Cloudinary CDN
- OpenAI: OpenAI favicon
- GitHub: GitHub assets
- Sentry: Sentry brand CDN
- PostHog: PostHog brand CDN
- Hugging Face: Hugging Face assets

### Legal Compliance
✅ All logos link to respective service websites  
✅ Proper attribution in About page  
✅ Follows brand guidelines (no modifications)  
✅ Used within ToS of each service (as customers)

---

## 📄 New Pages & Components

### 1. `/about` - About ProofStack
Comprehensive page showcasing:
- Tech stack by category
- Service descriptions and use cases
- Open-source acknowledgments
- Security & compliance features

### 2. `BuiltWith` Component
Reusable footer component displaying:
- Service logos in a clean grid
- Hover effects for interactivity
- Links to service websites
- Proper alt text for accessibility

### 3. Footer Enhancement
Updated main layout footer with:
- "About" link
- Built With section
- Copyright notice
- Legal links (Terms, Privacy, Contact)

---

## 🔗 Service Usage Breakdown

### Infrastructure Layer
```
User Request
    ↓
  Vercel (Edge Network)
    ↓
  Next.js App
    ↓
  ├─→ Supabase (Data)
  └─→ Cloudinary (Files)
```

### Analysis Layer
```
File Upload
    ↓
  Cloudinary Storage
    ↓
  Analysis Worker
    ↓
  ├─→ OpenAI (primary)
  ├─→ Anthropic (fallback)
  └─→ Hugging Face (fallback)
```

### Observability Layer
```
Application Events
    ↓
  ├─→ Sentry (errors)
  └─→ PostHog (analytics)
```

---

## 💰 Cost Considerations

### Free Tier Usage
- **Vercel:** Hobby plan (free for personal projects)
- **Supabase:** Free tier (500MB database, 1GB file storage)
- **Cloudinary:** Free tier (25 credits/month)
- **GitHub:** Free OAuth
- **Sentry:** Free tier (5k events/month)
- **PostHog:** Free tier (1M events/month)

### Paid Services
- **OpenAI:** Pay-per-use (GPT-4, Whisper API)
- **Anthropic:** Pay-per-use (Claude)
- **Hugging Face:** Free inference API (rate-limited)

### Optimization Opportunities
- Implement caching for AI responses
- Use rate limiting to control API costs
- Consider self-hosted alternatives for Ollama (local LLM)
- Monitor usage via each service's dashboard

---

## 🔄 Service Dependencies

### Critical (Cannot function without)
- Vercel (hosting)
- Supabase (auth + data)
- Cloudinary (file storage)

### Important (Core features)
- OpenAI (skill extraction)
- GitHub (OAuth)

### Optional (Degraded service)
- Anthropic (fallback AI)
- Hugging Face (fallback AI)
- Sentry (monitoring)
- PostHog (analytics)

---

## 📊 Service Comparison

| Service | Category | Free Tier | Open Source | Self-Hostable |
|---------|----------|-----------|-------------|---------------|
| Vercel | Hosting | ✅ | ❌ | ❌ |
| Supabase | Database | ✅ | ✅ | ✅ |
| Cloudinary | Storage | ✅ | ❌ | ❌ |
| OpenAI | AI | ❌ | ❌ | ❌ |
| Anthropic | AI | ❌ | ❌ | ❌ |
| Hugging Face | AI | ✅ | ✅ | ✅ |
| GitHub | Auth | ✅ | ❌ | ❌ |
| Sentry | Monitoring | ✅ | ✅ | ✅ |
| PostHog | Analytics | ✅ | ✅ | ✅ |

---

## 🎯 Future Considerations

### Potential Additions
- **Stripe** - Payment processing (for premium features)
- **Resend** - Transactional email
- **Upstash** - Redis for caching
- **Cloudflare** - CDN and DDoS protection

### Self-Hosting Options
- **Ollama** - Local LLM (already configured as fallback)
- **PostgreSQL** - Self-hosted database
- **MinIO** - S3-compatible storage
- **Plausible** - Privacy-focused analytics

---

## 📝 Brand Guidelines Summary

### Logo Display Rules
1. Maintain minimum spacing (padding)
2. Don't modify or distort logos
3. Use official colors (no recoloring)
4. Link to service website
5. Use appropriate contrast for background

### Attribution Requirements
- Display "Powered by" or "Built with" text
- Link directly to service homepage
- Don't imply endorsement without permission
- Follow each service's trademark guidelines

### Accessibility
- Include alt text for all logos
- Ensure sufficient color contrast
- Support keyboard navigation
- Use semantic HTML

---

**Last Updated:** October 17, 2025  
**Total Services:** 9 third-party + 1 core framework (Next.js)
