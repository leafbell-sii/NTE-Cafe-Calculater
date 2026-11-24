---
name: Neon Night Café
colors:
  surface: '#141024'
  surface-dim: '#141024'
  surface-bright: '#3b364c'
  surface-container-lowest: '#0f0b1f'
  surface-container-low: '#1d192d'
  surface-container: '#211d31'
  surface-container-high: '#2b273c'
  surface-container-highest: '#363247'
  on-surface: '#e7defb'
  on-surface-variant: '#b9cac7'
  inverse-surface: '#e7defb'
  inverse-on-surface: '#322d43'
  outline: '#849491'
  outline-variant: '#3b4a47'
  surface-tint: '#00decf'
  primary: '#d1fff8'
  on-primary: '#003733'
  primary-container: '#2ef2e2'
  on-primary-container: '#006b63'
  inverse-primary: '#006a63'
  secondary: '#cebdff'
  on-secondary: '#381385'
  secondary-container: '#4f319c'
  on-secondary-container: '#bea8ff'
  tertiary: '#fff5e0'
  on-tertiary: '#3c2f00'
  tertiary-container: '#ffd54a'
  on-tertiary-container: '#735c00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#40fbeb'
  primary-fixed-dim: '#00decf'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#ffe085'
  tertiary-fixed-dim: '#ebc238'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#141024'
  on-background: '#e7defb'
  surface-variant: '#363247'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  numeric-hero:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  numeric-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  numeric-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  numeric-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
  numeric-sm:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system targets Korean café owners, baristas, and menu planners analyzing sales metrics, recipe margins, and menu popularity late into the evening. The visual tone evokes an urban Seoul nighttime atmosphere—quiet, focused, and luminous against deep nocturnal shadows.

The design movement combines **Midnight Minimalism** with disciplined neon accenting:
- **Zero Glassmorphism:** Strictly avoid translucency, frosted backdrops, or gradient borders. Surfaces remain solid and structurally grounded.
- **Controlled Luminescence:** Neon cyan is applied with extreme restraint, reserved exclusively for the `#1` featured item, active states, and critical comparative percentages.
- **Clarity Over Flash:** High contrast typography and tabular figures ensure instantaneous price calculation and inventory scanning during fast-paced shifts.

## Colors

The palette leverages an inky violet-black ground to make calculations pop without causing eye fatigue in dim environments.

- **Background (`#0D0A17`)**: The deepest foundation canvas.
- **Panels / Surface (`#161226`)**: Standard card containers, table headers, and calculation sections.
- **Featured Surface (`#201A35`)**: Exclusively reserved for the top-performing `#1` calculation card or hero KPI block.
- **Electric Cyan (`#2EF2E2`)**: High-priority utility accent. Used strictly for the `#1` card border/glow, rank badges, active segmented tabs, and delta percentages (`+12.4%`). Never used for generic body text.
- **Categorical Accents**:
  - Main Menu: `#FF9A5C` (Warm Peach)
  - Dessert: `#FF7EC8` (Bright Berry)
  - Beverage: `#5CB8FF` (Cool Sky)
  - Levels / Tiers: `#A78BFA` (Soft Lilac)
  - Rating / Trend Stars: `#FFD54A` (Gold Yellow)
- **Hierarchy & Borders**:
  - Primary Labels & Values: `#FFFFFF`
  - Secondary Context: `#A09BB5`
  - Structural Divider Lines & Outlines: `#2D2745`

## Typography

Typography strictly balances Korean legibility with monospaced accounting rigor.

- **Numerics & Analytics:** Always styled in `Space Grotesk` with tabular figures enabled (`font-feature-settings: "tnum" 1`). This eliminates jitter across columns of won amounts (₩), margins, and unit counts.
- **Korean UI Strings:** Set with `Inter` (or fallback to system Pretendard/Apple SD Gothic Neo) using tight letter-spacing (`-0.01em`) to keep Korean syllabic blocks dense and legible.
- **Data Labels:** Micro indicators use `label-caps` for acronyms (e.g., COGS, ROI, POS).

## Layout & Spacing

