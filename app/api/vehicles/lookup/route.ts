import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { isValidBrazilianPlate, normalizePlate } from '@/lib/plate';

export async function GET(req: NextRequest) {
  const plate = normalizePlate(req.nextUrl.searchParams.get('plate') || '');
  if (!isValidBrazilianPlate(plate)) {
    return NextResponse.json({ error: 'Placa inválida. Use o padrão ABC1234 ou ABC1D23.' }, { status: 400 });
  }

  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, plate, make, model, color, customers(id, name, phone), stays!left(id, status, started_at)')
    .eq('organization_id', profile.organization_id)
    .eq('plate', plate)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Não foi possível consultar o veículo.' }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });

  const stays = Array.isArray(data.stays) ? data.stays : [];
  const openStay = stays.find((stay: any) => stay.status === 'open');
  return NextResponse.json({
    found: true,
    vehicle: data,
    hasOpenStay: Boolean(openStay),
    openStay: openStay || null,
  });
}
