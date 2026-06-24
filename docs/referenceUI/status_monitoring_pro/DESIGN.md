---
name: Status Monitoring Pro
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c6c5d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#908fa0'
  outline-variant: '#454654'
  surface-tint: '#bec2ff'
  primary: '#bec2ff'
  on-primary: '#0308a7'
  primary-container: '#7b85ff'
  on-primary-container: '#000396'
  inverse-primary: '#444dd3'
  secondary: '#c6c5d6'
  on-secondary: '#2f2f3c'
  secondary-container: '#474856'
  on-secondary-container: '#b8b7c7'
  tertiary: '#ffb781'
  on-tertiary: '#4e2500'
  tertiary-container: '#d87820'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bec2ff'
  on-primary-fixed: '#00026c'
  on-primary-fixed-variant: '#2831bb'
  secondary-fixed: '#e2e1f2'
  secondary-fixed-dim: '#c6c5d6'
  on-secondary-fixed: '#1a1b27'
  on-secondary-fixed-variant: '#454653'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb781'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703800'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  status-success: '#28A745'
  status-warning: '#FFBF00'
  status-danger: '#E11D48'
  border-subtle: '#24292E'
  text-muted: '#6A737D'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered for high-stakes uptime monitoring, where clarity and immediate information retrieval are paramount. The brand personality is professional, vigilant, and authoritative, providing users with a "mission control" experience.

The visual direction follows a **Minimalist-Professional** aesthetic with high data density. It prioritizes functional clarity over decorative elements, using a dark-mode-first approach to reduce eye strain during prolonged monitoring. The system relies on a strict grid, subtle 1px borders, and purposeful use of color to communicate system health ("Operasional", "Terdegradasi", or "Turun") without overwhelming the user.

## Colors

The palette is anchored by a deep near-black background (`#0F0F0F`) to ensure maximum contrast for status indicators. 

- **Primary:** A refined indigo-blue used sparingly for interactive elements and primary actions.
- **Surface:** A slightly lighter slate (`#171824`) is used for cards and containers to create depth against the background.
- **Semantic Status:** 
  - **Operasional (Success):** Emerald green, used for "All Systems Go" indicators.
  - **Terdegradasi (Warning):** Amber, signaling partial outages or latency issues.
  - **Turun (Danger):** Sharp red, reserved for critical downtime and active incidents.
- **Borders:** A consistent, low-contrast gray (`#24292E`) is used to define structure without visual clutter.

## Typography

This design system utilizes a dual-font strategy to balance readability with technical precision.

1.  **Inter (UI & Content):** Used for all structural labels, navigation, and body text. It provides a modern, neutral foundation.
2.  **JetBrains Mono (Data & Metrics):** Applied to all uptime percentages, response times (ms), and timestamps. The monospaced nature ensures that numbers align perfectly in lists and tables, allowing users to scan for anomalies quickly.

**Key Roles:**
- **Headline-LG:** Used for main dashboard titles (e.g., "Status Sistem").
- **Data-Mono:** Specifically for technical metrics (e.g., "99.99%", "240ms").
- **Label-Caps:** Used for small utility headers (e.g., "TERAKHIR DICEK").

## Layout & Spacing

The system employs a **Fixed Grid** approach for desktop to maintain information density within a 1200px container, transitioning to a fluid single-column layout for mobile devices.

- **Desktop:** 12-column grid with 24px (1.5rem) gutters.
- **Table:** 8-column grid with 16px (1rem) gutters.
- **Mobile:** 4-column grid with 16px (1rem) margins.

Spacing follows a strict 8px base unit. Use "Generous Whitespace" around status groups to prevent visual fatigue, but maintain tight "Stack" spacing between a label and its corresponding data point.

## Elevation & Depth

To maintain a professional and "flat" aesthetic, the design system avoids heavy shadows. Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** `#0F0F0F` - The base canvas.
- **Level 1 (Cards):** `#171824` - Used for service blocks and incident reports. Surfaces at this level feature a 1px solid border of `#24292E`.
- **Level 2 (Popovers/Tooltips):** A slightly lighter slate with a very subtle 8px blur shadow (opacity 0.4) to provide context-sensitive information without breaking the minimalist vibe.

## Shapes

The design system uses a **Soft** shape language. This adds a hint of approachability while maintaining the structural rigidity expected of a professional monitoring tool.

- **Standard Radius:** 4px (0.25rem) for small components like checkboxes, input fields, and status chips.
- **Large Radius:** 8px (0.5rem) for main dashboard cards and status bars.
- **Interactive Elements:** Buttons and form inputs should never be fully pill-shaped; they must maintain the 4px or 8px radius to align with the technical aesthetic.

## Components

### Status Bars (Uptime History)
- Use a series of vertical ticks representing 24 hours or 30 days.
- Color ticks based on the worst status recorded in that period (Success, Warning, Danger).
- Hovering a tick reveals a tooltip with the date and "Persentase Uptime" in `data-mono`.

### Cards (Monitor Blocks)
- **Header:** Service name on the left, current status (e.g., "Operasional") on the right.
- **Content:** The Uptime History bar.
- **Footer:** "Terakhir dicek: [Timestamp]" in `body-sm` using `text-muted`.

### Buttons
- **Primary:** Background `#606AF0`, text white, 4px border radius.
- **Ghost (Secondary):** Transparent background, 1px border `#24292E`, text white.

### Status Chips
- Small, rounded-sm containers with a subtle background tint and high-contrast text.
- Example: "Turun" would have a dark red background with bright red text.

### Inputs
- Background: `#0F0F0F` (inset appearance).
- Border: 1px `#24292E`.
- Focus State: Border color changes to primary indigo (`#606AF0`) with no outer glow.