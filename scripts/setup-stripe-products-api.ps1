# Alternative: Create Stripe products via REST API
# Use this if Stripe CLI is not available

Write-Host "🔧 Setting up Stripe products via API..." -ForegroundColor Cyan
Write-Host ""

# Check for Stripe secret key
if (-not $env:STRIPE_SECRET_KEY) {
    Write-Host "❌ STRIPE_SECRET_KEY not found in environment" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run:" -ForegroundColor Yellow
    Write-Host '  $env:STRIPE_SECRET_KEY = "sk_test_YOUR_KEY_HERE"' -ForegroundColor White
    Write-Host ""
    Write-Host "Get your key from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Cyan
    exit 1
}

$apiKey = $env:STRIPE_SECRET_KEY
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/x-www-form-urlencoded"
}

function Create-StripeProduct {
    param($name, $description, $category, $tier)
    
    $body = "name=$([System.Web.HttpUtility]::UrlEncode($name))&description=$([System.Web.HttpUtility]::UrlEncode($description))&metadata[category]=$category&metadata[tier]=$tier"
    
    $response = Invoke-RestMethod -Uri "https://api.stripe.com/v1/products" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    return $response
}

function Create-StripePrice {
    param($productId, $amount, $interval, $lookupKey)
    
    $body = "product=$productId&unit_amount=$amount&currency=usd&recurring[interval]=$interval&lookup_key=$lookupKey"
    
    $response = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    return $response
}

Add-Type -AssemblyName System.Web

Write-Host "📦 Creating Job Posting Products..." -ForegroundColor Cyan

# 1. Basic - $249/month
Write-Host "  Creating: Single Post ($249/mo)..." -ForegroundColor White
$basicProduct = Create-StripeProduct -name "Single Job Post" `
    -description "1 active job posting per month with basic features" `
    -category "job_post" -tier "basic"
$basicPrice = Create-StripePrice -productId $basicProduct.id `
    -amount 24900 -interval "month" -lookupKey "price_basic_job_post"
Write-Host "  ✅ $($basicPrice.id)" -ForegroundColor Green

# 2. Professional - $949/month
Write-Host "  Creating: Professional ($949/mo)..." -ForegroundColor White
$proProduct = Create-StripeProduct -name "Professional Plan" `
    -description "10 active job postings per month with priority placement" `
    -category "job_post" -tier "professional"
$proPrice = Create-StripePrice -productId $proProduct.id `
    -amount 94900 -interval "month" -lookupKey "price_professional_job_post"
Write-Host "  ✅ $($proPrice.id)" -ForegroundColor Green

# 3. Enterprise - $2499/year
Write-Host "  Creating: Enterprise ($2499/yr)..." -ForegroundColor White
$entProduct = Create-StripeProduct -name "Enterprise Plan" `
    -description "Unlimited job postings with team seats and API access" `
    -category "job_post" -tier "enterprise"
$entPrice = Create-StripePrice -productId $entProduct.id `
    -amount 249900 -interval "year" -lookupKey "price_enterprise_job_post"
Write-Host "  ✅ $($entPrice.id)" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Creating Portfolio Boost Products..." -ForegroundColor Cyan

# 4. Standard Boost - $19/month
Write-Host "  Creating: Standard Boost ($19/mo)..." -ForegroundColor White
$stdProduct = Create-StripeProduct -name "Standard Portfolio Boost" `
    -description "Highlighted in search with 2x profile views" `
    -category "portfolio_boost" -tier "standard"
$stdPrice = Create-StripePrice -productId $stdProduct.id `
    -amount 1900 -interval "month" -lookupKey "price_boost_standard"
Write-Host "  ✅ $($stdPrice.id)" -ForegroundColor Green

# 5. Premium Boost - $49/month
Write-Host "  Creating: Premium Boost ($49/mo)..." -ForegroundColor White
$premProduct = Create-StripeProduct -name "Premium Portfolio Boost" `
    -description "Top 10 placement with 5x profile views" `
    -category "portfolio_boost" -tier "premium"
$premPrice = Create-StripePrice -productId $premProduct.id `
    -amount 4900 -interval "month" -lookupKey "price_boost_premium"
Write-Host "  ✅ $($premPrice.id)" -ForegroundColor Green

# 6. Featured Boost - $99/month
Write-Host "  Creating: Featured Boost ($99/mo)..." -ForegroundColor White
$featProduct = Create-StripeProduct -name "Featured Portfolio Boost" `
    -description "Top 3 placement with 10x views and homepage spotlight" `
    -category "portfolio_boost" -tier "featured"
$featPrice = Create-StripePrice -productId $featProduct.id `
    -amount 9900 -interval "month" -lookupKey "price_boost_featured"
Write-Host "  ✅ $($featPrice.id)" -ForegroundColor Green

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ All Products Created!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Update these Price IDs in your code:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Job Posts:" -ForegroundColor White
Write-Host "  $($basicPrice.id)" -ForegroundColor Gray
Write-Host "  $($proPrice.id)" -ForegroundColor Gray
Write-Host "  $($entPrice.id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Boosts:" -ForegroundColor White
Write-Host "  $($stdPrice.id)" -ForegroundColor Gray
Write-Host "  $($premPrice.id)" -ForegroundColor Gray
Write-Host "  $($featPrice.id)" -ForegroundColor Gray
Write-Host ""

# Save to file
$output = @"
# Stripe Price IDs - Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Job Posting Plans
STRIPE_BASIC_JOB_POST=$($basicPrice.id)
STRIPE_PROFESSIONAL_JOB_POST=$($proPrice.id)
STRIPE_ENTERPRISE_JOB_POST=$($entPrice.id)

## Portfolio Boost Plans
STRIPE_BOOST_STANDARD=$($stdPrice.id)
STRIPE_BOOST_PREMIUM=$($premPrice.id)
STRIPE_BOOST_FEATURED=$($featPrice.id)

## Update app/pricing/employer/page.tsx:
Replace these stripePriceId values:
- 'price_basic_job_post' → '$($basicPrice.id)'
- 'price_professional_job_post' → '$($proPrice.id)'
- 'price_enterprise_job_post' → '$($entPrice.id)'
- 'price_boost_standard' → '$($stdPrice.id)'
- 'price_boost_premium' → '$($premPrice.id)'
- 'price_boost_featured' → '$($featPrice.id)'
"@

$output | Out-File -FilePath "stripe-price-ids.txt" -Encoding UTF8
Write-Host "💾 Saved to stripe-price-ids.txt" -ForegroundColor Cyan
