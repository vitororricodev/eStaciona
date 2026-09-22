import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/rateLimit';
import { APP_VERSION } from '@/lib/version';

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit(request, { route: 'health', limit: 60, windowSeconds: 60 });
    if (limited) return limited;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Health check temporariamente indisponível' },
      { status: 503 },
    );
  }
  const missing = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: 'Variáveis obrigatórias ausentes', missing },
      { status: 503 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);
    if (error) return NextResponse.json({ ok: false, error: 'Banco indisponível' }, { status: 503 });
    return NextResponse.json({ ok: true, service: 'eStaciona', version: APP_VERSION });
  } catch {
    return NextResponse.json({ ok: false, error: 'Falha ao conectar ao banco' }, { status: 503 });
  }
}
