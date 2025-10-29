# ProofStack Community Forum & Discussion System

**Status:** Design Phase → Implementation Roadmap  
**Priority:** Phase 2 (December 2025)  
**Estimated Build Time:** 2-3 weeks

---

## 📋 Overview

A community forum where:
- **Professionals** ask for feedback on portfolios, discuss career moves, share learning resources
- **Employers** discuss hiring challenges, ask the community for recommendations
- **Moderators** enforce community guidelines
- **AI Assistant** suggests relevant connections and answers common questions

---

## 🏗️ Architecture

### Database Schema (SQL Migrations Needed)

```sql
-- Forums & Categories
CREATE TABLE forum_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example categories:
-- - "Portfolio Feedback" (professionals ask for code review)
-- - "Hiring Questions" (employers discuss recruiting)
-- - "Career Advice" (professionals discuss roles, salaries)
-- - "Resources & Learning" (share tutorials, bootcamp recommendations)
-- - "Announcements" (ProofStack team updates)

CREATE TABLE forum_threads (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGSERIAL REFERENCES forum_categories(id),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_reply_at TIMESTAMPTZ
);

CREATE TABLE forum_replies (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGSERIAL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  parent_reply_id BIGSERIAL REFERENCES forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_accepted_answer BOOLEAN DEFAULT FALSE,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_reply_upvotes (
  id BIGSERIAL PRIMARY KEY,
  reply_id BIGSERIAL REFERENCES forum_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Track user activity for reputation
CREATE TABLE forum_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  threads_created INT DEFAULT 0,
  replies_posted INT DEFAULT 0,
  replies_accepted INT DEFAULT 0,
  total_upvotes INT DEFAULT 0,
  forum_reputation INT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI Components

### 1. **Forum Homepage** (`/forum`)
```
┌─────────────────────────────────────┐
│  ProofStack Community Forum          │
├─────────────────────────────────────┤
│  Search: [_______________]          │
│                                     │
│  Categories:                        │
│  📋 Portfolio Feedback (42 threads) │
│  💼 Hiring Questions (18 threads)   │
│  🎓 Career Advice (156 threads)     │
│  📚 Resources & Learning (67)       │
│  📢 Announcements (5)               │
│                                     │
│  Recent Threads:                    │
│  ├─ [⭐ PINNED] ProofStack Roadmap  │
│  ├─ How to increase ProofScore?     │
│  ├─ Best practices for work samples │
│  └─ AI analysis seems wrong...      │
└─────────────────────────────────────┘
```

### 2. **Thread View** (`/forum/:categorySlug/:threadId`)
```
┌──────────────────────────────────────────┐
│  How to increase my ProofScore?          │
│  by @jane_dev • 2 days ago • 24 views    │
├──────────────────────────────────────────┤
│  [Pinned] [Locked toggle] [Share] [Report]
│                                          │
│  I just got my ProofScore calculated... │
│  (long post content)                    │
│                                          │
│  👍 12 upvotes                          │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  3 Replies (showing newest first)        │
│                                          │
│  💬 @bob_manager (EMPLOYER)              │
│  Great question! In my experience...     │
│  👍 5 upvotes  [Reply] [Mark as answer]  │
│                                          │
│  💬 @alice_dev                           │
│  Same here! I'd suggest...              │
│  👍 3 upvotes  [Reply] [Mark as answer]  │
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  [Post Reply] [____________________]    │
└──────────────────────────────────────────┘
```

### 3. **Create Thread** (`/forum/new`)
```
┌──────────────────────────────────────┐
│  Create New Discussion               │
├──────────────────────────────────────┤
│  Category: [Portfolio Feedback ▼]    │
│                                      │
│  Title:                              │
│  [______________________________]    │
│                                      │
│  Content:                            │
│  [Markdown editor with preview]     │
│  [B I U `code`]                    │
│                                      │
│  [Preview] [Cancel] [Post Thread]   │
└──────────────────────────────────────┘
```

---

## ✨ Features by Phase

### Phase 1: MVP (Week 1-2, Dec 2025)
- [ ] Basic forum structure (categories, threads, replies)
- [ ] Markdown support (bold, code blocks, links)
- [ ] Upvoting on replies
- [ ] RLS policies (users can only edit their own posts)
- [ ] Search by title/content (basic full-text search)

### Phase 2: Community (Week 3, Dec 2025)
- [ ] Mark "accepted answer" (for question threads)
- [ ] User reputation score
- [ ] Thread tags (e.g., "feedback-wanted", "case-study", "solved")
- [ ] Moderation tools (pin, lock, delete threads)
- [ ] Notifications when someone replies to your thread

### Phase 3: Intelligence (Jan 2026)
- [ ] AI Assistant responses to common questions
- [ ] Thread recommendations ("Similar discussions: ...")
- [ ] "Help needed" matching (AI suggests experts to reply)
- [ ] Weekly digest email of trending topics
- [ ] Automated moderation (spam/toxicity detection)

### Phase 4: Integration (Feb-Mar 2026)
- [ ] Link forum threads to work samples
- [ ] Employer can post "We're hiring for X, looking for Y profile type"
- [ ] Professionals can link to their portfolio in replies
- [ ] Analytics dashboard (most helpful users, trending topics)

---

## 🤖 AI-Powered Features

### 1. **Smart Search**
```
User: "How do I show my skills as a junior dev?"

