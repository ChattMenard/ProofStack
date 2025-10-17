# Brand Assets & Logos

This directory contains logos and brand assets for third-party services used by ProofStack.

## Logo Guidelines & Download Links

### 1. Vercel
- **Download:** https://vercel.com/design/brands
- **Preferred:** Wordmark (dark/light versions)
- **Usage:** "Deployed on Vercel" or "Powered by Vercel"
- **License:** Free to use for projects hosted on Vercel

### 2. Supabase ✅ (Already added)
- **Download:** https://supabase.com/brand-assets
- **File:** `supabase-logo-wordmark--dark.png`
- **Usage:** "Powered by Supabase"
- **License:** Open source, free to use

### 3. Cloudinary
- **Download:** https://cloudinary.com/about/press
- **Preferred:** Logo with wordmark
- **Usage:** "Media powered by Cloudinary"
- **License:** Free to use for customers

### 4. OpenAI
- **Download:** https://openai.com/brand
- **Preferred:** ChatGPT or OpenAI logo
- **Usage:** "AI powered by OpenAI"
- **License:** Follow brand guidelines (for customers)

### 5. Anthropic (Claude)
- **Download:** https://www.anthropic.com/brand
- **Preferred:** Claude logo
- **Usage:** "AI powered by Anthropic"
- **License:** Follow brand guidelines

### 6. Hugging Face
- **Download:** https://huggingface.co/brand-assets
- **Preferred:** Logo with emoji + wordmark
- **Usage:** "Models from Hugging Face"
- **License:** Open source, free to use

### 7. Sentry
- **Download:** https://sentry.io/branding/
- **Preferred:** Logo with wordmark
- **Usage:** "Monitored by Sentry"
- **License:** Free to use for customers

### 8. PostHog
- **Download:** https://posthog.com/brand
- **Preferred:** Hedgehog logo with wordmark
- **Usage:** "Analytics by PostHog"
- **License:** Open source, free to use

### 9. GitHub
- **Download:** https://github.com/logos
- **Preferred:** GitHub mark or Octocat
- **Usage:** "Integrated with GitHub"
- **License:** Follow GitHub logo guidelines

## Logo Specifications

### Recommended Format
- **Format:** SVG (scalable) or PNG (high-resolution)
- **Background:** Transparent PNG or separate dark/light versions
- **Size:** 
  - Height: 24-32px for inline display
  - Width: Auto (maintain aspect ratio)

### File Naming Convention
```
<service-name>-logo-<variant>.png
```

Examples:
- `vercel-logo-dark.svg`
- `vercel-logo-light.svg`
- `cloudinary-logo-wordmark.png`
- `openai-logo-dark.svg`
- `github-logo-mark.svg`

## Current Assets

```
brand-assets/
├── supabase-logo-wordmark--dark.png  ✅
├── vercel-logo-dark.svg              ⏳ (to be added)
├── vercel-logo-light.svg             ⏳ (to be added)
├── cloudinary-logo.png               ⏳ (to be added)
├── openai-logo.svg                   ⏳ (to be added)
├── anthropic-logo.svg                ⏳ (to be added)
├── huggingface-logo.svg              ⏳ (to be added)
├── sentry-logo.svg                   ⏳ (to be added)
├── posthog-logo.svg                  ⏳ (to be added)
└── github-logo.svg                   ⏳ (to be added)
```

## Legal Requirements

### Attribution Rules
1. Always link logos to the service's website
2. Don't modify logos (except scaling)
3. Maintain minimum spacing around logos
4. Don't imply endorsement unless you have permission
5. Follow each service's brand guidelines

### Copyright Notices
All logos are property of their respective owners:
- Vercel Inc.
- Supabase Inc.
- Cloudinary Ltd.
- OpenAI
- Anthropic
- Hugging Face
- Sentry
- PostHog
- GitHub

## Usage Examples

### Footer Display
```tsx
<div className="flex flex-wrap items-center gap-6">
  <img src="/brand-assets/vercel-logo.svg" alt="Vercel" className="h-6" />
  <img src="/brand-assets/supabase-logo.png" alt="Supabase" className="h-6" />
  <img src="/brand-assets/cloudinary-logo.svg" alt="Cloudinary" className="h-6" />
</div>
```

### "Built With" Page
Full-size logos with descriptions of how each service is used.

## Quick Download Script

To quickly download all logos, you can use this script:

```bash
# Create the directory if it doesn't exist
mkdir -p public/brand-assets

# Download logos (update URLs with actual logo URLs)
# Note: Replace these with actual direct download links
curl -o public/brand-assets/vercel-logo.svg https://vercel.com/...
curl -o public/brand-assets/cloudinary-logo.svg https://cloudinary.com/...
# etc.
```

## Notes

- Always check brand guidelines before using logos
- Update logos when services rebrand
- Test logos against both light and dark backgrounds
- Optimize SVGs for web performance
- Consider using a CDN for logo delivery
