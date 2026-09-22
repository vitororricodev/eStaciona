import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RateLimitPolicy = { route: string; limit: number; windowSeconds: number };
type RateLimitResult = { allowed: boolean; retry_after: number; remaining: number };

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
  return isIP(candidate) ? candidate : 'unknown';
}

function secret() {
  const value = process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error('rate_limit_not_configured');
  return value;
}

function anonymousKey(request: Request, route: string, discriminator = '') {
  return createHmac('sha256', secret())
    .update(`${route}|${clientIp(request)}|${discriminator}`)
    .digest('hex');
}

export async function enforceRateLimit(request: Request, policy: RateLimitPolicy, discriminator = '') {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_rate_limit', {
    p_route: policy.route,
    p_key_hash: anonymousKey(request, policy.route, discriminator),
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  });

  if (error) throw new Error('rate_limit_unavailable');
  const result = data as RateLimitResult;
  if (result.allowed) return null;

  return NextResponse.json(
    { error: 'Muitas tentativas. Tente novamente mais tarde.', code: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, result.retry_after)) } },
  );
}
