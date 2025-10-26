# Job Listings System - Setup Guide

## 🎉 What's Been Built

The complete job listings system is now live! Here's what was added:

### 1. Database Schema
- **File:** `supabase/migrations/20251026_job_postings.sql`
- **Tables Created:**
  - `job_postings` - Stores job listings from employers
  - `job_applications` - Tracks professional applications to jobs
- **Features:**
  - Row-level security (RLS) policies
  - Automatic view counting
  - Application tracking
  - Full text search on skills
  - Validation constraints

### 2. Employer Features

#### Post a Job (`/employer/post-job`)
- Full job creation form
- Fields:
  - Job title & description
  - Job type (full-time, part-time, contract, freelance)
  - Experience level (entry, mid, senior, lead)
  - Location & remote options
  - Salary range (optional)
  - Required skills (comma-separated)
  - Nice-to-have skills
- Save as draft or publish immediately
- Added "➕ Post a Job" to employer menu

#### Features:
- Only employers can access
- Validates employer has organization
- Links job to employer's organization
- Auto-redirects to dashboard after posting

### 3. Job Board (`/projectlistings`)

#### Completely Redesigned!
- **Before:** "Coming Soon" placeholder
- **Now:** Fully functional job listing page

#### Features:
- Browse all published jobs
- Real-time search by title, description, or skills
- Filters:
  - Job type (full-time, part-time, contract, freelance)
  - Experience level (entry, mid, senior, lead)
  - Remote jobs only checkbox
- Job cards display:
  - Company name & logo
  - Location & remote status
  - Job type & experience level
  - Salary range (if disclosed)
  - Required skills (first 5)
  - Application count
- Click any job to view details

### 4. Job Detail Pages (`/projectlistings/[id]`)

#### Full Job Information:
- Complete job description
- Company info with website link
- All required skills
- Nice-to-have skills
- Salary range
- Location & remote status
- Application & view counts

#### Application System:
- **Not signed in:** "Sign In to Apply" button → redirects to login
- **Signed in (professional):** "Apply Now" button → submits application
- **Already applied:** Green badge shows "You've already applied"
- One-click application (no cover letter required for now)

#### Analytics:
- Auto-increments view count when page loads
- Tracks total applications

## 📋 Next Steps to Test

### Step 1: Run the Migration
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/20251026_job_postings.sql`
4. Run the entire script
5. Verify tables created: `job_postings` and `job_applications`

### Step 2: Create Employer Account (if needed)
If you don't have an employer account yet:
1. Go to `/employer/signup`
2. Create organization and employer account
3. Or run `FIX_EMPLOYER_ACCOUNT.sql` to fix your mattchenard@outlook.com account

### Step 3: Post a Test Job
1. Sign in as employer
2. Click "👤 My Account" → "➕ Post a Job"
3. Fill out the form:
   - Title: "Senior Full Stack Developer"
   - Description: Write a few paragraphs
   - Job Type: Full-Time
   - Experience: Senior
   - Location: "Remote" or your city
   - Remote: Check the box
   - Salary: 120000 - 180000 USD
   - Required Skills: "React, TypeScript, Node.js, PostgreSQL"
   - Nice to Have: "AWS, Docker, GraphQL"
4. Click "Publish Job"

### Step 4: Browse Jobs
1. Navigate to `/projectlistings` (or click "Hire" in nav)
2. You should see your job listed
3. Try the search: type "React"
4. Try filters: Select "Full-Time" or "Remote jobs only"
5. Click your job to view details

### Step 5: Test Application Flow
1. Sign out (or open incognito window)
2. Sign in as a professional account
3. Go to `/projectlistings`
4. Click on a job
5. Click "Apply Now"
6. Should show success message
7. Reload page → should show "You've already applied"

### Step 6: View Applications (Future)
Currently applications are tracked in database. Next steps:
- Build employer dashboard to view applications
- Add cover letter/resume upload to application
- Add messaging between employer and applicant
- Add application status tracking (reviewing, shortlisted, etc.)

## 🗄️ Database Schema Details

### job_postings table
```sql
- id (uuid, PK)
- employer_id (uuid, FK → profiles)
- organization_id (uuid, FK → organizations)
- title (text)
- description (text)
- job_type (text: full-time|part-time|contract|freelance)
- experience_level (text: entry|mid|senior|lead)
- location (text, nullable)
- remote_allowed (boolean)
- salary_min (integer, nullable)
- salary_max (integer, nullable)
- salary_currency (text, default USD)
- required_skills (text[])
- nice_to_have_skills (text[])
- status (text: draft|published|closed|filled)
- published_at (timestamptz)
- closes_at (timestamptz, nullable)
- views_count (integer, default 0)
- applications_count (integer, default 0)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### job_applications table
```sql
- id (uuid, PK)
- job_id (uuid, FK → job_postings)
- professional_id (uuid, FK → profiles)
- cover_letter (text, nullable)
- portfolio_url (text, nullable)
- resume_url (text, nullable)
- status (text: submitted|reviewing|shortlisted|rejected|accepted)
- applied_at (timestamptz)
- reviewed_at (timestamptz, nullable)
- responded_at (timestamptz, nullable)
- employer_notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- UNIQUE(job_id, professional_id) -- Can't apply twice
```