The layout follows a fluid-grid structure optimized for handheld point-of-sale tablets and smartphones:
- **Mobile (< 768px):** Single-column stacked cards, `1rem` (16px) canvas margin, and `0.75rem` vertical separation between calculation rows.
- **Tablet & Desktop (≥ 768px):** 12-column grid. The calculator keypad and summary rail snap into a persistent 4-column side pane, while historical listings and ranked cards populate the 8-column primary viewport.
- **Density:** High information density. Component internals use compact padding (`space-sm` to `space-md`) to ensure full calculation tallies remain visible above the fold.

## Elevation & Depth

This system avoids soft, floating realism and gradients in favor of **Tonal Plateaus** and **Restrained Neon Framing**:

1. **Base Tier (Flat):** The main canvas sits at `#0D0A17`.
2. **Elevated Panels (Surface):** Cards, tally sheets, and keyboards sit at `#161226` with a crisp 1px solid border of `#2D2745`. No drop shadows.
3. **The Singular Glow Rule:**
   - Standard cards have `box-shadow: none`.
   - **Only** the `#1 Ranked / Best Selling Card` gains the luminous neon treatment: a 1px solid border in `#2EF2E2` accompanied by a localized outer aura: `box-shadow: 0 0 16px -2px rgba(46, 242, 226, 0.35)`.
4. **Active Controls:** Focused numeric input elements receive a 1px outline of `#2EF2E2` without blur, retaining tactile edge fidelity.

## Shapes

The design uses a balanced `8px` (`0.5rem`) baseline radius (`roundedness: 2`):
- **Cards, Panels & Keypads:** `0.5rem` (`rounded-md`).
- **Pills, Badges & Chips:** Fully circular `9999px` to distinguish metadata from actionable rectangular touch targets.
- **Inputs & Keypad Buttons:** `0.5rem` (`rounded-md`) for quick, finger-friendly targets.

## Components

### 1. Calculation Cards & #1 Featured Card
- **Standard Card:** Background `#161226`, border `1px solid #2D2745`, border-radius `8px`, padding `1rem`. Secondary text in `#A09BB5`.
- **#1 Featured Card:** Background `#201A35`, border `1px solid #2EF2E2`, box-shadow `0 0 16px -2px rgba(46, 242, 226, 0.35)`. Features the cyan rank badge in the top-right corner.

### 2. Category Chips & Badges
- **Shape:** Pill-style (`rounded-full`), height `24px`, font size `11px`, font weight `600`.
- **Category Colors (Solid muted fill + high-contrast text):**
  - 메인 메뉴 (Main): Border `1px solid #FF9A5C`, text `#FF9A5C`, background `rgba(255, 154, 92, 0.12)`.
  - 디저트 (Dessert): Border `1px solid #FF7EC8`, text `#FF7EC8`, background `rgba(255, 126, 200, 0.12)`.
  - 음료 (Beverage): Border `1px solid #5CB8FF`, text `#5CB8FF`, background `rgba(92, 184, 255, 0.12)`.
- **Level Badges:** Background `#A78BFA`, text `#0D0A17` (bold dark contrast).

### 3. Segmented Controls (Tab Buttons)
- **Container:** Background `#0D0A17`, border `1px solid #2D2745`, padding `4px`, border-radius `8px`.
- **Inactive Tab:** Text `#A09BB5`, background `transparent`.
- **Active Tab:** Text `#0D0A17`, background `#2EF2E2`, font-weight `600`. No gradients.

### 4. Input Fields & Numeric Keypad
- **Input Field:** Background `#0D0A17`, border `1px solid #2D2745`, text `#FFFFFF`, caret `#2EF2E2`. Focus: Border `#2EF2E2`.
- **Keypad Buttons:** Solid `#161226`, border `1px solid #2D2745`, text `Space Grotesk` `#FFFFFF` (18px). Active tap state: `#201A35`.

### 5. Checkboxes & Radio Buttons
- **Unchecked:** 18px square/circle, border `1.5px solid #2D2745`, background `transparent`.
- **Checked:** Background `#2EF2E2`, border `#2EF2E2`, checkmark icon `#0D0A17`.

### 6. Star Trend Rating
- **Icon:** Solid 5-point star filled with `#FFD54A`.
- **Empty State:** Outlined or filled with `#2D2745`.
- **Score Tag:** Adjacent numeric trend score (`Space Grotesk`, 12px, `#FFD54A`).