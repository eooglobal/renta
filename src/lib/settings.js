import { prisma } from './db';

let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Canonical list of all known setting keys and their env var equivalents.
// DB takes priority; env is the fallback. Both are always checked.
const ENV_ALIASES = {
    // Paystack
    PAYSTACK_SECRET_KEY: 'PAYSTACK_SECRET_KEY',
    NEXT_PUBLIC_PAYSTACK_KEY: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    PAYSTACK_PUBLIC_KEY: 'PAYSTACK_PUBLIC_KEY',
    // Nomba
    NOMBA_CLIENT_ID: 'NOMBA_CLIENT_ID',
    NOMBA_CLIENT_SECRET: 'NOMBA_CLIENT_SECRET',
    NOMBA_ACCOUNT_ID: 'NOMBA_ACCOUNT_ID',
    NOMBA_BASE_URL: 'NOMBA_BASE_URL',
    NOMBA_WEBHOOK_SECRET: 'NOMBA_WEBHOOK_SECRET',
    // Pusher
    NEXT_PUBLIC_PUSHER_KEY: 'NEXT_PUBLIC_PUSHER_KEY',
    NEXT_PUBLIC_PUSHER_CLUSTER: 'NEXT_PUBLIC_PUSHER_CLUSTER',
    PUSHER_APP_ID: 'PUSHER_APP_ID',
    PUSHER_SECRET: 'PUSHER_SECRET',
    // Didit / KYC
    DIDIT_API_KEY: 'DIDIT_API_KEY',
    DIDIT_WORKFLOW_ID: 'DIDIT_WORKFLOW_ID',
    DIDIT_WEBHOOK_SECRET: 'DIDIT_WEBHOOK_SECRET',
    DIDIT_CLIENT_ID: 'DIDIT_CLIENT_ID',
    DIDIT_CLIENT_SECRET: 'DIDIT_CLIENT_SECRET',
    DIDIT_REDIRECT_URL: 'DIDIT_REDIRECT_URL',
    REQUIRE_KYC: 'REQUIRE_KYC',
    // Google Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    // Storage / R2
    R2_ACCOUNT_ID: 'R2_ACCOUNT_ID',
    R2_ACCESS_KEY_ID: 'R2_ACCESS_KEY_ID',
    R2_SECRET_ACCESS_KEY: 'R2_SECRET_ACCESS_KEY',
    R2_BUCKET_NAME: 'R2_BUCKET_NAME',
    R2_PUBLIC_URL: 'R2_PUBLIC_URL',
    // Email
    EMAIL_PROVIDER: 'EMAIL_PROVIDER',
    ZEPTOMAIL_SEND_TOKEN: 'ZEPTOMAIL_SEND_TOKEN',
    ZEPTOMAIL_API_TOKEN: 'ZEPTOMAIL_SEND_TOKEN',
    ZEPTOMAIL_API_URL: 'ZEPTOMAIL_API_URL',
    EMAIL_FROM_NAME: 'EMAIL_FROM_NAME',
    EMAIL_SERVER_HOST: 'SMTP_HOST',
    EMAIL_SERVER_PORT: 'SMTP_PORT',
    EMAIL_SERVER_USER: 'SMTP_USER',
    EMAIL_SERVER_PASSWORD: 'SMTP_PASS',
    EMAIL_FROM: 'EMAIL_FROM',
    SMTP_HOST: 'SMTP_HOST',
    SMTP_PORT: 'SMTP_PORT',
    SMTP_USER: 'SMTP_USER',
    SMTP_PASS: 'SMTP_PASS',
    // SMS / Termii
    SMS_ENABLED: 'SMS_ENABLED',
    TERMII_API_KEY: 'TERMII_API_KEY',
    TERMII_SENDER_ID: 'TERMII_SENDER_ID',
    TERMII_BASE_URL: 'TERMII_BASE_URL',
    TERMII_CHANNEL: 'TERMII_CHANNEL',
    SMS_WELCOME_ENABLED: 'SMS_WELCOME_ENABLED',
    SMS_PROPERTY_VERIFIED_ENABLED: 'SMS_PROPERTY_VERIFIED_ENABLED',
    SMS_RENTAL_PAID_ENABLED: 'SMS_RENTAL_PAID_ENABLED',
    SMS_PROPERTY_REJECTED_ENABLED: 'SMS_PROPERTY_REJECTED_ENABLED',
    // AI
    GROQ_API_KEY: 'GROQ_API_KEY',
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    GEMINI_API_KEY: 'GEMINI_API_KEY',
    AI_MODEL: 'AI_MODEL',
};

