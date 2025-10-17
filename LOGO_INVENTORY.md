# ProofStack Logo Assets - Inventory

## ✅ Logos Successfully Added

All ProofStack logos have been organized and are ready to use!

## 📁 File Structure

```
brand-assets/logos/
├── icon/
│   ├── favicon.svg (16x16 optimized for browser tab)
│   ├── proofstack-icon-128x128.svg
│   └── proofstack-icon-256x256.svg
├── wordmark/
│   ├── proofstack-full-500x500.svg (icon + text, square)
│   └── proofstack-horizontal-800x300.svg (icon + text, horizontal)
└── banners/
    └── proofstack-banner-1200x400.svg (for social media)

public/
├── favicon.svg (browser tab icon)
├── logo-icon.svg (256x256 icon)
├── logo.svg (horizontal wordmark for navbar)
└── og-image.svg (social sharing image)
```

## 🎨 Logo Details

### Icons (Square)
- **favicon.svg** - 16x16, optimized for browser tabs
- **proofstack-icon-128x128.svg** - Small icon
- **proofstack-icon-256x256.svg** - Standard icon size

### Wordmarks (Logo + Text)
- **proofstack-full-500x500.svg** - Square lockup (500x500)
- **proofstack-horizontal-800x300.svg** - Horizontal lockup (800x300)

### Banners
- **proofstack-banner-1200x400.svg** - Social media banner (1200x400)

## 🎨 Brand Colors

Based on the SVG files:
- **Red**: #e63946 (top-left block)
- **Orange**: #ff9f1c (top-right block)
- **Green**: #8bc34a (bottom-left block)
- **Teal**: #20c997 (bottom-right block)

The logo uses a **4-block grid** design representing a "stack" of verified skills/proofs.

## 🚀 Usage in App

### 1. Navbar Logo
```tsx
<Image 
  src="/logo.svg" 
  alt="ProofStack" 
  width={200}
  height={75}
/>
```

### 2. Favicon (Already in public/)
The browser will automatically use `/favicon.svg`

### 3. Social Sharing / OG Image
```tsx
// In app/layout.tsx metadata
openGraph: {
  images: ['/og-image.svg'],
}
```

### 4. Square Icon (App Stores, etc.)
```tsx
<Image 
  src="/logo-icon.svg" 
  alt="ProofStack Icon" 
  width={256}
  height={256}
/>
```

## 📝 Next Steps

### Immediate Actions:
1. ✅ Update app/layout.tsx with new favicon and OG image
2. ✅ Add logo to navbar component
3. ✅ Update Product Hunt assets (using banner SVG)

### PNG Exports (if needed):
If you need PNG versions for specific platforms:
```bash
# Install sharp (Node.js image processing)
npm install sharp

# Then use a converter script to generate PNGs from SVGs
```

## 🎯 Product Hunt Requirements

### ✅ Thumbnail (240x240)
Use: `proofstack-icon-256x256.svg`
- Export as 240x240 PNG
- Or use as-is (most platforms support SVG)

### ✅ Gallery Images
Use: `proofstack-banner-1200x400.svg` as header
- Screenshot app features
- Add logo banner at top

### ✅ Social Card (1200x630)
Use: `proofstack-banner-1200x400.svg`
- Add tagline below banner
- Export as PNG for Twitter/OG tags

## 🔧 File Format Notes

All files are **SVG (Scalable Vector Graphics)**:
- ✅ Infinite scalability (no quality loss)
- ✅ Small file size (~1.5-2KB each)
- ✅ Perfect for web use
- ✅ Easy to edit colors if needed

### Converting SVG to PNG (if needed):
**Option 1: Online**
- CloudConvert.com
- SVG2PNG.com
- Upload SVG, download PNG

**Option 2: Figma**
- Import SVG to Figma
- Export as PNG at desired size

**Option 3: Command Line**
```bash
# Using Inkscape (free)
inkscape --export-type=png --export-width=1024 input.svg -o output.png
```

## 📋 Checklist for Integration

- [ ] Update `app/layout.tsx` metadata with new icons
- [ ] Add logo to navbar/header component
- [ ] Test favicon shows in browser tab
- [ ] Export PNG versions for Product Hunt (240x240)
- [ ] Create social media graphics using banner
- [ ] Update README.md with logo
- [ ] Commit all logo files to git

## 🎨 Logo Design Elements

The ProofStack logo features:
- **Grid Layout**: 2x2 blocks representing a "stack"
- **Colors**: Red, Orange, Green, Teal (vibrant, trustworthy)
- **Symbols in blocks**:
  - Top-left (Red): Verification shield/badge
  - Top-right (Orange): Checklist/tasks
  - Bottom-left (Green): Lines/code
  - Bottom-right (Teal): Document/proof
- **Clean, Modern**: Rounded corners (rx="9.6")
- **High Contrast**: White symbols on colored backgrounds

## 💡 Tips

1. **Always use SVG for web** - Better quality, smaller size
2. **PNG for social media** - More compatible with older platforms
3. **Keep originals** - Never overwrite brand-assets/ folder
4. **Document colors** - For future brand consistency

## 🆘 Troubleshooting

**SVG not showing in browser?**
- Check file path is correct (`/logo.svg` in public folder)
- Verify MIME type: `image/svg+xml`
- Some browsers cache favicons - hard refresh (Ctrl+F5)

**Need different size?**
- SVGs scale automatically! Just change width/height in `<Image>` tag
- For PNGs, use online converter with target size

**Colors look wrong?**
- SVGs are editable! Open in VS Code and change hex colors
- Or use Figma/Inkscape for visual editing

---

**All logos organized and ready! 🎉**

See `LOGO_GUIDE.md` for comprehensive branding guidelines.
