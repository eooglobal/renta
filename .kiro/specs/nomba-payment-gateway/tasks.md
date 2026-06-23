# Implementation Plan: Nomba Payment Gateway

## Overview

Add Nomba as a second, switchable payment gateway alongside Paystack. The work follows the design exactly: a new Nomba client (`src/lib/nomba.js`), a gateway router (`src/lib/paymentGateway.js`), updates to three existing routes, a new Nomba webhook handler, a Prisma migration for `nombaRef`, admin settings UI additions, and a seed script update. Each task builds on the previous one and ends with all pieces wired together.

Testing uses **Jest** and **fast-check** (property-based). Both must be installed as dev dependencies before any test tasks run.

---

## Tasks

- [x] 1. Install testing dependencies and set up Jest
  - Install `jest`, `@jest/globals`, `jest-environment-node`, and `fast-check` as dev dependencies
  - Add a `jest.config.js` (or `jest.config.mjs`) at the project root configured for the Node environment with module name mapping for the `@/` alias
  - Add a `"test"` script to `package.json`: `jest --testPathPattern=__tests__`
  - Create the `src/__tests__/` directory with a `.gitkeep` so the folder is tracked
  - _Requirements: (test infrastructure — prerequisite for all test sub-tasks)_

- [x] 2. Add Prisma migration and update schema for `nombaRef`
  - In `prisma/schema.prisma`, change `Payment.paystackRef` from `String @unique` to `String? @unique` (make it nullable)
  - Add `nombaRef String? @unique @map("nomba_ref")` to the `Payment` model immediately after `paystackRef`
  - Run `npx prisma migrate dev --name add_nomba_ref` to generate and apply the migration
  - Verify that existing rows are unaffected (the column is nullable, so no data loss)
  - _Requirements: 8.1, 8.2_

- [x] 3. Update seed script for Nomba settings
  - In `scripts/seed-settings.js`, append five new `PlatformSetting` upsert entries to the `settings` array:
    - `ACTIVE_PAYMENT_GATEWAY` (group: `PAYMENT_GATEWAY`, type: `text`, default value: `paystack`, label: `Active Gateway`, description: `paystack or nomba`)
    - `NOMBA_CLIENT_ID` (group: `PAYMENT_GATEWAY`, type: `text`, label: `Nomba Client ID`)
    - `NOMBA_CLIENT_SECRET` (group: `PAYMENT_GATEWAY`, type: `password`, label: `Nomba Client Secret`)
    - `NOMBA_ACCOUNT_ID` (group: `PAYMENT_GATEWAY`, type: `text`, label: `Nomba Account ID`)
    - `NOMBA_WEBHOOK_SECRET` (group: `PAYMENT_GATEWAY`, type: `password`, label: `Nomba Webhook Secret`)
  - The upsert logic must leave `value` unchanged for existing rows (only update `label`, `group`, `description`, `type`) — follow the existing pattern in the file
  - _Requirements: 9.1, 9.2_

