import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const plate = (req.nextUrl.searchParams.get('plate') || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (plate.length < 6) return NextResponse.json({ found: false });

  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('organization_id').single();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, plate, make, model, color, customers(id, name, phone), stays!left(id, status, started_at)')
    .eq('organization_id', profile.organization_id)
    .eq('plate', plate)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });

  const stays = Array.isArray(data.stays) ? data.stays : [];
  const openStay = stays.find((s: any) => s.status === 'open');
  return NextResponse.json({ found: true, vehicle: data, hasOpenStay: Boolean(openStay), openStay: openStay || null });
}
