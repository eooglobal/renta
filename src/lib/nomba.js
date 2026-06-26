/**
 * Nomba Payment Gateway Integration Library
 * Handles OAuth token management, payment initialization, verification, and webhook validation
 */

import crypto from "crypto";
import { getSetting } from "./settings";

const DEFAULT_NOMBA_BASE = "https://api.nomba.com";

async function getNombaBaseUrl() {
  const configuredBaseUrl = await getSetting("NOMBA_BASE_URL");
  const normalizedBaseUrl = (configuredBaseUrl || DEFAULT_NOMBA_BASE).replace(
    /\/+$/,
    "",
  );
  return `${normalizedBaseUrl}/v1`;
}

/**
 * Module-level token cache to avoid redundant OAuth requests
 */
let tokenCache = { accessToken: null, expiresAt: 0 };

/**
 * Fetches a new OAuth token from Nomba, or returns the cached token if still valid.
 * Token is considered valid if it expires more than 60 seconds from now.
 */
export async function getToken() {
  // Return cached token if it's still valid (60-second safety margin)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = await getSetting("NOMBA_CLIENT_ID");
  const clientSecret = await getSetting("NOMBA_CLIENT_SECRET");
  const accountId = await getSetting("NOMBA_ACCOUNT_ID");

  const nombaBase = await getNombaBaseUrl();

  const res = await fetch(`${nombaBase}/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Nomba-Account-Id": accountId,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await res.json();

  if (!res.ok || (data.code !== "00" && data.responseCode !== "00")) {
    throw new Error(
      data.description || data.message || "Failed to obtain Nomba access token",
    );
  }

  const expiresAt = data.data?.expiresAt;
  const expiresIn = data.data?.expiresIn ?? data.data?.expires_in;
  const resolvedExpiresAt = expiresAt
    ? new Date(expiresAt).getTime()
    : Date.now() + Number(expiresIn || 1800) * 1000;

  tokenCache = {
    accessToken: data.data?.access_token || data.data?.accessToken,
    expiresAt: resolvedExpiresAt,
  };

  if (!tokenCache.accessToken) {
    throw new Error(
      "Nomba access token was not returned by the authentication endpoint",
    );
  }

  return tokenCache.accessToken;
}

/**
 * Initialize a Nomba Checkout Order
 * @param {{ email, amount, reference, callbackUrl, metadata }} params
 * @returns {{ checkoutLink: string, orderReference: string }}
 */
export async function initializePayment({
  email,
  amount,
  reference,
  callbackUrl,
  metadata = {},
}) {
  const token = await getToken();
  const accountId = await getSetting("NOMBA_ACCOUNT_ID");

  const nombaBase = await getNombaBaseUrl();

  const res = await fetch(`${nombaBase}/checkout/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Nomba-Account-Id": accountId,
    },
    body: JSON.stringify({
      orderReference: reference,
      customerId: email,
      callbackUrl,
      customerEmail: email,
      currency: "NGN",
      amount: amount.toFixed(2),
      metadata,
    }),
  });

  const data = await res.json();

  if (!res.ok || (data.code !== "00" && data.responseCode !== "00")) {
    throw new Error(
      data.description ||
        data.message ||
        data.error?.message ||
        "Failed to initialize Nomba payment",
    );
  }

  const orderData = data.data?.order || data.data;

  return {
    checkoutLink: orderData?.checkoutLink || orderData?.checkoutUrl,
    orderReference: orderData?.orderReference || reference,
  };
}

/**
 * Verify a Nomba payment by orderReference
 * @param {string} orderReference
 * @returns {{ status: "success"|"failed", transactionId, amount, paidAt }}
 */
