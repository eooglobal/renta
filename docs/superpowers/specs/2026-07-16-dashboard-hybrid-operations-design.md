# Renta Dashboard Hybrid Operations Design

**Approved direction:** Hybrid Operations, selected on 2026-07-16.

## Goal
Make Renta dashboards feel more intentional, polished, and operational without changing the sidebar or the existing product flows.

## Visual System
- Keep the current brand palette and fonts: League Spartan for headings and DM Sans for interface/body text.
- Replace the generic full-width card stack with reusable dashboard surfaces, compact stat tiles, bento grids where useful, and dense record rows where users scan operational data.
- Remove left accent bars from dashboard cards, alerts, and toasts. Emphasis should use icon chips, status pills, light semantic backgrounds, clean borders, and soft shadows.
- Keep card radius restrained at 8px for new dashboard surfaces and rows. Existing global cards can be softened, but avoid making everything extra-rounded.
- Tighten dashboard heading scale so pages do not inherit oversized marketing-page typography.

## Page Treatment
- Profile: convert status/verification/payout blocks into clean surfaces; remove left stripes; keep forms easy to scan in a controlled content width.
- Tenants: replace oversized horizontal tenant cards with compact operation rows, responsive actions, and inline expanded detail panels instead of nested cards.
- Payments & Wallet: make wallet stats feel like tiles inside one panel; make transactions dense and readable; simplify payout guide into a flat guide panel.
- Add Property: remove the 700px desktop bottleneck; use a two-column desktop composition with the form as the main panel and a compact side summary/support panel, collapsing to one column on mobile.

## Verification
Run `npm run build`, then check landlord profile, tenants, payments, and add-property pages in desktop and mobile widths. Confirm there are no visible left accent bars in touched dashboard surfaces, no text overflow, and the desktop layouts use space intentionally.
