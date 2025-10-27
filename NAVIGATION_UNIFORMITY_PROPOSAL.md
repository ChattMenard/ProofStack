# Navigation Uniformity & Terminology Proposal

**Date**: October 27, 2025  
**Status**: 🔴 Needs Review & Approval

---

## 🎯 Goals

1. **Uniform navigation** across all pages with consistent header links
2. **Connected navigation** between all major sections
3. **Inclusive terminology** to replace "professional" and "job seeker"
4. **URL/route alignment** with page descriptions and names

---

## 📊 Current State Analysis

### Current Routes & Inconsistencies

| Current Route | Page Name | Issue |
|--------------|-----------|-------|
| `/portfolios` | "Professionals" | Generic name, URL doesn't match label |
| `/projectlistings` | "Jobs" | Inconsistent casing, vague name |
| `/professional/*` | Professional Dashboard | Excludes students, beginners, freelancers |
| `/employer/discover` | Browse Professionals | Separate from portfolios page |
| `/upload` | Upload Work Samples | Not role-specific |
| `/portfolio` | Single portfolio view | Confusing singular vs plural |

### Current Navigation Issues

1. **Inconsistent links**: Signed-in users see different links than guests
2. **Missing connections**: No clear path between marketplaces
3. **Fragmented access**: Employer discover ≠ Public portfolios
4. **Role confusion**: "Professional" term excludes many user types

---

## 🌟 Proposed Terminology

### Replace "Professional" with **"Talent"**

**Rationale:**
- ✅ **Inclusive**: Works for students, beginners, experts, freelancers, career-changers
- ✅ **Marketplace-standard**: Used by Upwork, Toptal, Fiverr, LinkedIn
- ✅ **Scalable**: Works at all experience levels
- ✅ **Clear**: Understood by both sides of marketplace
- ✅ **Positive**: Emphasizes value and skill

**Alternatives considered:**
- ❌ "Professional" - Too formal, excludes beginners
- ❌ "Contributor" - Too generic, unclear
- ❌ "Creator" - Too specific to content creation
- ❌ "Practitioner" - Too medical/legal connotation
- ❌ "Freelancer" - Too specific to gig work
- ❌ "Candidate" - Too passive, employer-centric

---

## 🗺️ Proposed Route Structure

### New Unified Routes

| New Route | Page Name | Description | Access |
|-----------|-----------|-------------|--------|
| `/talent-marketplace` | Browse Talent | View all talent portfolios | Public |
| `/job-marketplace` | Browse Jobs | View all job postings | Public |
| `/talent/dashboard` | Talent Dashboard | Talent home & analytics | Talent only |
| `/talent/portfolio` | My Portfolio | Manage work samples | Talent only |
| `/talent/messages` | Messages | Inbox & conversations | Talent only |
| `/talent/reviews` | Reviews | Received reviews | Talent only |
| `/talent/promote` | Promote Profile | Advertising plans | Talent only |
| `/talent/settings` | Settings | Account settings | Talent only |
| `/talent/verify` | Verify Accounts | GitHub/LinkedIn verification | Talent only |
| `/employer/dashboard` | Employer Dashboard | Employer home | Employer only |
| `/employer/post-job` | Post Job | Create job listing | Employer only |
| `/employer/my-jobs` | My Job Postings | Manage active jobs | Employer only |
| `/employer/applications` | Applications | Review applicants | Employer only |
| `/employer/saved-talent` | Saved Talent | Bookmarked profiles | Employer only |
| `/employer/messages` | Messages | Inbox & conversations | Employer only |
| `/employer/settings` | Settings | Account settings | Employer only |
| `/admin/dashboard` | Admin Dashboard | Platform analytics | Admin only |

### Migration Path

```typescript
// Redirects to maintain backward compatibility
const redirects = [
  { source: '/portfolios', destination: '/talent-marketplace', permanent: true },
  { source: '/projectlistings', destination: '/job-marketplace', permanent: true },
  { source: '/professional/:path*', destination: '/talent/:path*', permanent: true },
  { source: '/upload', destination: '/talent/portfolio', permanent: true },
  { source: '/portfolio', destination: '/talent/portfolio', permanent: true },
  { source: '/employer/discover', destination: '/talent-marketplace', permanent: true },
]
```