AI suggests:
- Link to 5 similar threads
- Show "accepted answers" from domain experts
- Recommend asking in "Portfolio Feedback" category
```

### 2. **Auto-Moderate Spam**
```
Rule: If thread has 3+ links + promotional language + no real question
→ Flag for manual review or auto-collapse
```

### 3. **Suggest Connections**
```
Thread: "I'm struggling with React architecture"
AI suggests: "👤 @bob_senior_dev has 10 accepted answers about React"
```

### 4. **Weekly Digest**
```
Email to professionals:
- "🔥 Top discussions this week"
- "💡 New job opportunities from employers in your field"
- "🎯 Discussions from people like you"
```

---

## 📊 Gamification & Reputation

### Forum Reputation Tiers

| Reputation | Status | Perks |
|------------|--------|-------|
| 0-50 | Newcomer | Can post in moderated categories |
| 51-200 | Active Member | Badge on profile, can create threads |
| 201-500 | Trusted Expert | "Expert" badge, replies highlighted |
| 500+ | Community Leader | Can moderate, pin threads |

### Achievements
- 🎖️ "First Thread" - Post your first forum discussion
- 🏆 "Accepted Answer" - Get 5 accepted answers
- ⭐ "Helpful" - Get 50+ upvotes on replies
- 📚 "Resource Master" - Share 10+ useful resources
- 💼 "Deal Maker" - Get hired through a forum connection

---

## 🛡️ Moderation & Safety

### Community Guidelines
1. **Be Respectful**: No personal attacks or discrimination
2. **No Spam**: Don't repeatedly promote products/services
3. **No Self-Promo Only**: Share value, not just links to your stuff
4. **Relevant Content**: Stay on-topic
5. **No Explicit Content**: Keep it professional

### Moderation Tools
- Thread locking (prevent replies)
- Thread pinning (keep important at top)
- Hide/delete replies (with audit log)
- Temporary suspensions (escalate spam)
- Ban users (nuclear option)

### Reporting
```
[Report Post] → Category: spam/harassment/off-topic/scam
  → Auto-flag for moderator review
  → Send to Slack (moderator dashboard)
  → Action within 24 hours
