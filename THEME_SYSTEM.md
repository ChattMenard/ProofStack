# 🎨 Theme System

## Overview

ProofStack features a dual-theme system with **Dark Mode** (default) and **Light Mode**, using a natural color palette inspired by forest, sage, and earth tones.

## Theme Toggle

Located in the top-right header, users can switch between themes. The preference is saved in `localStorage` and persists across sessions.

### Component: `ThemeToggle.tsx`

```tsx
// Located at: components/ThemeToggle.tsx
- Moon icon (🌙) = Dark Mode
- Sun icon (☀️) = Light Mode
- Default: Dark Mode
- Persists via localStorage
```

## Color Palette

### Dark Theme (Default)

```css
--bg-primary: #1a1f1e      /* Very dark green */
--bg-secondary: #242928    /* Dark green-gray */
--text-primary: #e8ebe9    /* Off-white */
--text-secondary: #b8c0bb  /* Light gray-green */
--accent-sage: #8ba888     /* Muted green */
--accent-earth: #a98467    /* Warm brown */
```

### Light Theme

```css
--bg-primary: #f5f5f5      /* Light gray */
--bg-secondary: #ffffff    /* White */
--text-primary: #1a1f1e    /* Dark green */
--text-secondary: #4a5250  /* Medium gray-green */
--accent-sage: #4a6b4d     /* Deep green */
--accent-earth: #8b6546    /* Warm brown */
```

## Tailwind Color Scales

### Forest (Dark Greens)
- `forest-950` → `forest-50` (10 shades)
- Used for: Backgrounds, primary UI elements

### Sage (Muted Greens)
- `sage-900` → `sage-50` (10 shades)
- Used for: Accents, buttons, positive indicators

### Earth (Warm Browns)
- `earth-900` → `earth-50` (10 shades)
- Used for: Secondary accents, badges, credentials

## Implementation

### Global Styles (`styles/globals.css`)

```css
/* Dark theme (default) */
:root { ... }

/* Light theme overrides */
html.light { ... }

/* Utility class overrides for light mode */
html.light .bg-forest-950 { background-color: #f5f5f5; }
html.light .text-forest-50 { color: #1a1f1e; }
/* etc... */
```

### Usage in Components

```tsx
// Classes work in both themes automatically
<div className="bg-forest-950 text-forest-50">
  <button className="bg-sage-600 hover:bg-sage-500">
    Click me
  </button>
</div>
```

## Pages Using Theme

All pages have been updated to use the theme system:

- ✅ Landing Page (`app/page.tsx`)
- ✅ Layout (`app/layout.tsx`)
- ✅ Dashboard (`app/dashboard/page.tsx`)
- ✅ Portfolio (`app/portfolio/[username]/page.tsx`)
- ✅ Upload Form (`components/UploadForm.tsx`)
- ✅ Auth Pages (inherits from layout)

## Features

1. **Smooth Transitions**: `transition: background-color 0.3s ease, color 0.3s ease`
2. **Persistent Preference**: Saved to `localStorage` as `'theme'`
3. **SSR Safe**: Uses `mounted` state to prevent hydration mismatches
4. **Accessible**: Toggle has proper `aria-label`
5. **Visual Feedback**: Icons (🌙/☀️) and gradient backgrounds

## Testing

### Check Theme Switching
1. Visit http://localhost:3000
2. Click the theme toggle in the top-right
3. Verify colors invert appropriately
4. Refresh page - theme should persist
5. Check all pages (dashboard, portfolio) for consistency

### Browser Console
```js
// Check current theme
localStorage.getItem('theme')

// Manually set theme
localStorage.setItem('theme', 'light')
localStorage.setItem('theme', 'dark')
```

## Future Enhancements

- [ ] Add system theme detection (`prefers-color-scheme`)
- [ ] Add more color themes (blue, purple, etc.)
- [ ] Add theme customization per user in database
- [ ] Add animation to theme transition
- [ ] Add keyboard shortcut (e.g., Ctrl+Shift+T)

## Design Philosophy

**Natural & Calming**: Forest greens and earth tones create a sophisticated, professional aesthetic that's easy on the eyes, especially for developers who spend long hours coding.

**Dark by Default**: Modern developers prefer dark themes, so we default to dark mode while offering light mode for those who prefer it.

**Consistent Contrast**: Both themes maintain high contrast ratios for accessibility (WCAG AA compliant).