---

## 🧭 Proposed Navigation Structure

### Global Header (All Users)

```
Logo | Talent Marketplace | Job Marketplace | [Dynamic Role Links] | [Auth Buttons]
```

### Talent User Links (When Signed In)

```
Logo | Talent Marketplace | Job Marketplace | 📊 Dashboard | 💼 Portfolio | 📤 Upload | 💬 Messages | 👤 Profile ▾
                                                                                                        ├─ Settings
                                                                                                        ├─ Reviews
                                                                                                        ├─ Promote
                                                                                                        ├─ Verify
                                                                                                        └─ Sign Out
```

### Employer User Links (When Signed In)

```
Logo | Talent Marketplace | Job Marketplace | 🏠 Dashboard | ➕ Post Job | 📋 Applications | 💬 Messages | 👤 Profile ▾
                                                                                                              ├─ My Jobs
                                                                                                              ├─ Saved Talent
                                                                                                              ├─ Settings
                                                                                                              └─ Sign Out
```

### Guest Links (Not Signed In)

```
Logo | Talent Marketplace | Job Marketplace | Pricing | About | Sign In | Sign Up ▾
                                                                               ├─ I'm Looking for Work (Talent)
                                                                               └─ I'm Hiring (Employer)
```

---

## 📝 Implementation Checklist

### Phase 1: Terminology Update (No breaking changes)
- [ ] Update UI strings: "Professional" → "Talent"
- [ ] Update Navigation.tsx labels
- [ ] Update dashboard headings
- [ ] Update signup flow copy
- [ ] Update marketing pages (pricing, about, home)
- [ ] Update email templates

### Phase 2: Route Migration (Breaking changes - needs redirects)
- [ ] Create new route folders (`/talent/*`, `/talent-marketplace`, `/job-marketplace`)
- [ ] Copy page components to new locations
- [ ] Add redirects in `next.config.js`
- [ ] Update all internal `<Link>` components
- [ ] Update API route references
- [ ] Test all redirects

### Phase 3: Navigation Enhancement
- [ ] Implement unified Navigation.tsx with dropdown menus
- [ ] Add "Talent Marketplace" and "Job Marketplace" to all navbars
- [ ] Add breadcrumbs to nested pages
- [ ] Add mobile navigation drawer
- [ ] Test navigation on all pages

### Phase 4: Database Updates (If needed)
- [ ] Update `profiles.user_type` enum: `professional` → `talent` (migration)
- [ ] Update RLS policies with new user_type
- [ ] Update API responses
- [ ] Update Supabase queries

---

## 🚨 Breaking Changes & Risks

1. **SEO Impact**: Route changes will affect search rankings
   - **Mitigation**: 301 redirects for all old URLs
   
2. **External Links**: Existing links from emails, social media will break
   - **Mitigation**: Permanent redirects + update email templates
   
3. **Database Migration**: `user_type` column changes
   - **Mitigation**: Multi-phase deployment with backward compatibility
   
4. **User Confusion**: Regular users may be confused by term change
   - **Mitigation**: Add notice banner for 2 weeks post-launch

---

## 💬 Questions for Review

1. **Terminology**: Do you approve "Talent" as the replacement term?
2. **Routes**: Should we keep `/professional/*` with redirects or force migration?
3. **Database**: Should `profiles.user_type` be updated to "talent" or keep "professional" internally?
4. **Timeline**: Phased rollout (4 weeks) or big-bang migration (1 week)?
5. **SEO**: Are you okay with short-term SEO impact from route changes?

---

## 📅 Proposed Timeline

**Week 1**: Terminology updates (UI only, no route changes)  
**Week 2**: Create new routes + redirects  
**Week 3**: Navigation enhancement + testing  
**Week 4**: Database migration + final testing  
**Week 5**: Deploy + monitor

---

## 🔗 Related Files

- `components/Navigation.tsx` - Main navigation component
- `app/layout.tsx` - Root layout with header
- `next.config.js` - Will contain redirects
- `supabase/migrations/` - User type migration
- `CODEBASE_STATUS.md` - Update with new structure

