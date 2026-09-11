import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const missing = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    return NextResponse.json({ ok: false, error: 'Variáveis obrigatórias ausentes', missing }, { status: 503 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);
    if (error) return NextResponse.json({ ok: false, error: 'Banco indisponível' }, { status: 503 });
    return NextResponse.json({ ok: true, service: 'eStaciona', version: '1.0.4' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Falha ao conectar ao banco' }, { status: 503 });
  }
}
