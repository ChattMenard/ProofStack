# ProofStack Products Overview

**Version:** 1.0  
**Status:** MVP Live + Roadmap Active  
**Last Updated:** October 29, 2025

---

## 🎯 Product Pillars

ProofStack operates across **3 core product lines** designed to solve the credibility crisis in hiring:

### 1. **Talent Marketplace** 💼
**Status:** ✅ LIVE (Oct 29, 2025)

The portfolio platform where professionals showcase verified work and build reputation.

**Key Features:**
- Work sample uploads (code, designs, writing)
- AI-powered skill extraction (OpenAI analysis)
- GitHub repository verification (6-month activity check)
- ProofScore V2 (reputation metric: 30 communication + 30 performance + 40 work quality)
- Professional promotions (Featured $99, Premium $49, Standard $19/mo)
- Portfolio visibility (private, friends-only, public)

**Users:** Freelancers, career-changers, students, open-source developers, remote workers

**Why:** Resume ≠ Real capability. Show your best work.

---

### 2. **Employer Platform** 🏢
**Status:** ✅ LIVE (Oct 29, 2025)

The talent discovery platform where employers find verified professionals.

**Key Features:**
- Browse verified portfolios with AI-analyzed skills
- Advanced search/filtering (skills, ProofScore, location, availability)
- Hire attempts tracker (manage outreach, track conversions)
- Work sample reviews + feedback
- Stripe billing (subscription tiers)
- Founding Employer program (unlimited hires, special badge)

**Users:** Startups, tech companies, agencies, founders, global teams

**Why:** Recruiting broken. See actual capability, not credentials.

---

### 3. **Community Forum** 💬
**Status:** 📅 ROADMAP (December 2025)

The discussion platform where professionals and employers connect transparently.

**Planned Features:**
- Categories: Portfolio Feedback, Hiring Questions, Career Advice, Resources
- Threaded discussions with markdown support
- Upvoting + "accepted answer" marking
- User reputation tiers (Newcomer → Leader)
- AI-powered search + recommendations
- Weekly digest emails

**Users:** Professionals seeking feedback, employers asking questions, experts sharing knowledge

**Why:** Community accountability breeds trust.

---

## 📊 Feature Matrix

| Feature | Talent Marketplace | Employer Platform | Community Forum |
|---------|-------------------|-------------------|-----------------|
| **Portfolio Upload** | ✅ LIVE | - | - |
| **Skill Verification** | ✅ LIVE | ✅ LIVE | - |
| **Messaging** | ✅ LIVE | ✅ LIVE | 📅 Dec 2025 |
| **Reviews & Ratings** | ✅ LIVE | ✅ LIVE | 📅 Dec 2025 |
| **AI Analysis** | ✅ LIVE | ✅ LIVE | 📅 Jan 2026 |
| **Search** | ✅ LIVE | ✅ LIVE | 📅 Dec 2025 |
| **Subscriptions** | ✅ LIVE | ✅ LIVE | 📅 Jan 2026 |
| **Community Building** | ⚠️ Partial | ⚠️ Partial | 📅 Dec 2025 |

---

## 💰 Revenue per Product

### Talent Marketplace (B2C2)
```
Professional Subscriptions:
├─ Featured ($99/mo)    → Top listings, badge
├─ Premium ($49/mo)     → Highlighted profile
└─ Standard ($19/mo)    → 30-day promotional boost

Target: $50K MRR by Q2 2026
Commission (future):    5% of first-month salary
```

### Employer Platform (B2B)
```
Employer Subscriptions:
├─ Founding Tier (FREE) → 100 founders, unlimited hires
├─ Standard ($299/mo)   → Marketplace access, messaging
├─ Pro ($999/mo)        → Advanced filters, bulk tools
└─ Enterprise (custom)  → API, integrations, support

Target: $50K MRR by Q2 2026
```

### Community Forum (Free)
```
Community Engagement → Retention → Subscription Conversion
├─ User-generated content (SEO)
├─ Trust signal (third-party validation)
└─ Viral loop (share great discussions)

Monetization: Indirect (drives paid product adoption)
```

**Total Target:** $100K+ MRR by end of 2026

---

## 🚀 Product Roadmap

### Q4 2025 (Now - December)
**Theme:** Launch & Stabilize

| Week | Talent | Employer | Forum |
|------|--------|----------|-------|
| Oct 29 | ✅ Launch | ✅ Launch | - |
| Nov 1-30 | Beta feedback, UX polish | Beta feedback, UX polish | Design review |
| Dec 1-15 | Professional promotions v1 | Hire attempts tracking v1 | MVP development |
| Dec 15-31 | Holiday campaign | Holiday campaign | Public beta |

---

### Q1 2026 (January - March)
**Theme:** Community & Growth

