import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(240).nullable().optional(),
  category: z.enum(['standard','weekend','night','event','agreement','custom']).optional(),
  tolerance_minutes: z.coerce.number().int().min(0).max(180).optional(),
  first_period_minutes: z.coerce.number().int().min(1).max(1440).optional(),
  first_hour_price: z.coerce.number().min(0).max(999999).optional(),
  fraction_minutes: z.coerce.number().int().min(1).max(1440).optional(),
  additional_fraction_price: z.coerce.number().min(0).max(999999).optional(),
  daily_max: z.union([z.coerce.number().min(0).max(999999), z.literal(''), z.null()]).optional(),
  is_default: z.boolean().optional(), active: z.boolean().optional(),
  valid_weekdays: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  valid_from: z.string().nullable().optional(), valid_until: z.string().nullable().optional(),
  starts_at_time: z.string().nullable().optional(), ends_at_time: z.string().nullable().optional(),
  priority: z.coerce.number().int().min(0).max(999).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').single();
  if (!profile || !['owner','manager'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { data: auth } = await supabase.auth.getUser();
  const input: any = { ...parsed.data, updated_at: new Date().toISOString() };
  if (input.daily_max === '') input.daily_max = null;
  if (input.is_default === true) await supabase.from('tariff_plans').update({ is_default: false }).eq('organization_id', profile.organization_id).eq('is_default', true).neq('id', id);
  if (input.additional_fraction_price != null && input.fraction_minutes != null) input.additional_hour_price = Number(input.additional_fraction_price) * (60 / Number(input.fraction_minutes));
  const { data, error } = await supabase.from('tariff_plans').update(input).eq('id', id).eq('organization_id', profile.organization_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('audit_logs').insert({ organization_id: profile.organization_id, actor_user_id: auth.user?.id || null, action: 'tariff.updated', entity: 'tariff_plan', entity_id: id, metadata: { fields: Object.keys(parsed.data) } });
  return NextResponse.json({ tariff: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').single();
  if (!profile || !['owner','manager'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const { data: tariff } = await supabase.from('tariff_plans').select('is_default').eq('id', id).eq('organization_id', profile.organization_id).single();
  if (!tariff) return NextResponse.json({ error: 'Tarifa não encontrada.' }, { status: 404 });
  if (tariff.is_default) return NextResponse.json({ error: 'A tarifa padrão não pode ser desativada.' }, { status: 409 });
  const { error } = await supabase.from('tariff_plans').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id).eq('organization_id', profile.organization_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