export async function verifyPayment(orderReference) {
  const token = await getToken();
  const accountId = await getSetting("NOMBA_ACCOUNT_ID");

  const nombaBase = await getNombaBaseUrl();
  const url = `${nombaBase}/transactions/accounts/single?orderReference=${encodeURIComponent(orderReference)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Nomba-Account-Id": accountId,
    },
  });

  const data = await res.json();

  const status =
    data.code === "00" ||
    data.responseCode === "00" ||
    data.status === "SUCCESS"
      ? "success"
      : "failed";

  return {
    status,
    transactionId: data.transactionId,
    amount: data.amount,
    paidAt: data.time,
  };
}

/**
 * Validate an incoming Nomba webhook signature.
 * Returns false (never throws) if any required field is missing.
 *
 * The string-to-sign format is:
 *   event_type:requestId:merchant.userId:merchant.walletId:transaction.transactionId:transaction.type:transaction.time:transaction.responseCode:nomba-timestamp
 *
 * @param {string} rawBody  The raw request body string
 * @param {Headers|object} headers  Request headers (supports .get() or bracket access)
 * @returns {Promise<boolean>}
 */
export async function validateWebhookSignature(rawBody, headers) {
  try {
    // Chicken-and-egg fix: If the secret isn't configured yet, allow the request.
    // Nomba sends a test ping when adding the URL and expects a 200 OK. It won't give us the secret until the URL is saved.
    const secret = await getSetting("NOMBA_WEBHOOK_SECRET");
    if (!secret) {
      return true;
    }

    // Support both Next.js Headers objects (with .get()) and plain objects
    const getHeader = (name) =>
      typeof headers.get === "function" ? headers.get(name) : headers[name];

    const timestamp = getHeader("nomba-timestamp");
    const signature = getHeader("nomba-signature");

    if (!timestamp || !signature) return false;

    const body = JSON.parse(rawBody);

    const eventType = body.event_type ?? body.event;
    const requestId = body.requestId;
    const merchantUserId = body.merchant?.userId;
    const merchantWalletId = body.merchant?.walletId;
    const transactionId = body.transaction?.transactionId;
    const transactionType = body.transaction?.type;
    const transactionTime = body.transaction?.time;
    const transactionResponseCode = body.transaction?.responseCode;

    // If any required field is missing, reject the signature
    if (
      eventType == null ||
      requestId == null ||
      merchantUserId == null ||
      merchantWalletId == null ||
      transactionId == null ||
      transactionType == null ||
      transactionTime == null ||
      transactionResponseCode == null
    ) {
      return false;
    }

    const stringToSign = [
      eventType,
      requestId,
      merchantUserId,
      merchantWalletId,
      transactionId,
      transactionType,
      transactionTime,
      transactionResponseCode,
      timestamp,
    ].join(":");

    const computed = crypto
      .createHmac("sha256", secret)
      .update(stringToSign)
      .digest("base64");

    return computed === signature;
  } catch {
    // Any parsing error or missing field means invalid signature
    return false;
  }
}

/**
 * Fetch Nigerian bank list from Nomba
 */
export async function getBanks() {
  const token = await getToken();
  const accountId = await getSetting("NOMBA_ACCOUNT_ID");

  const nombaBase = await getNombaBaseUrl();

  const res = await fetch(`${nombaBase}/transfers/banks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Nomba-Account-Id": accountId,
    },
  });

  const data = await res.json();
  if (!res.ok || (data.code !== "00" && data.responseCode !== "00")) {
    throw new Error(
      data.description || data.message || "Failed to fetch Nomba bank list",
    );
  }

  const results = data.data?.results || data.data || [];
  return results.map((b) => ({
    name: b.name,
    code: b.code,
  }));
}

/**
 * Resolve bank account details from Nomba
 */
export async function resolveAccount(accountNumber, bankCode) {
  const token = await getToken();
  const accountId = await getSetting("NOMBA_ACCOUNT_ID");

  const nombaBase = await getNombaBaseUrl();

  const res = await fetch(`${nombaBase}/transfers/bank/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Nomba-Account-Id": accountId,
    },
    body: JSON.stringify({
      accountNumber,
      bankCode,
    }),
  });

  const data = await res.json();
  if (!res.ok || (data.code !== "00" && data.responseCode !== "00")) {
    throw new Error(
      data.description || data.message || "Could not resolve account via Nomba",
    );
  }

  return {
    account_name: data.data.accountName,
    account_number: data.data.accountNumber,
  };
}
