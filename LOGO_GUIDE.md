# ProofStack Brand Assets Guide

## Logo Requirements for Product Hunt & Marketing

For a successful Product Hunt launch and marketing campaigns, you'll need:

### Required Logo Formats

1. **Square Icon** (App Icon)
   - 512x512px PNG (transparent background)
   - 1024x1024px PNG (high-res)
   - SVG (scalable)
   
2. **Horizontal Wordmark**
   - Light version (for dark backgrounds)
   - Dark version (for light backgrounds)
   - Transparent background PNG
   - SVG format
   
3. **Vertical Lockup**
   - Icon + text stacked
   - Multiple sizes: 512x512, 1024x1024
   
4. **Favicon**
   - 16x16, 32x32, 64x64 PNG
   - favicon.ico multi-resolution

## Recommended Logo Creation Tools

### Option 1: Professional Design (Recommended)
- **Fiverr** - $25-100 for professional logo package
- **99designs** - Logo contest ($299+) or 1-on-1 project
- **Upwork** - Hire freelance designer
- Get: Full package with all sizes/formats + brand guidelines

### Option 2: DIY Tools
- **Canva Pro** - Professional templates, easy to use
- **Figma** - Free, professional-grade design tool
- **LogoMakr** - Simple online logo creator
- **Inkscape** - Free, open-source vector graphics

### Option 3: AI Logo Generators (Quick)
- **Looka** - AI-powered logo maker ($20 for package)
- **Brandmark** - AI logo + brand identity
- **Tailor Brands** - AI-driven brand builder

## ProofStack Logo Concept Ideas

### Theme: Trust, Verification, Professional

