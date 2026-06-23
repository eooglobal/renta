# Requirements Document

## Introduction

This feature adds Nomba as a second, switchable payment gateway alongside the existing Paystack integration in the Renta real estate rental application. Administrators can select the active gateway from the Platform Configuration settings page without any code changes. Both gateways must support the full rental payment lifecycle: initialization (creating a hosted checkout), verification (server-side confirmation of a payment), and webhook handling (receiving Nomba event notifications). The Nomba integration follows Nomba's OAuth 2.0 client-credentials token flow, its hosted Checkout Order API, and its HMAC-SHA256 webhook signature scheme.

## Glossary

- **Gateway_Selector**: The platform setting (key: `ACTIVE_PAYMENT_GATEWAY`) stored in `PlatformSetting` that determines which gateway the system uses at runtime. Valid values: `paystack` (default) or `nomba`.
- **Nomba_Client**: The module `src/lib/nomba.js` that encapsulates all calls to the Nomba API.
- **Nomba_Auth_Token**: A short-lived OAuth 2.0 bearer token issued by `POST https://api.nomba.com/v1/auth/token/issue` using `NOMBA_CLIENT_ID` and `NOMBA_CLIENT_SECRET`.
- **Token_Cache**: An in-process cache that stores the current `Nomba_Auth_Token` along with its expiry timestamp to avoid redundant token requests.
- **Checkout_Order**: A Nomba payment session created via `POST https://api.nomba.com/v1/checkout/order`, returning a `checkoutLink` URL and an `orderReference`.
- **Payment_Gateway_Router**: The module `src/lib/paymentGateway.js` that reads `Gateway_Selector` and delegates calls to either `Nomba_Client` or the existing `src/lib/paystack.js`.
- **Nomba_Webhook_Handler**: The API route `src/app/api/webhooks/nomba/route.js` that receives Nomba `payment_success` events, verifies their HMAC-SHA256 signature, and processes them using the same business logic already used by the Paystack webhook handler.
- **orderReference**: The unique identifier sent to Nomba when creating a Checkout_Order; stored in the new `Payment.nombaRef` column.
- **Nomba_Signature_Key**: The secret string configured on the Nomba dashboard and stored as platform setting `NOMBA_WEBHOOK_SECRET`. Used to verify incoming webhook HMAC signatures.

---

## Requirements

### Requirement 1: Gateway Selection Setting

**User Story:** As an Admin, I want to choose between Paystack and Nomba from the Platform Configuration page, so that I can switch payment processors without touching code or redeploying the application.

#### Acceptance Criteria

1. THE `Gateway_Selector` platform setting SHALL exist in the `PlatformSetting` table with key `ACTIVE_PAYMENT_GATEWAY` and a default value of `paystack`.
2. WHEN an Admin saves `ACTIVE_PAYMENT_GATEWAY` with value `nomba` or `paystack` via the settings page, THE Settings_API SHALL persist the new value and clear the platform settings cache.
3. THE Admin settings page SHALL display a gateway selection section (group: `PAYMENT_GATEWAY`) containing the `ACTIVE_PAYMENT_GATEWAY` field, `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, and `NOMBA_WEBHOOK_SECRET` fields.
4. IF `ACTIVE_PAYMENT_GATEWAY` is not set in the database or environment, THEN THE `Payment_Gateway_Router` SHALL default to `paystack` to preserve backward compatibility.

---

### Requirement 2: Nomba API Client

**User Story:** As a developer, I want a dedicated Nomba client library, so that all Nomba API interactions are encapsulated in one place and follow Nomba's authentication requirements.

#### Acceptance Criteria

1. THE `Nomba_Client` SHALL authenticate with the Nomba API by posting `client_credentials` grant to `https://api.nomba.com/v1/auth/token/issue` using `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, and `NOMBA_ACCOUNT_ID` retrieved via the platform settings layer.
2. THE `Token_Cache` SHALL store the returned `access_token` and `expiresAt` value so that the `Nomba_Client` reuses a valid token across multiple requests within the same process.
3. WHEN the cached `Nomba_Auth_Token` has expired or is absent, THE `Nomba_Client` SHALL fetch a new token before executing any API call.
4. THE `Nomba_Client` SHALL expose an `initializePayment({ email, amount, reference, callbackUrl, metadata })` function that creates a `Checkout_Order` at `POST https://api.nomba.com/v1/checkout/order` and returns `{ checkoutLink, orderReference }`.
5. WHEN creating a `Checkout_Order`, THE `Nomba_Client` SHALL send `amount` as a string with two decimal places using `(amount).toFixed(2)` denominated in Naira (e.g., `"10000.00"`), include `orderReference`, `customerEmail`, `callbackUrl`, and `currency: "NGN"` in the request body.
6. THE `Nomba_Client` SHALL expose a `verifyPayment(orderReference)` function that calls `GET https://api.nomba.com/v1/transactions/accounts/single?orderReference={ref}` and returns `{ status, transactionId, amount, paidAt }`.
7. WHEN a Nomba API call returns a non-`"00"` response code, THE `Nomba_Client` SHALL throw an `Error` with the API's `description` field as the message.
8. THE `Nomba_Client` SHALL expose a `validateWebhookSignature(rawBody, headers)` function that verifies the `nomba-signature` header using HMAC-SHA256 over a concatenated string of `event_type:requestId:merchant.userId:merchant.walletId:transaction.transactionId:transaction.type:transaction.time:transaction.responseCode:nomba-timestamp` and the `NOMBA_WEBHOOK_SECRET`, encoded as Base64.