| Month | Talent | Employer | Forum |
|-------|--------|----------|-------|
| **Jan** | Growth hacks (referral, social) | Bulk hiring tools | Public launch, reputation tiers |
| **Feb** | Advanced portfolio templates | Job postings (NEW) | AI assistant, digests |
| **Mar** | Skill endorsements | LinkedIn integration | Gamification, achievements |

---

### Q2 2026 (April - June)
**Theme:** Enterprise & Scale

| Month | Talent | Employer | Forum |
|-------|--------|----------|-------|
| **Apr** | Verified freelancer badge | ATS API integration | Bounties system |
| **May** | Certification partnerships | Team features | Voice/video threads |
| **Jun** | International expansion | Enterprise billing | Marketplace integration |

---

## 📱 Product Priorities

### NOW (Oct 2025)
1. ✅ Vercel deployment live + stable
2. ✅ Supabase migrations applied
3. ✅ Core features tested by 50+ beta users
4. [ ] Fix bugs from beta feedback
5. [ ] Optimize authentication flow

### NEXT (Nov 2025)
1. [ ] Private beta (50 professionals, 10 employers)
2. [ ] Gather product feedback
3. [ ] Refine matching algorithm
4. [ ] Prepare marketing/press materials

### THEN (Dec 2025)
1. [ ] Public launch (ProductHunt, Twitter)
2. [ ] Forum MVP live
3. [ ] Referral program active
4. [ ] First 100 professionals on platform

---

## 🎯 North Star Metrics

**Per Product:**

| Product | North Star | Current | Target (Dec 31) |
|---------|-----------|---------|-----------------|
| **Talent** | Professionals hired/month | 0 | 10+ |
| **Employer** | Successful hires | 0 | 20+ |
| **Forum** | Discussions/month | 0 | 50+ |

---

## 🔄 Product Interconnection

```
Talent Marketplace
    ↓
  [Professionals create portfolios]
    ↓
    ↕
Employer Platform
    ↓
  [Employers discover talent]
    ↓
    ↕
Community Forum
    ↓
  [Both discuss, build trust]
    ↓
[Successful matches & retention]
```

**Flywheel Effect:**
- More professionals → More employers attracted
- More employers → More discussion/feedback
- More community → More word-of-mouth signups

---

## 🛠️ Technical Stack

**Shared Infrastructure:**
- Frontend: Next.js 14 (React, Tailwind)
- Backend: Supabase PostgreSQL + RLS
- Hosting: Vercel (auto-deploy from GitHub)
- Storage: Cloudinary (CDN + image optimization)
- Payments: Stripe Embedded Checkout
- AI: OpenAI GPT-4-mini
- Auth: Discord, Google, GitHub, LinkedIn OAuth
- Monitoring: Sentry, PostHog
- Rate Limiting: Upstash Redis

**Each product has isolated database tables** but shared user profiles.

---

## 🎬 Launch Sequence

### Phase 1: Private Beta (Nov 1-30)
- 50 professional invites (LinkedIn, GitHub, Discord)
- 10 employer invites (angel investors, friends)
- Collect feedback: matching, UX, missing features
- Bug fixes & polish

### Phase 2: Public Beta (Dec 1-15)
- Open signup (with waitlist)
- ProductHunt launch
- Twitter/LinkedIn campaign
- First press mentions

### Phase 3: General Availability (Dec 16+)
- Forum public
- Referral program active
- Holiday campaign (New Year resolutions)
- First monetization push (subscriptions)

---

## 🎓 Success Criteria

**Product:**
- [ ] All features tested by 100+ users
- [ ] Mobile responsive (0 layout issues)
- [ ] <3s page load time
- [ ] 99%+ uptime

**Usage:**
- [ ] 50+ forum discussions by Dec 31
- [ ] 100+ work samples uploaded
- [ ] 10+ successful matches (professional → employer)

**Business:**
- [ ] $1K MRR by Jan 31
- [ ] 100+ active professionals
- [ ] 25+ paying employers

---

## 📞 Product Leadership

| Role | Owner | Availability |
|------|-------|--------------|
| **CEO/Product** | Matt Chenard | Full-time |
| **Engineering** | (hiring) | - |
| **Community** | (hiring) | - |
| **Growth** | (hiring) | - |

---

## 🚀 Call to Action

**If you're:**
- A professional wanting to be judged on your work → **Join Talent Marketplace**
- An employer tired of recruiting → **Join Employer Platform**
- Someone with insights on hiring → **Join Community Forum (Dec 2025)**

**How to get involved:**
1. Visit: https://proofstack-two.vercel.app
2. Sign up (Discord/Google login)
3. Create your profile (2 min)
4. Join Discord community for early access to forum

---

**Questions?** DM @ChattMenard on GitHub or join ProofStack Discord

*Last Updated: October 29, 2025*  
*Next Update: November 15, 2025*
