import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const tariffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().nullable(),
  category: z.enum(['standard','weekend','night','event','agreement','custom']).default('standard'),
  tolerance_minutes: z.coerce.number().int().min(0).max(180),
  first_period_minutes: z.coerce.number().int().min(1).max(1440),
  first_hour_price: z.coerce.number().min(0).max(999999),
  fraction_minutes: z.coerce.number().int().min(1).max(1440),
  additional_fraction_price: z.coerce.number().min(0).max(999999),
  daily_max: z.union([z.coerce.number().min(0).max(999999), z.literal(''), z.null()]).optional(),
  is_default: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  valid_weekdays: z.array(z.coerce.number().int().min(0).max(6)).default([0,1,2,3,4,5,6]),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  starts_at_time: z.string().optional().nullable(),
  ends_at_time: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(0).max(999).default(0),
});

async function context() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').single();
  return { supabase, profile };
}

export async function GET(req: NextRequest) {
  const { supabase, profile } = await context();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });
  const activeOnly = req.nextUrl.searchParams.get('active') === 'true';
  let query = supabase.from('tariff_plans').select('*').eq('organization_id', profile.organization_id).order('is_default', { ascending: false }).order('priority', { ascending: false }).order('name');
  if (activeOnly) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tariffs: data || [] });
}

export async function POST(req: NextRequest) {
  const parsed = tariffSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Revise os dados da tarifa.' }, { status: 400 });
  const { supabase, profile } = await context();
  if (!profile) return NextResponse.json({ error: 'Perfil não configurado' }, { status: 403 });
  if (!['owner','manager'].includes(profile.role)) return NextResponse.json({ error: 'Sem permissão para gerenciar tarifas.' }, { status: 403 });
  const { data: auth } = await supabase.auth.getUser();
  const input = parsed.data;
  if (input.is_default) await supabase.from('tariff_plans').update({ is_default: false }).eq('organization_id', profile.organization_id).eq('is_default', true);
  const payload = {
    ...input,
    organization_id: profile.organization_id,
    daily_max: input.daily_max === '' || input.daily_max == null ? null : Number(input.daily_max),
    description: input.description || null,
    valid_from: input.valid_from || null,
    valid_until: input.valid_until || null,
    starts_at_time: input.starts_at_time || null,
    ends_at_time: input.ends_at_time || null,
    additional_hour_price: Number(input.additional_fraction_price) * (60 / Number(input.fraction_minutes)),
  };
  const { data, error } = await supabase.from('tariff_plans').insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('audit_logs').insert({ organization_id: profile.organization_id, actor_user_id: auth.user?.id || null, action: 'tariff.created', entity: 'tariff_plan', entity_id: data.id, metadata: { name: data.name } });
  return NextResponse.json({ tariff: data }, { status: 201 });
}