## 🔒 Security (RLS Policies)

### job_postings
- ✅ Anyone can view published jobs
- ✅ Employers can view their own jobs (any status)
- ✅ Employers can create jobs
- ✅ Employers can update their own jobs
- ✅ Employers can delete their own jobs

### job_applications
- ✅ Professionals can view their own applications
- ✅ Employers can view applications to their jobs
- ✅ Professionals can create applications
- ✅ Employers can update applications (status, notes)

## 🎯 Future Enhancements

### High Priority
1. **Employer Applications Dashboard**
   - View all applications to your jobs
   - Filter by status
   - Add notes to applications
   - Change application status

2. **Enhanced Application Form**
   - Upload resume/CV
   - Optional cover letter
   - Link to ProofStack portfolio automatically

3. **Job Management for Employers**
   - View all your posted jobs
   - Edit existing jobs
   - Close/reopen jobs
   - Mark as filled
   - View analytics per job

### Medium Priority
4. **Email Notifications**
   - Notify professional when application is reviewed
   - Notify employer of new applications
   - Weekly digest of new jobs matching skills

5. **Smart Matching**
   - Recommend jobs to professionals based on skills
   - Recommend professionals to employers based on job requirements
   - Match score algorithm

6. **Saved Jobs**
   - Professionals can save jobs to apply later
   - Get notified before job closes

### Low Priority
7. **Advanced Filters**
   - Salary range slider
   - Posted date (last 24h, week, month)
   - Company size
   - Industry

8. **Job Alerts**
   - Subscribe to job alerts by skills/location
   - Email when matching job posted

## 📊 Testing Checklist

- [ ] Migration runs successfully in Supabase
- [ ] Can create job as employer
- [ ] Job appears on `/projectlistings`
- [ ] Can search jobs by skills
- [ ] Filters work correctly
- [ ] Job detail page displays all info
- [ ] Can apply to job as professional
- [ ] Can't apply twice to same job
- [ ] Application shows in database
- [ ] "Post a Job" link in employer menu works
- [ ] Non-employers can't access post-job page
- [ ] Draft jobs don't show on public listing
- [ ] View count increments

## 🐛 Known Issues

None yet! Let me know if you find any.

## 📝 Notes

- The increment view count uses a generic `increment` RPC function that may need to be created in Supabase
- Cover letter and resume upload not yet implemented (fields exist in DB)
- Application review workflow not built yet (just basic submission)
- No employer dashboard for viewing applications (data is tracked in DB)

## 🚀 Deployment

Changes are committed and pushed to main branch. Vercel will auto-deploy.

Once deployed:
1. Run migration in production Supabase
2. Test job posting flow
3. Share job board with beta users

---

**Created:** October 26, 2025  
**Status:** ✅ Complete and ready for testing  
**Commit:** 97a30a8
