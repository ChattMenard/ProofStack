# ProofStack Company Direction & Vision

**Version:** 1.0  
**Date:** October 29, 2025  
**Status:** Active - Production Deployment

---

## 🎯 Mission

ProofStack is a two-sided talent marketplace that connects **verified professionals with real-world portfolios** to **employers seeking authentic talent**.

We solve the credibility gap: Instead of resumes and claims, employers see **verified work samples, AI-analyzed skills, and community reviews**.

---

## 🚀 Core Products

### 1. **Talent Marketplace** (Professional-facing)
- **Portfolio Management**: Upload, organize, and showcase work samples (code, designs, writing, etc.)
- **Skill Verification**: AI-powered skill extraction + GitHub verification
- **ProofScore V2**: Community-driven reputation score (30-point communication, 30-point performance, 40-point work quality)
- **Professional Promotions**: Featured ($99), Premium ($49), Standard ($19/mo) tiers for visibility
- **Messaging**: Direct communication with employers

**Why it matters:** Professionals stop competing on credentials—they compete on results.

### 2. **Employer Platform** (Employer-facing)
- **Talent Discovery**: Browse verified portfolios with AI-analyzed skills
- **Hire Attempts**: Track and manage outreach to candidates
- **Work Sample Reviews**: Rate and leave feedback on portfolio items
- **Founding Employer Program**: Special tier for early adopters (unlimited hires, special badge)
- **Employer Billing**: Stripe-integrated subscriptions for access

**Why it matters:** Employers get instant proof of capability—not promises.

### 3. **Community & Reviews**
- **Two-way Reviews**: Professionals review employers (workplace culture, pay fairness); employers review professionals (work quality, reliability)
- **Messaging System**: Real-time conversations with Supabase Realtime
- **Audit Trail**: Security logging for all sensitive actions

**Why it matters:** Trust is built through transparency and community accountability.

---

## 📊 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Professionals Signed Up** | 1,000 | TBD | 🚀 In Progress |
| **Employers Active** | 100 | TBD | 🚀 In Progress |
| **Work Samples Uploaded** | 5,000+ | TBD | 🚀 In Progress |
| **Monthly Matches** | 500+ | TBD | 🚀 In Progress |
| **Platform Uptime** | 99.9% | 100% | ✅ Live |
| **AI Analysis Accuracy** | 95%+ | TBD | 🧪 Testing |
| **Conversion: Browse→Hire** | 10%+ | TBD | 📈 Monitoring |

---

## 🏗️ Technical Foundation (LIVE ✅)

### Infrastructure
- **Frontend**: Next.js 14 (React Server Components) on Vercel
- **Backend**: Supabase PostgreSQL (RLS policies for security)
- **Storage**: Cloudinary (media hosting + CDN)
- **Payments**: Stripe Embedded Checkout
- **AI**: OpenAI GPT-4-mini (skill extraction)
- **Auth**: Discord, Google, GitHub, LinkedIn OAuth
- **Monitoring**: Sentry (errors), PostHog (analytics)
- **Rate Limiting**: Upstash Redis
- **Email**: Resend API

### Database Foundation (28 Migrations Applied)
- ✅ User profiles (professional/employer/organization)
- ✅ Work samples + AI metadata
- ✅ Messaging + Realtime subscriptions
- ✅ Reviews + ProofScore V2 calculations
- ✅ Billing + subscription tracking
- ✅ Audit logging + security
- ✅ GitHub verification cache
- ✅ Model A/B testing infrastructure

---

## 🎯 Roadmap (Q4 2025 - Q2 2026)

### Phase 1: MVP Launch (NOW - November 2025)
- ✅ Deploy to production (COMPLETE Oct 29)
- [ ] Private beta: 50-100 professionals
- [ ] Private beta: 10-20 employers
- [ ] Gather feedback on matching algorithm
- [ ] Refine messaging/UX
- **Goal:** Validate product-market fit

### Phase 2: Community Growth (December 2025 - January 2026)
- [ ] Public launch (blog post + social promotion)
- [ ] Growth hacks: referral program, LinkedIn integration
- [ ] Improve skill extraction (add new skill categories)
- [ ] Review system + reputation badges
- **Goal:** 500+ professionals, 50+ employers

### Phase 3: Enterprise Features (February - March 2026)
- [ ] Job postings (employer-created listings)
- [ ] Bulk hiring tools (team features)
- [ ] Advanced filtering + saved searches
- [ ] API for ATS integrations
- **Goal:** Attract mid-market companies

### Phase 4: Monetization Scaling (April - June 2026)
- [ ] Professional promotions optimization
- [ ] Employer subscription tiers (higher: API, bulk tools, support)
- [ ] Marketplace commission on successful hires (optional)
- [ ] Premium support tier
- **Goal:** $50K+ MRR

---

## 💰 Revenue Model

### Professional Side (B2C2)
- **Featured Tier ($99/mo)**: Top of listings, featured badge
- **Premium Tier ($49/mo)**: Highlighted profile, priority messaging
- **Standard Tier ($19/mo)**: Promotional boost for 30 days
- **Commission (future)**: 5% of first-month salary on successful hires (opt-in)

### Employer Side (B2B)
- **Founding Tier (FREE)**: First 100 employers, unlimited hires, special badge
- **Standard Tier ($299/mo)**: Access to marketplace, unlimited messaging
- **Pro Tier ($999/mo)**: Advanced filters, bulk import, job posting
- **Enterprise (custom)**: API access, custom integrations, dedicated support

### Target: $100K MRR by end of 2026

---

## 🔒 Trust & Security Pillars

1. **Skill Verification**
   - AI analysis of code/design work samples
   - GitHub profile verification (activity in last 6 months)
   - Manual spot-checks for high-value profiles

