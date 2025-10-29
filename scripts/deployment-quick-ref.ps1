#!/usr/bin/env pwsh
<#
.SYNOPSIS
ProofStack Fast Deploy Checklist
One-command reference for production deployment

.USAGE
1. Gather credentials from Step 1 in DEPLOYMENT_PRODUCTION.md
2. Add them to Vercel dashboard (Settings > Environment Variables)
3. Run migrations in Supabase
4. Deploy!
#>

Write-Host "ProofStack Production Deployment - Quick Reference`n" -ForegroundColor Cyan

$steps = @(
    @{
        Title = "1. CREATE VERCEL PROJECT"
        Command = "Go to https://vercel.com/new, import GitHub repo, click Deploy"
        Time = "2-3 min"
    },
    @{
        Title = "2. GATHER CREDENTIALS"
        Command = "See DEPLOYMENT_PRODUCTION.md Step 1 (Supabase, Stripe, Cloudinary, GitHub, OpenAI)"
        Time = "5-10 min"
    },
    @{
        Title = "3. ADD ENV VARS TO VERCEL"
        Command = "Vercel Dashboard > Settings > Environment Variables (add all required vars)"
        Time = "3-5 min"
    },
    @{
        Title = "4. APPLY SUPABASE MIGRATIONS"
        Command = "Supabase Dashboard > SQL Editor > run migrations in order (see DEPLOYMENT_PRODUCTION.md)"
        Time = "3-5 min"
    },
    @{
        Title = "5. DEPLOY"
        Command = "Vercel Dashboard > Deployments > Redeploy (or 'vercel --prod' locally)"
        Time = "3-5 min"
    },
    @{
        Title = "6. VERIFY"
        Command = "Visit app URL, test homepage, check Vercel logs"
        Time = "2-3 min"
    }
)

foreach ($step in $steps) {
    Write-Host "$($step.Title) ($($step.Time))" -ForegroundColor Green
    Write-Host "  $($step.Command)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "REQUIRED ENV VARS (add to Vercel):" -ForegroundColor Cyan
$vars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "OPENAI_API_KEY",
    "CRON_SECRET"
)
$vars | ForEach-Object { Write-Host "  ✓ $_" }

Write-Host ""
Write-Host "TOTAL TIME: ~20-35 minutes" -ForegroundColor Cyan
Write-Host "NEXT STEPS: See DEPLOYMENT_PRODUCTION.md for detailed instructions" -ForegroundColor Yellow