- [x] 4. Implement `src/lib/nomba.js` — Nomba API client
  - [x] 4.1 Implement `getToken()` with in-process token cache
    - Declare module-level `tokenCache = { accessToken: null, expiresAt: 0 }`
    - `getToken` returns the cached token if `Date.now() < expiresAt - 60_000`; otherwise POSTs to `https://api.nomba.com/v1/auth/token/issue` with `grant_type: "client_credentials"`, `client_id`, `client_secret` from `getSetting`, and `Authorization: Bearer <NOMBA_ACCOUNT_ID>` header
    - On non-`"00"` response code, throw `new Error(data.description)`
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [ ]* 4.2 Write unit tests for `getToken`
    - Mock `getSetting` and `fetch`; test: returns cached token without fetching, fetches new token when cache is empty, fetches new token when cache is expired, throws on non-`"00"` response code
    - _Requirements: 2.2, 2.3, 2.7_

  - [x] 4.3 Implement `initializePayment({ email, amount, reference, callbackUrl, metadata })`
    - Call `getToken()`, then POST to `https://api.nomba.com/v1/checkout/order`
    - Request body: `{ orderReference: reference, customerId: email, callbackUrl, customerEmail: email, currency: "NGN", amount: amount.toFixed(2), metadata }`
    - Authorization header: `Bearer <token>`; `X-Nomba-Account-Id: <NOMBA_ACCOUNT_ID>` header
    - On success return `{ checkoutLink, orderReference }` from `data`
    - On non-`"00"` response code, throw `new Error(data.description)`
    - _Requirements: 2.4, 2.5, 2.7_

  - [ ]* 4.4 Write unit tests for `initializePayment`
    - Mock `getSetting`, `fetch`; test: correct request body shape, amount sent as `toFixed(2)` string, `callbackUrl` included, returns `{ checkoutLink, orderReference }`, throws on API error
    - _Requirements: 2.4, 2.5, 2.7_

  - [x] 4.5 Implement `verifyPayment(orderReference)`
    - Call `getToken()`, then GET `https://api.nomba.com/v1/transactions/accounts/single?orderReference={ref}`
    - Map response: `status = (data.responseCode === "00" || data.status === "SUCCESS") ? "success" : "failed"`
    - Return `{ status, transactionId: data.transactionId, amount: data.amount, paidAt: data.time }`
    - _Requirements: 2.6, 2.7_

  - [ ]* 4.6 Write unit tests for `verifyPayment`
    - Mock `getSetting`, `fetch`; test: maps success status, maps failure status, propagates error from `getToken`
    - _Requirements: 2.6_

  - [x] 4.7 Implement `validateWebhookSignature(rawBody, headers)`
    - Extract `nomba-timestamp` and `nomba-signature` from `headers`
    - Parse `rawBody` as JSON to extract the concatenation fields: `event_type`, `requestId`, `merchant.userId`, `merchant.walletId`, `transaction.transactionId`, `transaction.type`, `transaction.time`, `transaction.responseCode`
    - Construct the string: `{event_type}:{requestId}:{merchant.userId}:{merchant.walletId}:{transaction.transactionId}:{transaction.type}:{transaction.time}:{transaction.responseCode}:{nomba-timestamp}`
    - Compute HMAC-SHA256 over that string using `NOMBA_WEBHOOK_SECRET`, Base64-encode the result
    - Return `true` if the Base64 digest equals `nomba-signature`, `false` otherwise
    - Return `false` (don't throw) if any header is missing
    - _Requirements: 2.8_

  - [ ]* 4.8 Write unit tests for `validateWebhookSignature`
    - Mock `getSetting`; test: returns `true` for correct signature, returns `false` for tampered body, returns `false` for wrong secret, returns `false` when header is missing
    - _Requirements: 2.8_

- [x] 5. Implement `src/lib/paymentGateway.js` — Gateway Router
  - [x] 5.1 Implement `getActiveGateway()`, `generateReference(prefix)`, `initializePayment(params)`, and `verifyPayment(reference)`
    - `getActiveGateway`: calls `getSetting('ACTIVE_PAYMENT_GATEWAY')` on every invocation (not at module load); returns `"nomba"` if value is exactly `"nomba"`, otherwise returns `"paystack"` (default fallback per Requirement 1.4); log a debug message when the setting is absent
    - `generateReference`: re-exports the same logic as `src/lib/paystack.js` `generateReference` (can import and re-export it directly, or duplicate the implementation)
    - `initializePayment`: reads `getActiveGateway()`, delegates to the appropriate client; when `nomba`, maps `{ checkoutLink, orderReference }` → `{ authorization_url: checkoutLink, reference: orderReference }`; when `paystack`, returns Paystack response as-is
    - `verifyPayment`: reads `getActiveGateway()`, delegates to the appropriate client; when `nomba`, maps Nomba response → `{ status, paid_at: paidAt }`; when `paystack`, returns Paystack response as-is
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Write property test — Property 1: Gateway defaults to Paystack
    - **Property 1: Gateway Router defaults to Paystack**
    - **Validates: Requirements 1.4, 3.4**
    - Use `fast-check`; for any `ACTIVE_PAYMENT_GATEWAY` value that is not the exact string `"nomba"` (generate arbitrary strings, empty string, undefined), assert that the router calls the Paystack `initializePayment` and never calls the Nomba `initializePayment`
    - Minimum 100 iterations

  - [ ]* 5.3 Write property test — Property 2: Router response shape is stable
    - **Property 2: Gateway Router response shape is stable**
    - **Validates: Requirements 3.2, 4.4**
    - Use `fast-check`; generate arbitrary valid payment param objects (email, positive amount, reference string, callbackUrl); mock both gateway clients to return valid responses; assert that the resolved object always has a non-empty `authorization_url` string and a non-empty `reference` string regardless of which gateway is active
    - Minimum 100 iterations

  - [ ]* 5.4 Write property test — Property 3: Nomba amount encoding
    - **Property 3: Nomba amount encoding**
    - **Validates: Requirements 2.5**
    - Use `fast-check`; generate arbitrary positive numbers (including decimals and large values); call the Nomba client's `initializePayment` with a mocked `fetch`; assert that the `amount` field in the captured request body equals `(amount).toFixed(2)`
    - Minimum 100 iterations

- [ ] 6. Update `src/app/api/payments/initialize/route.js`
  - Replace `import { initializePayment, generateReference } from '@/lib/paystack'` with `import { initializePayment, generateReference, getActiveGateway } from '@/lib/paymentGateway'`
  - After generating the `reference`, call `const gateway = await getActiveGateway()`
  - Update `prisma.payment.create` to conditionally set `paystackRef: gateway === 'paystack' ? reference : null` and `nombaRef: gateway === 'nomba' ? reference : null`
  - Pass the same `callbackUrl` pattern (`${appUrl}/tenant/payments/verify?reference=${reference}`) to both gateways — no change to the URL shape
  - The JSON response shape `{ message, paymentUrl, reference, rental }` remains unchanged
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.1 Write property test — Property 5: Payment column mutual exclusivity
    - **Property 5: Payment column mutual exclusivity**
    - **Validates: Requirements 4.2, 8.3**
    - Use `fast-check`; generate arbitrary gateway selector values (`"paystack"` or `"nomba"`); mock `prisma.payment.create` to capture the `data` argument; assert that exactly one of `paystackRef` and `nombaRef` is non-null and the other is null for every generated input
    - Minimum 100 iterations

- [ ] 7. Update `src/app/api/payments/verify/route.js`
  - Replace `import { verifyPayment } from '@/lib/paystack'` with `import { verifyPayment } from '@/lib/paymentGateway'`
  - Update the `prisma.payment.findFirst` lookup to use `OR: [{ paystackRef: reference }, { nombaRef: reference }]` instead of `{ paystackRef: reference }` so both gateway references are matched
  - Wrap the `verifyPayment` call in a try/catch; if it throws, return `NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })`
  - All downstream transaction logic (updating Payment, Rental, Property, Escrow) is unchanged
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.1 Write unit test — Property 6: Verify route lookup is gateway-agnostic
    - **Property 6: Verify route lookup is gateway-agnostic**
    - **Validates: Requirements 5.2**
    - Mock `prisma.payment.findFirst`; test with a `paystackRef` reference and a `nombaRef` reference; assert the `OR` clause is always used regardless of which ref format is passed
    - _Requirements: 5.2_

- [x] 8. Implement `src/app/api/webhooks/nomba/route.js` — Nomba Webhook Handler
  - [x] 8.1 Create the Nomba webhook handler route
    - Create `src/app/api/webhooks/nomba/route.js` exporting an async `POST` function
    - Read raw body with `request.text()`; call `validateWebhookSignature(rawBody, request.headers)`; if it returns `false`, return HTTP 401 `{ error: 'Invalid signature' }`
    - Parse `rawBody` as JSON to get `{ event, data }`
    - For event `payment_success`:
      - If `data.order.metadata?.type === 'FEATURE_LISTING'`: update `Property.isFeatured = true` and `Property.featuredUntil = now + 7 days` for `data.order.metadata.propertyId` — mirror the Paystack webhook exactly
      - Otherwise (rental payment): `Payment.findFirst({ where: { nombaRef: data.order.orderReference } })`; if found and status is not `SUCCESS`, run `prisma.$transaction` to update `Payment → SUCCESS`, `Rental → ACTIVE`, `Property → RENTED`, `Escrow → HELD` — mirror the Paystack webhook transaction exactly
    - Return HTTP 200 `{ status: 'ok' }` for processed or already-processed events
    - Catch unexpected errors: log them, return HTTP 500 `{ error: 'Webhook processing failed' }`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 8.2 Write unit test — Property 7: Webhook signature rejection
    - **Property 7: Webhook signature rejection**
    - **Validates: Requirements 6.2, 6.3**
    - Mock `validateWebhookSignature` to return `false`; call the handler with an arbitrary body; assert HTTP 401 is returned and `prisma` is never called
    - _Requirements: 6.2, 6.3_

  - [ ]* 8.3 Write property test — Property 8: Idempotent webhook processing
    - **Property 8: Idempotent webhook processing**
    - **Validates: Requirements 6.4, 6.5**
    - Use `fast-check`; generate arbitrary `payment_success` webhook payloads whose `orderReference` matches a payment already in `SUCCESS` status (mock `prisma.payment.findFirst` to return a payment with `status: 'SUCCESS'`); assert that `prisma.$transaction` is never called and the handler returns HTTP 200
    - Minimum 100 iterations

- [x] 9. Checkpoint — Ensure all tests pass
  - Run `npm test` and confirm all unit and property tests pass
  - Fix any failures before continuing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update `src/lib/settings.js` — `checkPlatformHealth`
  - In `checkPlatformHealth`, after reading `getPlatformSettings()`, read the value of `ACTIVE_PAYMENT_GATEWAY`
  - If `ACTIVE_PAYMENT_GATEWAY === "nomba"`, add `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, and `NOMBA_ACCOUNT_ID` to the `criticalKeys` array before the missing-key check
  - If the value is `"paystack"` or absent, do not add those keys (preserving backward compatibility)
  - _Requirements: 7.4_

- [x] 11. Update Admin Settings UI — `src/app/(dashboard)/admin/settings/page.js`
  - In the `settingGroups` array, add a new entry: `{ id: 'PAYMENT_GATEWAY', label: 'Payment Gateway', icon: CreditCard }` — `CreditCard` is already imported from `lucide-react`
  - In the `defaultSettings` array, add five new field objects:
    - `{ key: 'ACTIVE_PAYMENT_GATEWAY', group: 'PAYMENT_GATEWAY', label: 'Active Gateway', type: 'text', description: 'paystack or nomba' }`
    - `{ key: 'NOMBA_CLIENT_ID', group: 'PAYMENT_GATEWAY', label: 'Nomba Client ID', type: 'text' }`
    - `{ key: 'NOMBA_CLIENT_SECRET', group: 'PAYMENT_GATEWAY', label: 'Nomba Client Secret', type: 'password' }`
    - `{ key: 'NOMBA_ACCOUNT_ID', group: 'PAYMENT_GATEWAY', label: 'Nomba Account ID', type: 'text' }`
    - `{ key: 'NOMBA_WEBHOOK_SECRET', group: 'PAYMENT_GATEWAY', label: 'Nomba Webhook Secret', type: 'password' }`
  - No changes to the save/load/render logic are needed — the existing generic form handles new groups automatically
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Update `src/app/api/properties/[id]/feature/route.js`
  - Replace `import { initializePayment, generateReference } from '@/lib/paystack'` with `import { initializePayment, generateReference } from '@/lib/paymentGateway'`
  - No other changes — the featured listing flow does not create a `Payment` record, so no column logic changes are needed
  - _Requirements: 3.1, 4.1_

- [x] 13. Final checkpoint — Integration smoke test
  - Run `node scripts/seed-settings.js` and confirm all five new settings are upserted without errors
  - Run `npx prisma migrate deploy` (or confirm the migration from task 2 is applied) and confirm the `payments` table has `nomba_ref` and that `paystack_ref` is now nullable
  - Run `npm test` and confirm all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "3"] },
    { "wave": 2, "tasks": ["4"] },
    { "wave": 3, "tasks": ["5"] },
    { "wave": 4, "tasks": ["6", "7", "8"] },
    { "wave": 5, "tasks": ["9"] },
    { "wave": 6, "tasks": ["10", "11", "12"] },
    { "wave": 7, "tasks": ["13"] }
  ]
}
```

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but are strongly recommended for the payment-critical paths covered here
- Each task references specific requirements for traceability
- Property tests use `fast-check` with minimum 100 iterations each and are tagged with their design property number
- Unit tests cover specific examples and error-handling paths
- The Prisma migration in task 2 must be run before testing the initialize and verify routes end-to-end
- After completing all tasks, configure Nomba credentials via the admin settings page and set `ACTIVE_PAYMENT_GATEWAY` to `nomba` to test the full Nomba flow; set it back to `paystack` to confirm the fallback works