---

### Requirement 3: Payment Gateway Router

**User Story:** As a developer, I want a single gateway-agnostic interface for payment operations, so that the payment initialization and verification routes do not need to know which gateway is active.

#### Acceptance Criteria

1. THE `Payment_Gateway_Router` SHALL expose `initializePayment(params)`, `verifyPayment(reference)`, and `generateReference(prefix)` functions that delegate to the gateway specified by `Gateway_Selector` at call time.
2. WHEN `Gateway_Selector` is `nomba`, THE `Payment_Gateway_Router` SHALL delegate `initializePayment` to `Nomba_Client.initializePayment` and return `{ authorization_url: checkoutLink, reference: orderReference }` in the same shape as the Paystack response, to avoid changes in calling code.
3. WHEN `Gateway_Selector` is `nomba`, THE `Payment_Gateway_Router` SHALL delegate `verifyPayment` to `Nomba_Client.verifyPayment` and return `{ status: "success" | "failed", paid_at }` in the same shape as the Paystack verification response.
4. WHEN `Gateway_Selector` is `paystack` or any value other than `nomba`, THE `Payment_Gateway_Router` SHALL delegate all calls to the existing `src/lib/paystack.js` functions unchanged. THE `Payment_Gateway_Router` SHALL NOT invoke any `Nomba_Client` function when `Gateway_Selector` is not `nomba`.
5. THE `Payment_Gateway_Router` SHALL read `Gateway_Selector` on every call (not at module load) so that a settings change takes effect without a server restart.

---

### Requirement 4: Payment Initialization Route Update

**User Story:** As a Tenant, I want to pay rent using whichever payment gateway the platform has configured, so that the payment experience works regardless of which processor the Admin has selected.

#### Acceptance Criteria

1. WHEN a Tenant calls `POST /api/payments/initialize`, THE Initialize_Route SHALL call `Payment_Gateway_Router.initializePayment` instead of calling `src/lib/paystack.js` directly.
2. WHEN `Gateway_Selector` is `paystack`, THE Initialize_Route SHALL store the gateway reference in `Payment.paystackRef`. WHEN `Gateway_Selector` is `nomba`, THE Initialize_Route SHALL store the gateway reference in `Payment.nombaRef`. Both columns SHALL be nullable in the database schema.
3. WHEN `Gateway_Selector` is `nomba`, THE Initialize_Route SHALL construct a `callbackUrl` pointing to `/tenant/payments/verify?reference={orderReference}` using the same pattern as the Paystack flow.
4. THE Initialize_Route SHALL return the same JSON response shape (`{ paymentUrl, reference, rental }`) regardless of which gateway is active.

---

### Requirement 5: Payment Verification Route Update

**User Story:** As a Tenant, I want my rent payment confirmed server-side after returning from the payment page, so that my rental status is updated correctly regardless of which gateway was used.

#### Acceptance Criteria

1. WHEN a Tenant calls `GET /api/payments/verify?reference={ref}`, THE Verify_Route SHALL call `Payment_Gateway_Router.verifyPayment(reference)` instead of calling `src/lib/paystack.js` directly.
2. THE Verify_Route SHALL look up the `Payment` record by searching both `paystackRef` and `nombaRef` columns, matching whichever contains the provided reference value.
3. WHEN `Payment_Gateway_Router.verifyPayment` returns `status: "success"`, THE Verify_Route SHALL execute the existing atomic transaction to update the `Payment`, `Rental`, `Property`, and `Escrow` records unchanged. IF `Payment_Gateway_Router.verifyPayment` returns `status: "failed"`, THEN THE Verify_Route SHALL update only the `Payment` record to `FAILED` status and SHALL NOT modify the `Rental`, `Property`, or `Escrow` records.
4. IF `Payment_Gateway_Router.verifyPayment` throws an error, THEN THE Verify_Route SHALL return HTTP 500 with `{ error: "Failed to verify payment" }`.

---

### Requirement 6: Nomba Webhook Handler

