# Shift Design System

## Brand Identity

### Brand Values
- **Trust & Professionalism**: Building reliable tools for coaching professionals
- **Growth & Transformation**: Empowering coaches to scale their business
- **Clarity & Simplicity**: Intuitive interfaces that reduce administrative burden
- **Modern & Approachable**: Contemporary design that feels welcoming

### Color Psychology
- **Primary (Indigo)**: Conveys trust, professionalism, and stability - perfect for a coaching business management tool. Indigo suggests expertise and reliability while remaining modern and approachable.
- **Secondary (Purple/Pink Gradient)**: The gradient (#A855F7 → #C026D3 → #EC4899) adds energy, creativity, and transformation - aligning with the coaching industry's focus on growth and change.
- **Accent (Blue)**: Provides clarity and communication for informational states.

---

## Color Palette

### Primary Colors (Indigo)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| primary-50 | #EEF2FF | 238, 242, 255 | Lightest backgrounds, subtle highlights | ❌ | ❌ |
| primary-100 | #E0E7FF | 224, 231, 255 | Light backgrounds, hover states | ❌ | ❌ |
| primary-200 | #C7D2FE | 199, 210, 254 | Borders, disabled states | ❌ | ❌ |
| primary-300 | #A5B4FC | 165, 180, 252 | Muted accents | ❌ | ✅ |
| primary-400 | #818CF8 | 129, 140, 248 | Logos, icons (light mode) | ❌ | ✅ |
| primary-500 | #6366F1 | 99, 102, 241 | Default buttons, links, active states | ❌ | ✅ |
| primary-600 | #4F46E5 | 79, 70, 229 | **Primary button default** | ✅ | ✅ |
| primary-700 | #4338CA | 67, 56, 202 | **Primary button hover** | ✅ | ✅ |
| primary-800 | #3730A3 | 55, 48, 163 | **Primary button pressed**, dark mode accents | ✅ | ✅ |
| primary-900 | #312E81 | 49, 46, 129 | Darkest primary | ✅ | ✅ |
| primary-950 | #1E1B4B | 30, 27, 75 | Near-black backgrounds (dark mode) | ✅ | ✅ |

### Secondary Colors (Gradient)
| Color | Hex | RGB | Use Case |
|-------|-----|-----|----------|
| secondary-purple | #A855F7 | 168, 85, 247 | Gradient start, decorative accents |
| secondary-fuchsia | #C026D3 | 192, 38, 211 | Gradient middle |
| secondary-pink | #EC4899 | 236, 72, 153 | Gradient end, call-to-action accents |

**Gradient Usage:**
```css
background: linear-gradient(to right, #A855F7, #C026D3, #EC4899);
```

### Accent Colors (Blue - Info)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| accent-50 | #EFF6FF | 239, 246, 255 | Info backgrounds | ❌ | ❌ |
| accent-100 | #DBEAFE | 219, 234, 254 | Light info backgrounds | ❌ | ❌ |
| accent-200 | #BFDBFE | 191, 219, 254 | Info borders | ❌ | ❌ |
| accent-600 | #2563EB | 37, 99, 235 | Info text, icons | ✅ | ✅ |
| accent-800 | #1E40AF | 30, 64, 175 | Dark info text | ✅ | ✅ |

### Neutral Colors (Gray)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| neutral-50 | #F9FAFB | 249, 250, 251 | Page backgrounds (light mode) | ❌ | ❌ |
| neutral-100 | #F3F4F6 | 243, 244, 246 | Card backgrounds (light mode) | ❌ | ❌ |
| neutral-200 | #E5E7EB | 229, 231, 235 | Borders, dividers | ❌ | ❌ |
| neutral-300 | #D1D5DB | 209, 213, 219 | Disabled borders, subtle dividers | ❌ | ✅ |
| neutral-400 | #9CA3AF | 156, 163, 175 | Placeholders, helper text | ❌ | ✅ |
| neutral-500 | #6B7280 | 107, 114, 128 | Secondary text | ✅ | ✅ |
| neutral-600 | #4B5563 | 75, 85, 99 | **Body text (light mode)** | ✅ | ✅ |
| neutral-700 | #374151 | 55, 65, 81 | **Headings (light mode)** | ✅ | ✅ |
| neutral-800 | #1F2937 | 31, 41, 55 | **Dark mode cards/surfaces** | ✅ | ✅ |
| neutral-900 | #111827 | 17, 24, 39 | **Dark mode backgrounds** | ✅ | ✅ |

### Semantic Colors

#### Success (Green)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| success-50 | #F0FDF4 | 240, 253, 244 | Success backgrounds | ❌ | ❌ |
| success-100 | #DCFCE7 | 220, 252, 231 | Light success backgrounds | ❌ | ❌ |
| success-200 | #BBF7D0 | 187, 247, 208 | Success borders | ❌ | ❌ |
| success-600 | #16A34A | 22, 163, 74 | Success text, icons | ✅ | ✅ |
| success-800 | #166534 | 22, 101, 52 | Dark success text | ✅ | ✅ |
| success-900 | #14532D | 20, 83, 45 | Darkest success | ✅ | ✅ |

#### Warning (Amber)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| warning-50 | #FFFBEB | 255, 251, 235 | Warning backgrounds | ❌ | ❌ |
| warning-100 | #FEF3C7 | 254, 243, 199 | Light warning backgrounds | ❌ | ❌ |
| warning-200 | #FDE68A | 253, 230, 138 | Warning borders | ❌ | ❌ |
| warning-600 | #D97706 | 217, 119, 6 | Warning text, icons | ✅ | ✅ |
| warning-800 | #92400E | 146, 64, 14 | Dark warning text | ✅ | ✅ |

#### Error (Red)
| Shade | Hex | RGB | Use Case | WCAG AA (Light) | WCAG AA (Dark) |
|-------|-----|-----|----------|-----------------|----------------|
| error-50 | #FEF2F2 | 254, 242, 242 | Error backgrounds | ❌ | ❌ |
| error-100 | #FEE2E2 | 254, 226, 226 | Light error backgrounds | ❌ | ❌ |
| error-200 | #FECACA | 254, 202, 202 | Error borders | ❌ | ❌ |
| error-600 | #DC2626 | 220, 38, 38 | Error text, icons | ✅ | ✅ |
| error-800 | #991B1B | 153, 27, 27 | Dark error text | ✅ | ✅ |
| error-900 | #7F1D1D | 127, 29, 29 | Darkest error | ✅ | ✅ |

---

## Typography

### Font Families
```css
font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes & Line Heights
| Size | Tailwind Class | px | rem | Line Height | Use Case |
|------|----------------|----|----|-------------|----------|
| xs | text-xs | 12px | 0.75rem | 1rem (16px) | Captions, timestamps, badges |
| sm | text-sm | 14px | 0.875rem | 1.25rem (20px) | Helper text, labels, small body text |
| base | text-base | 16px | 1rem | 1.5rem (24px) | **Default body text** |
| lg | text-lg | 18px | 1.125rem | 1.75rem (28px) | Large body text, subheadings |
| xl | text-xl | 20px | 1.25rem | 1.75rem (28px) | Section headings |
| 2xl | text-2xl | 24px | 1.5rem | 2rem (32px) | Page titles |
| 3xl | text-3xl | 30px | 1.875rem | 2.25rem (36px) | Hero headings |

### Font Weights
| Weight | Tailwind Class | Value | Use Case |
|--------|----------------|-------|----------|
| Normal | font-normal | 400 | Body text |
| Medium | font-medium | 500 | Emphasized text, labels |
| Semibold | font-semibold | 600 | Subheadings, buttons |
| Bold | font-bold | 700 | Headings, strong emphasis |

---

## Spacing & Layout

### Spacing Scale (Tailwind)
```
4px (1) - 8px (2) - 12px (3) - 16px (4) - 20px (5) - 24px (6) - 32px (8) - 40px (10) - 48px (12) - 64px (16) - 80px (20)
```

### Common Spacing Patterns
- **Component padding**: `p-4` (16px) to `p-6` (24px)
- **Card padding**: `p-8` (32px)
- **Section spacing**: `space-y-6` (24px) or `space-y-8` (32px)
- **Page margins**: `px-4` mobile, `px-6` tablet+

### Border Radius
| Size | Tailwind Class | Value | Use Case |
|------|----------------|-------|----------|
| Small | rounded | 4px | Buttons, badges |
| Medium | rounded-lg | 8px | Cards, inputs |
| Large | rounded-xl | 12px | Modals, large cards |
| Extra Large | rounded-2xl | 16px | Hero sections, auth pages |
| Full | rounded-full | 9999px | Pills, avatars |

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors">
  Primary Action
</button>
```

**States:**
- Default: `bg-primary-600`
- Hover: `hover:bg-primary-700`
- Active/Pressed: `active:bg-primary-800`
- Disabled: `disabled:bg-primary-400 disabled:cursor-not-allowed`

#### Secondary Button
```tsx
<button className="px-4 py-3 text-sm font-medium text-primary-600 bg-white border border-primary-600 hover:bg-primary-50 active:bg-primary-100 disabled:text-primary-300 disabled:border-primary-300 disabled:cursor-not-allowed rounded-lg transition-colors dark:bg-neutral-800 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-neutral-700">
  Secondary Action
</button>
```

#### Danger Button
```tsx
<button className="px-4 py-3 text-sm font-medium text-white bg-error-600 hover:bg-error-700 active:bg-error-800 disabled:bg-error-400 disabled:cursor-not-allowed rounded-lg transition-colors">
  Delete
</button>
```

### Forms

#### Input Field
```tsx
<input
  type="text"
  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-neutral-600 dark:bg-neutral-700 dark:text-white transition-colors"
  placeholder="Enter value"
/>
```

#### Label
```tsx
<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
  Field Label
</label>
```

#### Helper Text
```tsx
<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
  Additional context or instructions
</p>
```

#### Error Message
```tsx
<p className="mt-1 text-sm text-error-600 dark:text-error-400">
  This field is required
</p>
```

### Cards

#### Basic Card
```tsx
<div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-700">
  {/* Content */}
</div>
```

#### Hover Card (Interactive)
```tsx
<div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer">
  {/* Content */}
</div>
```

### Alerts

#### Success Alert
```tsx
<div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
  <p className="text-sm text-success-800 dark:text-success-200">
    Success message here
  </p>
</div>
```

#### Error Alert
```tsx
<div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
  <p className="text-sm text-error-600 dark:text-error-400">
    Error message here
  </p>
</div>
```

#### Info Alert
```tsx
<div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
  <p className="text-sm text-accent-800 dark:text-accent-200">
    Info message here
  </p>
</div>
```

#### Warning Alert
```tsx
<div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
  <p className="text-sm text-warning-800 dark:text-warning-200">
    Warning message here
  </p>
</div>
```

### Badges

#### Primary Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
  Active
</span>
```

#### Success Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300">
  Completed
</span>
```

#### Warning Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
  Pending
</span>
```

---

## Page Layouts

### Authentication Pages (Login, Signup, Password Reset)
```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
  <div className="max-w-md w-full">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      {/* Content */}
    </div>
  </div>
</div>
```

**Background Gradient:**
- Light mode: `from-blue-50 to-indigo-100`
- Dark mode: `dark:from-gray-900 dark:to-gray-800`

### Dashboard/App Pages
```tsx
<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
  {/* Navigation */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </main>
</div>
```

---

## Dark Mode

### Implementation
Dark mode is implemented using Tailwind's `class` strategy:
```tsx
// tailwind.config.ts
darkMode: 'class'
```

### Color Mappings

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `bg-neutral-50` | `dark:bg-neutral-900` |
| Card background | `bg-white` | `dark:bg-neutral-800` |
| Body text | `text-neutral-600` | `dark:text-neutral-300` |
| Headings | `text-neutral-900` | `dark:text-white` |
| Borders | `border-neutral-200` | `dark:border-neutral-700` |
| Input backgrounds | `bg-white` | `dark:bg-neutral-700` |
| Disabled text | `text-neutral-400` | `dark:text-neutral-500` |

### Pattern
Always pair light and dark classes:
```tsx
className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
```

---

## Accessibility

### Color Contrast Requirements
- **Body text**: Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text** (18px+): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Safe Color Combinations

#### Light Mode
- Body text: `text-neutral-600` or darker on `bg-white`
- Links: `text-primary-600` or darker on `bg-white`
- Buttons: Use `primary-600` and darker shades

#### Dark Mode
- Body text: `text-neutral-300` or lighter on `dark:bg-neutral-900`
- Links: `text-primary-400` or lighter on `dark:bg-neutral-900`
- Buttons: Use `primary-400` and lighter shades for text

### Focus States
All interactive elements must have visible focus states:
```tsx
focus:ring-2 focus:ring-primary-500 focus:border-transparent
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<button>`, `<a>`, etc.)
- Maintain logical tab order

---

## Animations

### Transitions
Default transition for interactive states:
```tsx
transition-colors // For color changes
transition-all    // For multiple properties
```

### Custom Animations

#### Slide Down (Toast/Notification)
```tsx
animate-slide-down
```

**Definition:**
```ts
// tailwind.config.ts
animation: {
  'slide-down': 'slideDown 0.3s ease-out',
},
keyframes: {
  slideDown: {
    '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
    '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
  },
}
```

---

## Usage Guidelines

### Color Usage Rules

1. **Primary colors** for:
   - Primary actions (buttons, links)
   - Navigation active states
   - Brand elements

2. **Secondary gradient** for:
   - Hero sections
   - Marketing materials
   - Decorative accents
   - NOT for primary UI elements

3. **Semantic colors** for:
   - Success: Completed actions, confirmations
   - Warning: Caution states, pending actions
   - Error: Validation errors, destructive actions
   - Info (accent blue): Informational messages, tips

4. **Neutral colors** for:
   - Text content
   - Backgrounds
   - Borders
   - Subtle UI elements

### Text Hierarchy

1. **Page Title**: `text-3xl font-bold text-neutral-900 dark:text-white`
2. **Section Heading**: `text-2xl font-bold text-neutral-900 dark:text-white`
3. **Subsection Heading**: `text-xl font-semibold text-neutral-700 dark:text-neutral-200`
4. **Body Text**: `text-base text-neutral-600 dark:text-neutral-300`
5. **Small Text**: `text-sm text-neutral-500 dark:text-neutral-400`
6. **Caption**: `text-xs text-neutral-400 dark:text-neutral-500`

### Spacing Consistency

- **Between form fields**: `space-y-4` or `space-y-6`
- **Between sections**: `space-y-8` or `space-y-12`
- **Card padding**: `p-6` (medium) or `p-8` (large)
- **Button padding**: `px-4 py-2` (small), `px-4 py-3` (medium), `px-6 py-3` (large)

---

## Implementation Checklist

When creating new components, ensure:

- [ ] Colors use design system tokens (primary-600, not custom hex)
- [ ] Dark mode variants included for all color classes
- [ ] Text meets WCAG AA contrast requirements
- [ ] Focus states visible on interactive elements
- [ ] Hover states use appropriate color transitions
- [ ] Disabled states have reduced opacity/different color
- [ ] Spacing uses Tailwind scale (p-4, not arbitrary values)
- [ ] Border radius consistent with component type
- [ ] Typography uses system font stack
- [ ] Responsive design considered (mobile-first)

---

## Code Examples

### Complete Form Example
```tsx
<form className="space-y-6">
  {/* Error Alert */}
  {error && (
    <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
      <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
    </div>
  )}

  {/* Input Field */}
  <div>
    <label
      htmlFor="email"
      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
    >
      Email address
    </label>
    <input
      id="email"
      type="email"
      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-neutral-700 dark:text-white transition-colors"
      placeholder="you@example.com"
    />
    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
      We'll never share your email
    </p>
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors"
  >
    Submit
  </button>
</form>
```

### Complete Card Example
```tsx
<div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-700">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
      Card Title
    </h2>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300">
      Active
    </span>
  </div>

  {/* Content */}
  <p className="text-base text-neutral-600 dark:text-neutral-300 mb-6">
    Card content goes here with proper text styling.
  </p>

  {/* Actions */}
  <div className="flex gap-3">
    <button className="px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg transition-colors">
      Primary Action
    </button>
    <button className="px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600 rounded-lg transition-colors">
      Secondary
    </button>
  </div>
</div>
```

---

## Quick Reference

### Most Common Classes

**Text:**
```tsx
text-neutral-900 dark:text-white              // Headings
text-neutral-600 dark:text-neutral-300        // Body text
text-neutral-500 dark:text-neutral-400        // Helper text
text-sm font-medium                            // Labels
```

**Backgrounds:**
```tsx
bg-white dark:bg-neutral-800                   // Cards
bg-neutral-50 dark:bg-neutral-900              // Page backgrounds
bg-primary-600 hover:bg-primary-700            // Primary buttons
```

**Borders:**
```tsx
border border-neutral-200 dark:border-neutral-700    // Standard borders
rounded-lg                                            // Standard radius
rounded-2xl                                           // Large cards
```

**Focus:**
```tsx
focus:ring-2 focus:ring-primary-500 focus:border-transparent
```

**Transitions:**
```tsx
transition-colors    // For hover/focus color changes
```
