# Stripe Product Setup Script
# Creates all pricing products and prices for ProofStack

Write-Host "🔧 Setting up Stripe products for ProofStack..." -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
$stripeInstalled = Get-Command stripe -ErrorAction SilentlyContinue
if (-not $stripeInstalled) {
    Write-Host "❌ Stripe CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Run: winget install stripe.stripe-cli" -ForegroundColor Yellow
    Write-Host "Or download from: https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stripe CLI found" -ForegroundColor Green
Write-Host ""

# Login check
Write-Host "Checking Stripe authentication..." -ForegroundColor Cyan
$loginCheck = stripe config --list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Stripe first:" -ForegroundColor Yellow
    Write-Host "  stripe login" -ForegroundColor White
    exit 1
}

Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Create Job Posting Products
Write-Host "📦 Creating Job Posting Products..." -ForegroundColor Cyan

# 1. Basic Job Post - $249/month
Write-Host "  Creating: Single Post ($249/mo)..." -ForegroundColor White
$basicProduct = stripe products create `
    --name="Single Job Post" `
    --description="1 active job posting per month with basic features" `
    --metadata[category]="job_post" `
    --metadata[tier]="basic" `
    2>&1 | ConvertFrom-Json

$basicPrice = stripe prices create `
    --product=$basicProduct.id `
    --unit-amount=24900 `
    --currency=usd `
    --recurring[interval]=month `
    --lookup-key="price_basic_job_post" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($basicPrice.id)" -ForegroundColor Green

# 2. Professional Job Post - $949/month
Write-Host "  Creating: Professional ($949/mo)..." -ForegroundColor White
$proProduct = stripe products create `
    --name="Professional Plan" `
    --description="10 active job postings per month with priority placement and analytics" `
    --metadata[category]="job_post" `
    --metadata[tier]="professional" `
    2>&1 | ConvertFrom-Json

$proPrice = stripe prices create `
    --product=$proProduct.id `
    --unit-amount=94900 `
    --currency=usd `
    --recurring[interval]=month `
    --lookup-key="price_professional_job_post" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($proPrice.id)" -ForegroundColor Green

# 3. Enterprise Job Post - $2499/year
Write-Host "  Creating: Enterprise ($2499/yr)..." -ForegroundColor White
$enterpriseProduct = stripe products create `
    --name="Enterprise Plan" `
    --description="Unlimited job postings with team seats, API access, and dedicated support" `
    --metadata[category]="job_post" `
    --metadata[tier]="enterprise" `
    2>&1 | ConvertFrom-Json

$enterprisePrice = stripe prices create `
    --product=$enterpriseProduct.id `
    --unit-amount=249900 `
    --currency=usd `
    --recurring[interval]=year `
    --lookup-key="price_enterprise_job_post" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($enterprisePrice.id)" -ForegroundColor Green
Write-Host ""

# Create Portfolio Boost Products
Write-Host "🚀 Creating Portfolio Boost Products..." -ForegroundColor Cyan

# 4. Standard Boost - $19/month
Write-Host "  Creating: Standard Boost ($19/mo)..." -ForegroundColor White
$standardBoostProduct = stripe products create `
    --name="Standard Portfolio Boost" `
    --description="Highlighted in search results with 2x profile views" `
    --metadata[category]="portfolio_boost" `
    --metadata[tier]="standard" `
    2>&1 | ConvertFrom-Json

$standardBoostPrice = stripe prices create `
    --product=$standardBoostProduct.id `
    --unit-amount=1900 `
    --currency=usd `
    --recurring[interval]=month `
    --lookup-key="price_boost_standard" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($standardBoostPrice.id)" -ForegroundColor Green

# 5. Premium Boost - $49/month
Write-Host "  Creating: Premium Boost ($49/mo)..." -ForegroundColor White
$premiumBoostProduct = stripe products create `
    --name="Premium Portfolio Boost" `
    --description="Top 10 search placement with 5x profile views and newsletter feature" `
    --metadata[category]="portfolio_boost" `
    --metadata[tier]="premium" `
    2>&1 | ConvertFrom-Json

$premiumBoostPrice = stripe prices create `
    --product=$premiumBoostProduct.id `
    --unit-amount=4900 `
    --currency=usd `
    --recurring[interval]=month `
    --lookup-key="price_boost_premium" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($premiumBoostPrice.id)" -ForegroundColor Green

# 6. Featured Boost - $99/month
Write-Host "  Creating: Featured Boost ($99/mo)..." -ForegroundColor White
$featuredBoostProduct = stripe products create `
    --name="Featured Portfolio Boost" `
    --description="Top 3 guaranteed placement with 10x views, homepage spotlight, and social promotion" `
    --metadata[category]="portfolio_boost" `
    --metadata[tier]="featured" `
    2>&1 | ConvertFrom-Json

$featuredBoostPrice = stripe prices create `
    --product=$featuredBoostProduct.id `
    --unit-amount=9900 `
    --currency=usd `
    --recurring[interval]=month `
    --lookup-key="price_boost_featured" `
    2>&1 | ConvertFrom-Json

Write-Host "  ✅ Created: $($featuredBoostPrice.id)" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ All Stripe Products Created Successfully!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Price IDs (add to your .env.local):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Job Posting Plans:" -ForegroundColor White
Write-Host "  price_basic_job_post:        $($basicPrice.id)" -ForegroundColor Gray
Write-Host "  price_professional_job_post: $($proPrice.id)" -ForegroundColor Gray
Write-Host "  price_enterprise_job_post:   $($enterprisePrice.id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Portfolio Boost Plans:" -ForegroundColor White
Write-Host "  price_boost_standard:        $($standardBoostPrice.id)" -ForegroundColor Gray
Write-Host "  price_boost_premium:         $($premiumBoostPrice.id)" -ForegroundColor Gray
Write-Host "  price_boost_featured:        $($featuredBoostPrice.id)" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update app/pricing/employer/page.tsx with these Price IDs" -ForegroundColor White
Write-Host "  2. Configure webhook: stripe listen --forward-to localhost:3000/api/stripe/webhook" -ForegroundColor White
Write-Host "  3. Test checkout flow: npm run dev" -ForegroundColor White
Write-Host ""