**User Story:** As the platform, I want to receive Nomba payment event notifications, so that rental payments are confirmed automatically even if a tenant closes the browser before the callback redirect.

#### Acceptance Criteria

1. THE `Nomba_Webhook_Handler` SHALL accept `POST` requests at `/api/webhooks/nomba`.
2. WHEN a request arrives at `/api/webhooks/nomba`, THE `Nomba_Webhook_Handler` SHALL read the raw request body and call `Nomba_Client.validateWebhookSignature` before processing any payload.
3. IF `Nomba_Client.validateWebhookSignature` returns `false`, THEN THE `Nomba_Webhook_Handler` SHALL return HTTP 401 with `{ error: "Invalid signature" }` and SHALL NOT process the event.
4. WHEN a `payment_success` event is received and `data.order.orderReference` matches a `Payment.nombaRef` with status not equal to `SUCCESS`, THE `Nomba_Webhook_Handler` SHALL execute the same atomic database transaction used in the Paystack webhook handler to mark the payment as `SUCCESS`, set the rental to `ACTIVE`, mark the property as `RENTED`, and set the escrow status to `HELD`. THE `Nomba_Webhook_Handler` SHALL also handle `FEATURE_LISTING` metadata payments in the same manner as the Paystack webhook handler, activating the featured listing when such a payment_success event is received.
5. THE `Nomba_Webhook_Handler` SHALL return HTTP 200 with `{ status: "ok" }` for all successfully processed or already-processed events.
6. IF an unexpected error occurs during webhook processing, THEN THE `Nomba_Webhook_Handler` SHALL return HTTP 500 with `{ error: "Webhook processing failed" }` and SHALL log the error.

---

### Requirement 7: Admin Settings UI for Nomba

**User Story:** As an Admin, I want to enter and save Nomba API credentials from the Platform Configuration page, so that I can configure Nomba without editing environment variables or redeploying.

#### Acceptance Criteria

1. THE Admin settings page SHALL include a `PAYMENT_GATEWAY` settings group visible in the sidebar alongside the existing groups.
2. THE `PAYMENT_GATEWAY` group SHALL contain the following configurable fields: `ACTIVE_PAYMENT_GATEWAY` (text), `NOMBA_CLIENT_ID` (text), `NOMBA_CLIENT_SECRET` (password), `NOMBA_ACCOUNT_ID` (text), and `NOMBA_WEBHOOK_SECRET` (password).
3. WHEN an Admin saves a credential field in the `PAYMENT_GATEWAY` group, THE settings page SHALL call `POST /api/admin/settings` and display a save confirmation using the existing save flow.
4. WHEN `ACTIVE_PAYMENT_GATEWAY` is set to `nomba`, THE `checkPlatformHealth` function in `src/lib/settings.js` SHALL include `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, and `NOMBA_ACCOUNT_ID` as critical keys. WHILE `ACTIVE_PAYMENT_GATEWAY` is set to `paystack` or is unset, THE `checkPlatformHealth` function SHALL NOT require Nomba credentials.

---

### Requirement 8: Database Migration for nombaRef Column

**User Story:** As a developer, I want a dedicated `nombaRef` column on the `Payment` table, so that Nomba payment references are stored separately from Paystack references and historical records clearly show which gateway processed each payment.

#### Acceptance Criteria

1. A Prisma migration SHALL add a nullable, unique `nombaRef` column (`String?`) to the `Payment` model mapped to column `nomba_ref`.
2. THE `paystackRef` column SHALL remain unchanged to preserve all existing Paystack payment records.
3. WHEN a payment is processed via Nomba, THE `nombaRef` column SHALL be populated and `paystackRef` SHALL remain `null`. WHEN a payment is processed via Paystack, THE `paystackRef` column SHALL be populated and `nombaRef` SHALL remain `null`.

---

### Requirement 9: Database Seed for New Settings

**User Story:** As a developer setting up the platform, I want the Nomba-related settings to be pre-seeded in the database, so that the admin page shows all fields immediately without manual SQL.

#### Acceptance Criteria

1. THE seed script `scripts/seed-settings.js` SHALL insert or upsert the following `PlatformSetting` rows: `ACTIVE_PAYMENT_GATEWAY` (group: `PAYMENT_GATEWAY`, default: `paystack`), `NOMBA_CLIENT_ID` (group: `PAYMENT_GATEWAY`), `NOMBA_CLIENT_SECRET` (group: `PAYMENT_GATEWAY`), `NOMBA_ACCOUNT_ID` (group: `PAYMENT_GATEWAY`), and `NOMBA_WEBHOOK_SECRET` (group: `PAYMENT_GATEWAY`).
2. IF any of these rows already exist, THEN THE seed script SHALL leave their current `value` unchanged and only upsert the metadata fields (`label`, `group`, `description`, `type`).
