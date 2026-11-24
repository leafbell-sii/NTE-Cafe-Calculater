---
version: alpha
name: Neon Night Café
description: Dark-first, neon-accented design system for a Korean web calculator that ranks the most profitable menu and staff combinations for a game's café mini-game. Numbers are the hero; neon is used sparingly as signage, never as decoration.
colors:
  # Default theme = dark (night café). Light theme overrides live under `light`.
  primary: "#2EF2E2"
  on-primary: "#04201E"
  primary-soft: "#0F2E33"
  secondary: "#A78BFA"
  on-secondary: "#140B2E"
  secondary-soft: "#231A40"
  background: "#0D0A17"
  surface: "#161226"
  surface-2: "#201A35"
  surface-sunken: "#0A0812"
  border: "#2F2748"
  text: "#F3EEFF"
  text-2: "#B8AED3"
  text-3: "#8A80A8"
  tag-main: "#FF9A5C"
  tag-main-soft: "#3A2418"
  tag-dessert: "#FF7EC8"
  tag-dessert-soft: "#3A1B30"
  tag-drink: "#5CB8FF"
  tag-drink-soft: "#15283D"
  trend: "#FFD54A"
  trend-soft: "#3A3014"
  positive: "#5CE6A0"
  negative: "#FF5C7A"
  light:
    primary: "#00706B"
    on-primary: "#FFFFFF"
    primary-soft: "#DDF5F3"
    secondary: "#6D4CE0"
    on-secondary: "#FFFFFF"
    secondary-soft: "#ECE6FD"
    background: "#F6F4FB"
    surface: "#FFFFFF"
    surface-2: "#EEEAF7"
    surface-sunken: "#E6E1F2"
    border: "#DAD3EC"
    text: "#17122A"
    text-2: "#514870"
    text-3: "#625A82"
    tag-main: "#A24A26"
    tag-main-soft: "#FBE6DC"
    tag-dessert: "#9E3D6D"
    tag-dessert-soft: "#F9E2EE"
    tag-drink: "#2A6594"
    tag-drink-soft: "#DEEDF8"
    trend: "#8F6400"
    trend-soft: "#FFF3CC"
    positive: "#2A6E43"
    negative: "#C4314F"
typography:
  app-title:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.02em
  title-md:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
  body-md:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
  label-sm:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  display-number:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.02em
    fontFeature: '"tnum" 1'
  number-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: '"tnum" 1'
  number-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    fontFeature: '"tnum" 1'
  receipt-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: '"tnum" 1'
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  gutter: 16px
  content-max: 1320px
  column-settings: 320px
  column-etc: 200px
  breakpoint-desktop: 900px
  character-grid-columns: 4
  food-slots: 5
  staff-slots: 10
motion:
  fast:
    duration: 120ms
    timingFunction: ease-out
  base:
    duration: 200ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  glow:
    duration: 1600ms
    timingFunction: ease-in-out
components:
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 16px
  section-heading:
    textColor: "{colors.text}"
    typography: "{typography.title-md}"
  segmented-control:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 36px
  segmented-control-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  chip-button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 32px
    padding: 0 12px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 0 16px
  input-field:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 0 12px
  result-card-featured:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: 24px
  result-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 16px
  result-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: 52px
    padding: 0 16px
  rank-badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    height: 28px
  revenue-number:
    textColor: "{colors.text}"
    typography: "{typography.display-number}"
  share-percent:
    textColor: "{colors.primary}"
    typography: "{typography.number-sm}"
  food-chip-main:
    backgroundColor: "{colors.tag-main-soft}"
    textColor: "{colors.tag-main}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  food-chip-dessert:
    backgroundColor: "{colors.tag-dessert-soft}"
    textColor: "{colors.tag-dessert}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  food-chip-drink:
    backgroundColor: "{colors.tag-drink-soft}"
    textColor: "{colors.tag-drink}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  trend-mark:
    textColor: "{colors.trend}"
    typography: "{typography.label-sm}"
  staff-avatar:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
    size: 44px
  level-badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    size: 18px
  character-tile-on:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 8px
  character-tile-off:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-3}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 8px
  level-select:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    typography: "{typography.number-sm}"
    rounded: "{rounded.sm}"
    height: 24px
  receipt-panel:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-2}"
    typography: "{typography.receipt-mono}"
    rounded: "{rounded.md}"
    padding: 16px
  more-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 44px
  quiet-link:
    textColor: "{colors.text-3}"
    typography: "{typography.body-sm}"
---

# Neon Night Café

## Overview

A single-page web tool (Korean UI) for players of a game's café mini-game. It calculates hourly café income in the in-game currency **폰즈** and ranks the best combinations of **5 menu items** and **up to 10 staff characters** from the characters the player owns.

Mood: a café street at night. Deep indigo-black surfaces, with cyan neon used like a shop sign to point at the single most important thing on screen: the #1 recommendation and its hourly income. Violet is a quiet secondary glow (levels, secondary emphasis). It should feel like a slick game companion tool, not a marketing site.

Priorities, in order:
1. The ranked results and their numbers are the hero. Everything else supports reading them.
2. High information density without clutter: many small facts (tags, prices, trend marks, levels) must stay scannable.
3. Inputs are always visible on desktop so the player can tweak and watch results update live.

This is a fan-made utility. It must not imitate any official game logo, title screen, or game UI chrome.

## Colors

