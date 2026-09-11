import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function digits(value: unknown) {
  return String(value || '').replace(/\D/g, '');
}

function samePhone(stored: string, informed: string) {
  const a = digits(stored);
  const b = digits(informed);
  if (b.length < 8) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plate = String(body.plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const phone = digits(body.phone);

  if (plate.length < 6 || phone.length < 8) {
    return NextResponse.json({ error: 'Informe a placa e o WhatsApp cadastrado.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stays')
    .select('public_token,vehicles!inner(plate,customers!inner(phone))')
    .eq('status', 'open')
    .eq('vehicles.plate', plate)
    .limit(20);

  if (error) return NextResponse.json({ error: 'Não foi possível consultar.' }, { status: 500 });

  const matches = (data || []).filter((stay: any) => {
    const vehicle = Array.isArray(stay.vehicles) ? stay.vehicles[0] : stay.vehicles;
    const customer = Array.isArray(vehicle?.customers) ? vehicle.customers[0] : vehicle?.customers;
    return samePhone(customer?.phone || '', phone);
  });

  if (matches.length !== 1) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, token: matches[0].public_token });
}