2. **Review Authenticity**
   - Only users who've interacted can review
   - Employer + professional two-way reviews prevent bias
   - Audit trail of all review activity

3. **Data Protection**
   - Row-Level Security (RLS) on all database tables
   - Encrypt sensitive fields (API keys, tokens)
   - GDPR-compliant data deletion
   - Security audit logging for compliance

4. **Fraud Prevention**
   - Secret detection on all uploads (prevent API key leaks)
   - Rate limiting on sensitive actions
   - Suspicious activity alerts in Sentry
   - Manual review of high-value profiles

---

## 👥 Target Users

### Professionals We Attract
- **Freelancers** (need proof of work to win contracts)
- **Career Changers** (portfolio > resume)
- **Remote Workers** (verified reputation matters)
- **Students** (early portfolio building)
- **Open Source Developers** (showcase GitHub projects)

### Employers We Attract
- **Startups** (quick talent acquisition, no recruiter fees)
- **Tech Companies** (want to see actual code/work)
- **Agencies** (hiring for specific projects)
- **Founders** (early-stage hiring, budget-conscious)
- **Global Teams** (time-zone agnostic)

---

## 📈 Competitive Advantage

| Feature | ProofStack | LinkedIn | Portfolio Sites | Job Boards |
|---------|-----------|----------|-----------------|-----------|
| **AI Skill Analysis** | ✅ Real-time | ❌ No | ❌ No | ❌ No |
| **Work Sample Verification** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Code Review/Rating** | ✅ Yes | ❌ No | ✅ Manual | ❌ No |
| **GitHub Integration** | ✅ Verified | ✅ Display only | ✅ Display only | ❌ No |
| **Transparent Reputation** | ✅ ProofScore V2 | ❌ Endorsements | ❌ No | ❌ Stars only |
| **Direct Messaging** | ✅ Built-in | ✅ InMail $ | ❌ No | ✅ Basic |
| **Employer Transparency** | ✅ Two-way reviews | ❌ No | ❌ No | ⚠️ Glassdoor separate |

---

## 🎬 Go-to-Market Strategy

### Month 1 (November 2025)
1. **Private Beta**: Invite 50 professionals + 10 employers
   - Target: LinkedIn connections, GitHub followers, Discord community
   - Ask for feedback on: matching algorithm, UI/UX, feature gaps
2. **Content**: "Why Portfolios > Resumes" blog post
3. **Social**: Twitter/LinkedIn updates on launch

### Month 2 (December 2025)
1. **Public Launch**: ProductHunt, HackerNews
2. **Referral Program**: 
   - Professional refers employer → $50 credit
   - Employer hires professional → $100 referral bonus
3. **Press**: Target tech blogs (TechCrunch, Product Hunt, Indie Hackers)

### Month 3 (January 2026)
1. **Partnerships**: 
   - Reach out to bootcamps (Lambda School, Ironhack, etc.)
   - Partner with open-source communities
2. **Community**: Sponsor relevant Discord servers, Reddit AMAs
3. **Content**: Case studies from successful hires

---

## 🛠️ Not in Scope (For Now)

❌ **Job Postings** (Phase 3 - Feb 2026)  
❌ **Video Interviews** (considered, but outsource to calendly + zoom)  
❌ **Test-based Assessment** (AI analysis is enough)  
❌ **Recruiter Marketplace** (different market)  
❌ **International Payments** (Stripe handles most, expand later)  
❌ **Mobile Native App** (web-first, responsive design, PWA later)  

---

## 💡 Core Values

### **Transparency First**
- Show real data, not polished claims
- Two-way reviews keep everyone honest
- Open audit logs for compliance

### **Trust Through Action**
- Portfolio > Resume
- Code speaks louder than words
- Community accountability

### **Inclusive & Global**
- Discord, Google, GitHub OAuth (no gatekeeping)
- Serve remote-first professionals
- Support multiple languages (roadmap)

### **Creator-Friendly**
- Professionals control their data
- No "employers own the profile" nonsense
- Easy data export (GDPR compliance)

---

## 📞 Contact & Leadership

**Founder/CEO**: Matt Chenard  
**GitHub**: ChattMenard  
**Discord**: ProofStack Community  

**Key Stakeholders**:
- Product: Matt Chenard (founder)
- Engineering: Full-stack (Next.js, Supabase, AI)
- Community: (hiring phase 2)
- Sales/Growth: (hiring phase 2)

---

## 🚀 Success Criteria (End of 2025)

| Milestone | Target | Status |
|-----------|--------|--------|
| **Product Live** | Oct 29 ✅ | ✅ DONE |
| **100 Professionals** | Nov 30 | 🚀 In Progress |
| **50 Employers** | Dec 15 | 🚀 In Progress |
| **First 10 Successful Hires** | Jan 31 | 📅 Upcoming |
| **$5K MRR** | Jan 31 | 📅 Upcoming |
| **Press Mentions** | 5+ | 📅 Upcoming |
| **Community Feedback Loop** | 50+ feedback items | 🚀 In Progress |

---

## 🎯 North Star Metric

**"Professionals hired per month"**

We succeed when:
1. More professionals get jobs/freelance gigs via ProofStack
2. More employers find quality talent faster + cheaper than traditional recruiting
3. The community self-polices through reviews (trust emerges)

---

## ✨ Final Words

ProofStack is **for creators who want to be judged on their work**, not their connections or interview skills.

It's **for companies tired of resumes**, tired of recruiters, tired of candidates who "interview well" but can't ship code.

We're building the **credibility layer the internet always needed**.

**Let's go.** 🚀

---

*Last Updated: October 29, 2025*  
*Next Review: November 30, 2025*  
*Questions?* Contact: Matt Chenard on GitHub or Discord