**Color Palette Suggestions:**
- Primary: Deep Blue (#0F172A) - Trust, professionalism
- Accent: Emerald Green (#10B981) - Verification, success
- Neutral: Slate Gray (#64748B) - Modern, clean

**Symbol Ideas:**
- ✓ Checkmark + Stack/layers
- 🛡️ Shield (security/protection)
- 📋 Document with verification badge
- 🔐 Lock + Stack
- ⚡ Lightning bolt (speed) + checkmark

### Wordmark Typography
- **Modern Sans-Serif**: Inter, Poppins, DM Sans
- **Bold & Clean**: Strong, confident
- **Optional**: "Proof" in one weight, "Stack" in another

## File Structure

```
brand-assets/
├── logos/
│   ├── icon/
│   │   ├── icon-512.png
│   │   ├── icon-1024.png
│   │   ├── icon.svg
│   │   └── icon-transparent.png
│   ├── wordmark/
│   │   ├── wordmark-light.png
│   │   ├── wordmark-light.svg
│   │   ├── wordmark-dark.png
│   │   └── wordmark-dark.svg
│   ├── lockup/
│   │   ├── lockup-vertical.png
│   │   ├── lockup-vertical.svg
│   │   ├── lockup-horizontal.png
│   │   └── lockup-horizontal.svg
│   └── favicon/
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── favicon-64x64.png
│       └── favicon.ico
├── colors/
│   └── palette.json
├── screenshots/
│   ├── hero-screenshot.png (1920x1080)
│   ├── dashboard-screenshot.png
│   └── portfolio-screenshot.png
└── social-media/
    ├── twitter-card.png (1200x675)
    ├── og-image.png (1200x630)
    └── product-hunt-thumbnail.png (240x240)
```

## Immediate Actions for Product Hunt

### 1. Create Temporary Logo (Today - 30 minutes)

Use Canva or Figma to create a simple, clean logo:
- Icon: Stack of checkmarks or verified badges
- Wordmark: "ProofStack" in bold sans-serif
- Colors: Blue + Green
- Export: PNG (transparent) + SVG

### 2. Required Sizes for Product Hunt

**Thumbnail Image:**
- 240x240px PNG
- Square logo/icon
- No text (will be small)

**Gallery Images (Screenshots):**
- 1270x760px (recommended)
- Up to 5 images
- Show key features

**Twitter Card / OG Image:**
- 1200x630px
- Logo + tagline
- For social media sharing

### 3. Quick DIY Template (Figma)

```
Frame: 1024x1024
Background: Gradient (Blue to Teal)
Icon: White checkmark stack
Text: "ProofStack" (Inter Bold, 72pt)
Export: PNG + SVG
```

## Color Codes (Suggested)

```json
{
  "primary": {
    "blue-900": "#0F172A",
    "blue-600": "#2563EB",
    "blue-500": "#3B82F6"
  },
  "accent": {
    "green-600": "#059669",
    "green-500": "#10B981",
    "green-400": "#34D399"
  },
  "neutral": {
    "slate-900": "#0F172A",
    "slate-600": "#475569",
    "slate-400": "#94A3B8"
  }
}
```

## Resources to Download

### Free Stock Photos for Marketing
- **Unsplash** - https://unsplash.com
- **Pexels** - https://pexels.com
- Search: "developer", "coding", "portfolio", "professional"

### Free Icons (if needed)
- **Heroicons** - https://heroicons.com (already in Tailwind)
- **Lucide Icons** - https://lucide.dev
- **Phosphor Icons** - https://phosphoricons.com

### Font Licenses
If using custom fonts:
- **Google Fonts** - Free, commercial use (Inter, Poppins, DM Sans)
- **Font Squirrel** - Free commercial fonts

## Professional Package Checklist

When you get professional logos, ensure you receive:

- [ ] Vector files (AI, EPS, SVG)
- [ ] PNG files (transparent, various sizes)
- [ ] JPG files (with white background)
- [ ] Favicon set (16x16, 32x32, 64x64, ICO)
- [ ] Brand guidelines PDF (colors, spacing, usage rules)
- [ ] Social media templates (Twitter, LinkedIn, Facebook)
- [ ] Source files (PSD, Figma, Sketch)

## Quick Start: Generate with AI (10 minutes)

1. **Go to Looka.com**
   - Enter "ProofStack"
   - Select style: Modern, Professional, Tech
   - Choose colors: Blue, Green
   - Select symbols: Checkmark, Shield, Document
   
2. **Customize**
   - Adjust layout
   - Try different color combos
   - Preview on mockups
   
3. **Purchase Basic Package** (~$20)
   - Download all sizes
   - Get PNG + SVG
   - Use for Product Hunt
   
4. **Add to Project**
   - Place in `public/brand-assets/`
   - Update favicon
   - Use in marketing materials

## Using Your Logo in ProofStack

Once you have logos, update these files:

### 1. Public Assets
```bash
public/
├── favicon.ico
├── logo.png
├── logo-dark.png
├── og-image.png
└── brand-assets/
    └── [all logo files]
```

### 2. Update Metadata (app/layout.tsx)
```typescript
export const metadata = {
  title: 'ProofStack',
  description: 'Verify your skills with cryptographic proof',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/og-image.png'],
  },
}
```

### 3. Add Logo to Header/Navbar
```tsx
<Image 
  src="/logo.png" 
  alt="ProofStack" 
  width={120} 
  height={32}
/>
```

## Budget Recommendations

### Minimum (DIY):
- **$0** - Canva free + Google Fonts
- Time: 2-4 hours

### Recommended (Quick Pro):
- **$20-50** - Looka or similar AI generator
- Time: 1 hour
- Quality: Good enough for launch

### Professional (Best):
- **$100-300** - Fiverr/Upwork designer
- Time: 3-7 days
- Quality: Full brand package, unlimited revisions

## Next Steps

1. **Choose your path** (DIY, AI, or Professional)
2. **Create/commission logos**
3. **Download all required sizes**
4. **Organize in brand-assets folder**
5. **Update ProofStack app**
6. **Prepare Product Hunt assets**

Need help with any specific step? I can:
- Create a temporary logo using ASCII/emoji
- Generate Figma template coordinates
- Write the code to integrate logos once you have them
