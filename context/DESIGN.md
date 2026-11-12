---
version: "alpha"
name: "Grunge Rock dos Anos 90"
description: "90s grunge rock landing page. Ideal for landing pages, saas. AI-ready template."
colors:
  primary: "#262626"
  secondary: "#ACBFA4"
  neutral: "#E2E8CE"
  tint: "#FF7F11"
typography:
  h1:
    fontFamily: Funnel Display
    fontSize: 2.5rem
    fontWeight: 700
  body-md:
    fontFamily: Funnel Display
    fontSize: 1rem
    fontWeight: 400
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.primary}"
    padding: 12px
---

## Overview

90s grunge rock landing page. Ideal for landing pages, saas. AI-ready template. Before grunge had a name, it had a look — photocopied flyers stapled to telephone poles outside Seattle venues, hand-scrawled setlists, album art that looked like it survived a basement flood. Nirvana's Nevermind was polished on purpose (the irony wasn't lost on anyone), but Pearl Jam's Vs. and its stark livestock photography, Alice in Chains' tripod artwork, Mudhoney's xeroxed chaos — that was the real visual DNA. It wasn't designed. It was assembled.

Then David Carson blew typography apart. Ray Gun magazine (1992–2000) treated readability as optional. He set entire interviews in Zapf Dingbats. Columns bled off pages. Photos were scratched, layered, degraded. Carson wasn't illustrating grunge — he was proving that destruction was a valid compositional tool. The establishment hated it. Kids pinned those pages to their walls.

Distressed textures, torn paper edges, misregistered ink — these weren't aesthetic choices born from software filters. They came from actual physical processes: bad photocopiers, wheat-paste residue, rained-on gig posters. The roughness was evidence of lived experience. Anti-design became the only honest design for a generation that rejected the slick corporate visual language of the 80s.

- Density: 5/10 — Balanced
- Variance: 8/10 — Expressive
- Motion: 4/10 — Subtle

- **Style:** Raw, Gritty, Anti-Design
- **Keywords:** grunge, 90s rock, raw, gritty, anti-design, distressed, xerox, zine, chaotic, authentic
- **Era:** Early 1990s Alternative Scene
- **Light/Dark:** ✓ Full / ✗ No

## Colors

- **Sage Cream** (#E2E8CE) — Background, light surface, page and card backgrounds
- **Sage** (#ACBFA4) — Secondary surfaces, panels, borders, muted elements
- **Charcoal** (#262626) — Text, dark surfaces, icons, text on tint
- **Orange Tint** (#FF7F11) — Accent, primary call-to-action fill, highlights

Contrast notes (approximate):

- Charcoal on Sage Cream: about 12:1 — safe for all text.
- Charcoal on Sage: about 7.7:1 — safe for text.
- Charcoal on Orange Tint: about 6:1 — safe for button labels and text on tint.
- Orange Tint on Sage Cream: about 2:1 — **do not use tint as text color on the background**. Use tint only as a fill, border, underline, or icon accent.
- Sage on Sage Cream is low contrast — use it for surfaces and dividers, not for text.


## Typography

- **Display / Hero:** Funnel Display — Weight 700, tight tracking, used for headline impact
- **Body:** Funnel Display — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Funnel Display — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** system monospace (ui-monospace, monospace) — used only for code, metadata, and technical values

Font loading: Funnel Display must be loaded explicitly (Google Fonts or a self-hosted package). Use a fallback stack of `"Funnel Display", system-ui, sans-serif`, and make sure the font is loaded before rendering text onto canvas.

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem


## Layout

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Asymmetric composition.
- **Feature sections:** Asymmetric grid with varied card sizes. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).


## Elevation & Depth

Distressed textures, torn paper, xerox copy artifacts, chaotic typography, handwritten notes, duct tape elements, grainy photos, misaligned grids

- **Physics:** Ease-out curves, 200-300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color shift + shadow adjustment over 200ms.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.


## Shapes

Base corner radius: 8px. See rounded tokens in front matter for the full scale.


## Components

- **Primary Button:** Subtly rounded (0.5rem) shape. Orange Tint (#FF7F11) fill with Charcoal (#262626) label. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in Charcoal or Sage. Text in Charcoal. Hover: subtle Sage background fill.
- **Cards:** Subtly rounded (0.5rem) corners. Sage Cream or Sage surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke in Sage.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px Orange Tint offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Sage Cream surface background. Active item: Orange Tint indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions in Sage tones. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.


## Do's and Don'ts

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No pure black (#000000) — use Charcoal (#262626)
- No oversaturated accent colors (saturation cap: 80%)
- No Orange Tint as text color on light backgrounds — contrast is too low
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

- Do Distressed textures
- Do Xerox copy effects
- Do Chaotic typography
- Do Torn paper edges
- Do Duct tape elements
- Do Zine-style layout


## Use Case

Landing pages, SaaS