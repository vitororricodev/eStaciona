import { NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  const { user } = await getContext();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ must_change_password: false }).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