// Placeholder patterns — these values are intentionally blank/unset
const PLACEHOLDER_PATTERNS = [/^sk_test_xxxxx/, /^pk_test_xxxxx/, /YOUR_/i, /REPLACE_/i];
const isPlaceholder = (v) => !v || PLACEHOLDER_PATTERNS.some((p) => p.test(v.trim()));

/**
 * Reads a single env var, stripping surrounding quotes that some .env parsers leave in.
 * Returns null for placeholder/empty values.
 */
function readEnv(envKey) {
    if (!envKey) return null;
    const raw = process.env[envKey];
    if (!raw) return null;
    // Strip surrounding double-quotes left by some dotenv parsers
    const stripped = raw.replace(/^"|"$/g, '').trim();
    if (isPlaceholder(stripped)) return null;
    return stripped || null;
}

/**
 * Fetches all platform settings from the database and caches them.
 * Returns only the DB rows — use getSetting() for merged resolution.
 */
export async function getPlatformSettings() {
    const now = Date.now();
    if (settingsCache && (now - cacheTimestamp < CACHE_TTL)) {
        return settingsCache;
    }

    try {
        const rows = await prisma.platformSetting.findMany();
        const map = rows.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
        settingsCache = map;
        cacheTimestamp = now;
        return map;
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        return {};
    }
}

/**
 * Gets a specific setting value.
 * Priority: DB value > environment variable
 * Both sources are always checked; DB always wins when set.
 *
 * @param {string} key   - The setting key (e.g. "PAYSTACK_SECRET_KEY")
 * @param {string} [envFallback] - Override the env var name to use as fallback
 * @returns {Promise<string|null>}
 */
export async function getSetting(key, envFallback = null) {
    const settings = await getPlatformSettings();
    const dbValue = settings[key];
    if (dbValue && !isPlaceholder(dbValue)) return dbValue;

    // Fall back to env var — use provided envFallback, then the alias map, then the key itself
    const envKey = envFallback || ENV_ALIASES[key] || key;
    return readEnv(envKey);
}

/**
 * Returns the merged effective settings for all known keys.
 * For each key: { value, source: 'db' | 'env' | null }
 * Used by the admin settings API to show what's actually in effect.
 */
export async function getMergedSettings() {
    const dbSettings = await getPlatformSettings();
    const merged = {};

    // Start with all DB rows
    for (const [key, value] of Object.entries(dbSettings)) {
        if (value && !isPlaceholder(value)) {
            merged[key] = { value, source: 'db' };
        }
    }

    // Fill in env vars for any known key not already set by DB
    for (const [key, envKey] of Object.entries(ENV_ALIASES)) {
        if (!merged[key]) {
            const envValue = readEnv(envKey);
            if (envValue) {
                merged[key] = { value: envValue, source: 'env' };
            }
        }
    }

    return merged;
}

/**
 * Forces a cache refresh (call after any setting is saved)
 */
export function clearSettingsCache() {
    settingsCache = null;
    cacheTimestamp = 0;
}

/**
 * Checks for the presence of critical configuration keys across DB + env.
 */
export async function checkPlatformHealth() {
    const criticalKeys = [
        'PAYSTACK_SECRET_KEY',
        'NEXT_PUBLIC_PUSHER_KEY',
        'PUSHER_SECRET',
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    ];

    const dbSettings = await getPlatformSettings();
    const activeGateway = dbSettings['ACTIVE_PAYMENT_GATEWAY'] || readEnv('ACTIVE_PAYMENT_GATEWAY') || 'paystack';
    if (activeGateway === 'nomba') {
        criticalKeys.push('NOMBA_CLIENT_ID', 'NOMBA_CLIENT_SECRET', 'NOMBA_ACCOUNT_ID');
    } else {
        criticalKeys.push('PAYSTACK_SECRET_KEY');
    }

    const requireKyc = await getSetting('REQUIRE_KYC');
    if (requireKyc !== 'false') {
        criticalKeys.push('DIDIT_API_KEY', 'DIDIT_WORKFLOW_ID');
    }

    const missing = [];
    for (const key of criticalKeys) {
        const effective = await getSetting(key);
        if (!effective) {
            missing.push(key);
        }
    }

    return {
        isHealthy: missing.length === 0,
        missingKeys: missing,
        timestamp: new Date().toISOString(),
    };
}
