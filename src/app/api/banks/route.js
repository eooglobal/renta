import { NextResponse } from "next/server";
import { getBanks } from "@/lib/paymentGateway";
import { getSetting } from "@/lib/settings";

// Module-level cache
let banksCache = null;
let banksCacheTime = 0;
let cachedGateway = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Paystack placeholder keys that indicate the key hasn't been configured yet
const PLACEHOLDER_PATTERNS = [/^sk_test_xxxxx/, /^pk_test_xxxxx/, /YOUR_/, /REPLACE_/, /^$/, /^".*"$/];
const isPlaceholder = (v) => !v || PLACEHOLDER_PATTERNS.some((p) => p.test(v.trim()));

// GET /api/banks — Fetch Nigerian bank list from Active Gateway
export async function GET() {
  try {
    // Check if Paystack key is properly configured before hitting the API
    const secret = await getSetting("PAYSTACK_SECRET_KEY");
    if (isPlaceholder(secret)) {
      console.warn("[Banks API] PAYSTACK_SECRET_KEY is a placeholder. Returning empty bank list.");
      return NextResponse.json([], { headers: { "X-Banks-Warning": "paystack-not-configured" } });
    }

    const now = Date.now();
    const { getActiveGateway } = await import("@/lib/paymentGateway");
    const activeGateway = await getActiveGateway();

    if (
      banksCache &&
      cachedGateway === activeGateway &&
      now - banksCacheTime < CACHE_TTL
    ) {
      return NextResponse.json(banksCache);
    }

    const banks = await getBanks();

    banksCache = banks;
    banksCacheTime = now;
    cachedGateway = activeGateway;

    return NextResponse.json(banks);
  } catch (error) {
    console.error("[Banks API] Error:", error);
    // Return empty list instead of 500 so the UI doesn't break
    return NextResponse.json(
      [],
      {
        status: 200,
        headers: { "X-Banks-Error": error.message || "Failed to fetch banks" },
      }
    );
  }
}
