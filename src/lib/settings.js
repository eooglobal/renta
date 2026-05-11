import { prisma } from './db';

let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetches all platform settings from the database and caches them
 */
export async function getPlatformSettings() {
    const now = Date.now();
    if (settingsCache && (now - cacheTimestamp < CACHE_TTL)) {
        return settingsCache;
    }

    try {
        const settings = await prisma.platformSetting.findMany();
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        settingsCache = settingsMap;
        cacheTimestamp = now;
        return settingsMap;
    } catch (error) {
        console.error('Error fetching platform settings:', error);
        return {};
    }
}

/**
 * Gets a specific setting value, falling back to an environment variable
 */
export async function getSetting(key, envFallback = null) {
    const settings = await getPlatformSettings();
    return settings[key] || process.env[envFallback || key];
}

/**
 * Forces a cache refresh
 */
export function clearSettingsCache() {
    settingsCache = null;
    cacheTimestamp = 0;
}

/**
 * Checks for the presence of critical configuration keys
 * Returns a list of missing keys
 */
export async function checkPlatformHealth() {
    const criticalKeys = [
        'PAYSTACK_SECRET_KEY',
        'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
        'SMILE_ID_API_KEY',
        'SMILE_ID_PARTNER_ID',
        'NEXT_PUBLIC_PUSHER_KEY',
        'PUSHER_SECRET',
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
        'SMTP_HOST',
        'SMTP_PASS'
    ];

    const settings = await getPlatformSettings();
    const missing = [];

    for (const key of criticalKeys) {
        const val = settings[key] || process.env[key];
        if (!val || val.includes('YOUR_') || val.includes('REPLACE_')) {
            missing.push(key);
        }
    }

    return {
        isHealthy: missing.length === 0,
        missingKeys: missing,
        timestamp: new Date().toISOString()
    };
}