- **Primary (neon cyan)**: the one "sign" color. Used for the #1 card's glow edge, the rank badge, active segmented-control states, the "% of #1" figure, focus rings, and primary actions. Never fill large areas with it.
- **Secondary (violet)**: level badges and secondary highlights only.
- **Background / surface / surface-2 / surface-sunken**: four depths of night. Background is the page; surface is panels and cards; surface-2 is the featured card and inactive controls; surface-sunken is inputs and the receipt.
- **Text / text-2 / text-3**: primary, secondary and meta text. text-3 is for meta labels and disabled states only.
- **Menu tag colors carry meaning and must stay distinct**: 메인 메뉴 = warm orange (`tag-main`), 디저트 = pink (`tag-dessert`), 음료 = sky blue (`tag-drink`). Each has a dark "soft" background for chips.
- **Trend (gold)**: only for the ★ trend marks on food chips.
- **Positive / negative**: net profit (positive) and the "−" differences against #1 or ingredient cost (negative, used softly).
- The `light` group defines the light theme with the same roles. Dark is the default.

## Typography

- **Pretendard** for all Korean UI text (fall back to Noto Sans KR if unavailable).
- **Space Grotesk** with tabular figures for every income/percentage number, so digits line up across cards. The #1 income uses `display-number`; row incomes use `number-md`.
- **JetBrains Mono** (tabular) for the receipt's step-by-step calculation lines.
- Numbers use Korean thousands separators and exactly two decimals (e.g. `2,719.69`). Percentages use two decimals (e.g. `99.95%`).

## Layout

- Max content width 1320px, 16px gutter, 16px gaps between columns and cards.
- **Desktop (≥900px): three columns**
  - Left (320px): 「설정」 panel (trend, popularity, Maneki-neko) stacked above the 「보유 캐릭터」 panel (character grid). The character panel is sticky and scrolls internally.
  - Center (fluid): 「추천 조합」 results.
  - Right (200px): 「기타」 panel (share link, share-code input, bug report, constants note, quiet link to manual mode). Sticky.
- **Mobile (<900px): one column** in this order: 설정 → 보유 캐릭터 → 추천 조합 → 기타.
- Character grid: 4 columns on desktop (16 characters), auto-fill ~68px tiles on mobile.
- Header is a slim bar: small logo mark + app title 「별미 카페 계산기」. No hero banner.

## Elevation & Depth

Depth comes from surface color steps, not heavy shadows. Use at most a soft, dark ambient shadow on cards. The featured #1 card gets a thin cyan border with a soft outer glow (like a neon sign reflecting on a wet street). No other element glows.

## Shapes

Rounded but not bubbly: panels 14px, featured card 20px, chips and inputs 10px, toggles and small buttons fully pill-shaped, avatars circular. Thin 1px borders in `border` separate panels from the background.

## Motion & Micro-interaction

Subtle and fast. Results reorder or update with a 200ms fade, and toggles change in 120ms. The featured card's glow may breathe very slowly (1600ms) but stays static when the user prefers reduced motion. Collapsed rows expand smoothly.

## Voice & Content Strategy

- All UI text is Korean. Short, functional labels: 「추천 조합」, 「매출순」, 「순수익순」, 「더 보기」, 「영수증」, 「대체 가능 직원」.
- Units: income is 「폰즈/시간」, foot traffic is 「P」, levels are 「Lv5」 or a small number badge.
- Never add marketing copy, onboarding text, or explanations longer than one line.

## Components

- **Segmented control**: used for the result sort, 2 options 「매출순 | 순수익순」. The header has no mode switch; manual mode is reached only through the quiet link.
- **Featured result card (#1)**: rank badge 「1위」, huge income number, unit 「폰즈/시간 매출」, `100.00%`; a money line 「매출 · 식재료 − · 순수익」; menu chips; staff avatars; actions 「대체 가능 직원 (N)」 and a collapsible 「영수증」.
- **Collapsed result row (#2+)**: one line: rank, income, % of #1, difference vs #1 (e.g. `−1.29`), then only what changed vs #1 as small +/− chips (e.g. `−백장 Lv5` `+민트 Lv5`), and a chevron. Clicking expands to a regular result card.
- **Food chip**: food name on top; below it `태그 · 가격` and the gold trend mark `★5/29`. Background and text color by tag.
- **Staff avatar**: circular character portrait, name under it, small violet level badge on the corner.
- **Character tile**: portrait, name, and a tiny level select (1–5). "On" = owned (cyan-tinted surface, full opacity). "Off" = not owned (desaturated portrait, dimmed name, level select disabled).
- **Receipt**: sunken monospace panel with numbered sections 1–8, each a list of label/value rows right-aligned on values; unmet conditional effects are shown dimmed with 「✗ 미충족」.
- **Quiet link**: 「수동 계산 (테스트용)」 in small text-3 at the bottom of the 기타 panel.

## Do's and Don'ts

- Do keep the #1 card the clear focal point of the page.
- Do keep the three tag colors distinguishable in both themes.
- Do right-align and tabular-align all numbers.
- Do use character portraits only inside circles or tiles. Use simple silhouettes as placeholders when no image is given.
- Don't use neon on more than one or two elements per view, and don't use gradients on text.
- Don't recreate or imitate an official game logo, title art, or in-game UI.
- Don't add charts, hero images, or decorative illustrations.
- Don't make the manual mode prominent.