```

---

## 📱 API Endpoints

```
GET    /api/forum/categories                 # List all categories
GET    /api/forum/categories/:slug            # Get category + threads
GET    /api/forum/threads/:id                 # Get thread + replies
POST   /api/forum/threads                     # Create thread (auth required)
POST   /api/forum/threads/:id/replies         # Reply to thread
POST   /api/forum/replies/:id/upvote          # Upvote reply
PATCH  /api/forum/threads/:id                 # Edit thread (owner only)
PATCH  /api/forum/replies/:id                 # Edit reply (owner only)
DELETE /api/forum/threads/:id                 # Delete thread (owner/mod)
DELETE /api/forum/replies/:id                 # Delete reply (owner/mod)
POST   /api/forum/threads/:id/report          # Report thread
POST   /api/forum/replies/:id/report          # Report reply
GET    /api/forum/search?q=keywords           # Search threads/replies
```

---

## 🚀 Launch Strategy

### Week 1: MVP
1. Deploy basic forum with 5 categories
2. Invite 50 beta testers (community members, Discord)
3. Gather feedback on UX, feature requests
4. Fix bugs, iterate on moderation workflow

### Week 2: Open to All
1. Announce forum on Twitter, blog, email
2. Seed threads from FAQ (common hiring questions, portfolio tips)
3. Run "Ask Me Anything" (AMA) with domain experts
4. Monitor for spam, abuse

### Week 3+: Growth
1. Feature "Discussions of the Week" on homepage
2. Integrate with messaging (cross-promote great threads)
3. Add weekly digest emails
4. Publish "Community Highlights" blog posts

---

## 📊 Success Metrics

| Metric | Target (Dec 2025) | Target (Jan 2026) |
|--------|-------------------|-------------------|
| **Monthly Discussions** | 50+ | 200+ |
| **Monthly Replies** | 300+ | 1000+ |
| **Active Posters** | 30+ | 100+ |
| **Avg Reply Time** | <4 hours | <2 hours |
| **% Threads with Accepted Answer** | 40%+ | 60%+ |
| **Community Satisfaction** | 4.5/5 | 4.7/5 |

---

## 🛠️ Implementation Checklist

### Database
- [ ] Create migration for forum tables (RLS policies included)
- [ ] Index for fast search (full-text search on title+content)
- [ ] Indexing on foreign keys (category_id, user_id, thread_id)

### Backend API
- [ ] POST `/api/forum/threads` - Create thread
- [ ] GET `/api/forum/threads/:id` - Get thread + replies
- [ ] POST `/api/forum/replies` - Reply to thread
- [ ] POST `/api/forum/replies/:id/upvote` - Like reply
- [ ] Rate limiting: 10 threads/day, 50 replies/day per user

### Frontend
- [ ] Forum homepage + category view
- [ ] Thread creation form (markdown editor)
- [ ] Thread detail view (threaded replies)
- [ ] Search UI (autocomplete suggestions)
- [ ] Mobile-responsive design

### Moderation
- [ ] Admin dashboard (mod tools)
- [ ] Automated spam detection (OpenAI moderation API)
- [ ] Manual review workflow
- [ ] Moderation logs (audit trail)

### Integrations
- [ ] Slack alerts for reports
- [ ] SendGrid emails (weekly digest, replies)
- [ ] Sentry error tracking
- [ ] PostHog analytics

---

## 💡 Future Ideas (Beyond Phase 1)

- **Voice Threads**: Audio discussions (Agora integration)
- **Video Embedded**: Record video explanations in posts
- **Pair Programming Sessions**: Schedule live coding session from forum
- **Bounties**: Employers post "$500 for solution to X problem"
- **Marketplace Integration**: Link to work samples, portfolio items
- **AI Co-Pilot**: Draft responses, edit threads
- **Dark Mode**: Forum in dark theme

---

## 🎯 Why This Matters

1. **Community Building**: Users invest time in the platform, higher retention
2. **User-Generated Content**: SEO benefit (hundreds of threads = Google organic traffic)
3. **Trust Signal**: "Real people using it, sharing real experiences"
4. **Product Feedback**: Free user research on what matters most
5. **Virality**: Share great threads on Twitter → bring new users
6. **Revenue**: Employers discover talent in forums, upgrade subscriptions

---

## 📞 Questions to Answer

1. How do we prevent employer/professional spam in the forum?
   - Answer: Reputation system + moderation + automated detection

2. Should we allow anonymous posting?
   - Answer: No—identify fosters quality discourse

3. How do we prevent low-effort questions?
   - Answer: Require minimum thread body length + category rules

4. Mobile app for forum?
   - Answer: Start with responsive web, PWA, native app in Q2 2026

---

**Next Step:** Create first migration file + start backend API implementation  
**Owner:** Engineering team  
**Timeline:** Begin Week 1 of December 2025

---

*Last Updated: October 29, 2025*  
*Reviews: Every 2 weeks post-launch*
