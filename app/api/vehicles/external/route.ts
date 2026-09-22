import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { isValidBrazilianPlate, normalizePlate } from '@/lib/plate';

export async function GET(request: NextRequest) {
  const plate = normalizePlate(String(request.nextUrl.searchParams.get('plate') || ''));
  if (!isValidBrazilianPlate(plate)) return NextResponse.json({ found: false });
  const { profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

  const base = process.env.PLATE_API_URL;
  const token = process.env.PLATE_API_TOKEN;
  if (!base) return NextResponse.json({ configured: false, found: false });

  const url = new URL(base);
  url.searchParams.set('plate', plate);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, { headers, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      return NextResponse.json({ configured: true, found: false, error: 'Consulta externa indisponível' });
    const make = data.make ?? data.marca ?? data.brand ?? null;
    const model = data.model ?? data.modelo ?? null;
    const color = data.color ?? data.cor ?? null;
    const year = data.year ?? data.ano ?? null;
    return NextResponse.json({
      configured: true,
      found: Boolean(make || model || color),
      vehicle: { make, model, color, year },
    });
  } catch {
    return NextResponse.json({
      configured: true,
      found: false,
      error: 'Falha ao consultar provedor de placa',
    });
  }
}
