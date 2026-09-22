import { NextRequest, NextResponse } from 'next/server';
import { getContext } from '@/lib/authz';
import { sendWhatsAppTemplate, whatsappFallbackUrl } from '@/lib/integrations';
import { z } from 'zod';
const schema = z.object({ stayId: z.string().uuid() });
export async function POST(req: NextRequest) {
  const p = schema.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const { supabase, profile } = await getContext();
  if (!profile) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });
  const { data: stay } = await supabase
    .from('stays')
    .select('public_token,started_at,vehicles(plate,customers(name,phone))')
    .eq('id', p.data.stayId)
    .eq('organization_id', profile.organization_id)
    .single();
  if (!stay) return NextResponse.json({ error: 'Permanência não encontrada' }, { status: 404 });
  const v: any = Array.isArray(stay.vehicles) ? stay.vehicles[0] : stay.vehicles;
  const c: any = Array.isArray(v?.customers) ? v.customers[0] : v?.customers;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const url = `${base}/cliente/${stay.public_token}`;
  const message = `Seu veículo ${v?.plate} foi registrado no eStaciona. Acompanhe tempo e valor: ${url}`;
  const fallbackUrl = whatsappFallbackUrl(c?.phone || '', message);
  const template = process.env.WHATSAPP_ENTRY_TEMPLATE;
  if (!template) return NextResponse.json({ sent: false, configured: false, fallbackUrl });
  const sent = await sendWhatsAppTemplate({
    phone: c?.phone || '',
    template,
    bodyParameters: [c?.name || 'Cliente', v?.plate || '', url],
  });
  return NextResponse.json({
    sent: Boolean(sent.configured && sent.ok),
    configured: sent.configured,
    fallbackUrl,
    providerResponse: sent.configured ? sent.data : undefined,
  });
}
