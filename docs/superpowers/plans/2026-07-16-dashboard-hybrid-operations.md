# Renta Dashboard Hybrid Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh Renta dashboards using the approved Hybrid Operations direction.

**Architecture:** Add reusable dashboard surface/list utilities in global CSS, then apply them to the high-impact landlord pages. Keep business logic and API behavior unchanged.

**Tech Stack:** Next.js 16, React 19, CSS modules, global CSS utilities, lucide-react.

---

### Task 1: Shared Dashboard Surface System

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/Toast.js`
- Modify: `src/components/PaymentSetupCard.js`
- Modify: `src/components/ProfilePage.js`

- [ ] Add global dashboard utilities: `.dashboard-page`, `.dashboard-header`, `.dashboard-grid`, `.dashboard-surface`, `.dashboard-panel`, `.dashboard-alert`, `.stat-tile`, `.operation-list`, `.operation-row`, `.icon-chip`, `.section-heading-row`.
- [ ] Soften `.card` shadow and radius enough to improve existing pages without a risky global redesign.
- [ ] Remove inline left borders from shared payout, profile verification, tenant screening, and toast components.
- [ ] Run `npm run build`.

### Task 2: Landlord Tenants Page

**Files:**
- Modify: `src/app/(dashboard)/landlord/tenants/page.js`

- [ ] Replace oversized tenant cards with `.operation-list` and `.operation-row` structure.
- [ ] Keep tenant avatar, name, phone, property, status, start date, message action, and profile toggle.
- [ ] Replace nested expanded profile cards with flat `.dashboard-panel` detail blocks.
- [ ] Confirm mobile stacks actions below details without overflow.

### Task 3: Landlord Payments Page and Wallet Component

**Files:**
- Modify: `src/app/(dashboard)/landlord/payments/page.js`
- Modify: `src/components/WalletCard.js`

- [ ] Use a dashboard grid with the wallet as the primary panel and guide as the secondary panel.
- [ ] Convert wallet balance blocks to `.stat-tile` elements.
- [ ] Convert recent transactions to compact operation rows.
- [ ] Keep withdrawal behavior unchanged.

### Task 4: Add Property Desktop Layout

**Files:**
- Modify: `src/app/(dashboard)/landlord/properties/new/page.js`
- Modify: `src/app/(dashboard)/landlord/properties/new/new-property.module.css`

- [ ] Replace the 700px form bottleneck with responsive `.propertyFormLayout` and `.propertyFormAside`.
- [ ] Keep the existing three-step flow and validation behavior unchanged.
- [ ] Remove left accent error styling from the location error card.
- [ ] Confirm desktop no longer leaves a large unused right side.

### Task 5: Verification

**Files:**
- Add or run: `scripts/verify-ui.mjs` if available

- [ ] Run `npm run build`.
- [ ] Start the app or use existing server.
- [ ] Capture/check desktop and mobile views for `/landlord/profile`, `/landlord/tenants`, `/landlord/payments`, and `/landlord/properties/new`.
- [ ] Fix visible overflow, accidental left bars, oversized headings, and obvious spacing issues.
