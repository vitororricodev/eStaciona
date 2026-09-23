'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MasterNav } from '@/components/MasterNav';
import { BadgeDollarSign, CalendarDays, Plus } from 'lucide-react';

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_cents: number;
  active: boolean;
};

export default function MasterPlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/platform/plans', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setPlans(data.plans || []);
  }, []);

  useEffect(() => {
    void load().catch((reason) => setMessage(reason.message || 'Não foi possível carregar os planos.'));
  }, [load]);

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/platform/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.get('code'),
        name: form.get('name'),
        description: form.get('description'),
        durationDays: form.get('durationDays'),
        priceCents: Math.round(Number(form.get('price')) * 100),
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? 'Plano criado com sucesso.' : data.error);
    if (response.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function updatePlan(plan: Plan, input: Partial<Plan>) {
    const response = await fetch(`/api/platform/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.duration_days !== undefined ? { durationDays: input.duration_days } : {}),
        ...(input.price_cents !== undefined ? { priceCents: input.price_cents } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      }),
    });
    const data = await response.json();
    setMessage(response.ok ? 'Plano atualizado.' : data.error);
    if (response.ok) await load();
  }

  return (
    <AppShell title="Planos SaaS">
      <MasterNav />
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Catálogo comercial</p>
        <h1 className="mt-1 text-3xl font-black">Planos</h1>
        <p className="mt-2 text-slate-500">
          Valores e validades usados nas próximas liberações e renovações.
        </p>
      </div>

      <form
        onSubmit={createPlan}
        className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900 md:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 text-lg font-black md:col-span-2">
          <Plus size={20} /> Criar plano
        </h2>
        <input
          name="code"
          required
          pattern="[a-z0-9_-]+"
          placeholder="Código: promocional"
          className="master-input"
        />
        <input name="name" required placeholder="Nome do plano" className="master-input" />
        <input
          name="durationDays"
          required
          type="number"
          min="1"
          placeholder="Validade em dias"
          className="master-input"
        />
        <input
          name="price"
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Preço em reais"
          className="master-input"
        />
        <input name="description" placeholder="Descrição" className="master-input md:col-span-2" />
        <button className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white md:col-span-2">
          Criar plano
        </button>
      </form>

      {message && (
        <p role="status" className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm text-brand-800">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onUpdate={updatePlan} />
        ))}
      </div>
    </AppShell>
  );
}

function PlanCard({
  plan,
  onUpdate,
}: {
  plan: Plan;
  onUpdate: (plan: Plan, input: Partial<Plan>) => Promise<void>;
}) {
  const [name, setName] = useState(plan.name);
  const [days, setDays] = useState(plan.duration_days);
  const [price, setPrice] = useState(plan.price_cents / 100);

  useEffect(() => {
    setName(plan.name);
    setDays(plan.duration_days);
    setPrice(plan.price_cents / 100);
  }, [plan]);

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-slate-800">
          <BadgeDollarSign />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {plan.active ? 'ATIVO' : 'INATIVO'}
        </span>
      </div>
      <p className="mt-4 text-xs font-bold uppercase text-slate-400">{plan.code}</p>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="master-input mt-2 w-full"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-slate-500">
          Dias
          <input
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            type="number"
            min="1"
            className="master-input mt-1 w-full"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Valor
          <input
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            type="number"
            min="0"
            step="0.01"
            className="master-input mt-1 w-full"
          />
        </label>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <CalendarDays size={16} /> {plan.duration_days} dias •{' '}
        {(plan.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() =>
            void onUpdate(plan, {
              name,
              duration_days: days,
              price_cents: Math.round(price * 100),
            })
          }
          className="master-action flex-1 bg-brand-600 text-white"
        >
          Salvar
        </button>
        <button
          onClick={() => void onUpdate(plan, { active: !plan.active })}
          className="master-action border border-slate-300"
        >
          {plan.active ? 'Desativar' : 'Ativar'}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Alterações não modificam snapshots de licenças já concedidas.
      </p>
    </article>
  );
}
