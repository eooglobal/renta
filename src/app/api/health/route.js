import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkPlatformHealth } from '@/lib/settings';

/**
 * GET /api/health
 * Health check endpoint — verifies DB connection and platform config.
 * Safe to call publicly (returns no sensitive data).
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    node: process.version,
    env: process.env.NODE_ENV,
    database: 'unknown',
    config: 'unknown',
  };

  // Check DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (err) {
    checks.database = 'error';
    checks.status = 'degraded';
    checks.dbError = err.message;
  }

  // Check platform settings
  try {
    const health = await checkPlatformHealth();
    checks.config = health.isHealthy ? 'ok' : 'missing_keys';
    if (!health.isHealthy) {
      checks.missingKeys = health.missingKeys;
      checks.status = 'degraded';
    }
  } catch (err) {
    checks.config = 'error';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
