'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MasterNav } from '@/components/MasterNav';
import { Ban, Building2, CheckCircle2, Clock3, Plus, RefreshCw, Search } from 'lucide-react';

type Plan = {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_cents: number;
  active: boolean;
};

type RawLicense = {
  plan_id: string;
  status: 'pending' | 'active' | 'blocked' | 'cancelled';
  starts_at: string | null;
  expires_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  plan_snapshot: { name?: string; duration_days?: number; price_cents?: number };
};

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  profiles?: Array<{ name: string; role: string; active: boolean }>;
  organization_licenses?: RawLicense | RawLicense[];
};

function licenseOf(organization: Organization) {
  const value = organization.organization_licenses;
  return Array.isArray(value) ? value[0] : value;
}

function effectiveStatus(license?: RawLicense) {
  if (!license) return 'pending';
  if (license.status !== 'active') return license.status;
  if (!license.expires_at || new Date(license.expires_at).getTime() <= Date.now()) return 'expired';
  return 'active';
}

export default function MasterClientesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState('');

  const load = useCallback(async () => {
    setMessage('');
    const [organizationsResponse, plansResponse] = await Promise.all([
      fetch('/api/platform/organizations', { cache: 'no-store' }),
      fetch('/api/platform/plans', { cache: 'no-store' }),
    ]);
    const organizationsData = await organizationsResponse.json();
    const plansData = await plansResponse.json();
    if (!organizationsResponse.ok) throw new Error(organizationsData.error);
    if (!plansResponse.ok) throw new Error(plansData.error);
    setOrganizations(organizationsData.organizations || []);
    setPlans(plansData.plans || []);
  }, []);

  useEffect(() => {
    void load().catch((reason) => setMessage(reason.message || 'Não foi possível carregar os clientes.'));
  }, [load]);

  const filtered = useMemo(
    () =>
      organizations.filter((organization) => {
        const status = effectiveStatus(licenseOf(organization));
        const matchesFilter = filter === 'all' || status === filter;
        const owner = organization.profiles?.find((profile) => profile.role === 'owner');
        const term = `${organization.name} ${organization.slug || ''} ${owner?.name || ''}`.toLowerCase();
        return matchesFilter && term.includes(query.trim().toLowerCase());
      }),
    [filter, organizations, query],
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    const response = await fetch('/api/platform/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: form.get('organizationName'),
        ownerName: form.get('ownerName'),
        email: form.get('email'),
        temporaryPassword: form.get('temporaryPassword'),
        planId: form.get('planId'),
      }),
    });
    const data = await response.json();
    setSaving(false);
    setMessage(
      response.ok ? 'Estacionamento e licença criados com sucesso.' : data.error || 'Falha no cadastro.',
    );
    if (response.ok) {
      e.currentTarget.reset();
      await load();
    }
  }

  async function licenseAction(organizationId: string, action: string, planId?: string, reason = '') {
    if ((action === 'block' || action === 'cancel') && reason.trim().length < 3) {
      setMessage('Informe um motivo com pelo menos 3 caracteres.');
      return;
    }
    setActionBusy(organizationId);
    setMessage('');
    const response = await fetch(`/api/platform/licenses/${organizationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, planId: planId || null, reason }),
    });
    const data = await response.json();
    setActionBusy('');
    setMessage(response.ok ? 'Licença atualizada. As sessões abertas receberão a mudança.' : data.error);
    if (response.ok) await load();
  }

  return (
    <AppShell title="Clientes SaaS">
      <MasterNav />
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Gestão comercial</p>
        <h1 className="mt-1 text-3xl font-black">Estacionamentos</h1>
        <p className="mt-2 text-slate-500">Cadastre, pesquise e controle licenças em tempo real.</p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900 md:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 text-lg font-black md:col-span-2">
          <Plus size={20} /> Novo estacionamento
        </h2>
        <input
          name="organizationName"
          required
          placeholder="Nome do estacionamento"
          className="master-input"
        />
        <input name="ownerName" required placeholder="Nome do proprietário" className="master-input" />
        <input
          name="email"
          required
          type="email"
          placeholder="E-mail do proprietário"
          className="master-input"
        />
        <input
          name="temporaryPassword"
          required
          type="password"
          minLength={8}
          placeholder="Senha provisória"
          className="master-input"
        />
        <select name="planId" required className="master-input md:col-span-2" defaultValue="">
          <option value="" disabled>
            Selecione o plano inicial
          </option>
          {plans
            .filter((plan) => plan.active)
            .map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.duration_days} dias
              </option>
            ))}
        </select>
        <button
          disabled={saving}
          className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          {saving ? 'Criando...' : 'Cadastrar e liberar licença'}
        </button>
      </form>

      <div className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar estacionamento ou proprietário"
            className="master-input w-full pl-10"
          />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="master-input">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
          <option value="expired">Expirados</option>
          <option value="pending">Pendentes</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm text-brand-800"
        >
          {message}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((organization) => (
          <OrganizationCard
            key={organization.id}
            organization={organization}
            plans={plans}
            busy={actionBusy === organization.id}
            onAction={licenseAction}
          />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900">
            Nenhum estacionamento encontrado.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function OrganizationCard({
  organization,
  plans,
  busy,
  onAction,
}: {
  organization: Organization;
  plans: Plan[];
  busy: boolean;
  onAction: (organizationId: string, action: string, planId?: string, reason?: string) => Promise<void>;
}) {
  const license = licenseOf(organization);
  const status = effectiveStatus(license);
  const [planId, setPlanId] = useState(license?.plan_id || plans.find((plan) => plan.active)?.id || '');
  const [reason, setReason] = useState('');
  const owner = organization.profiles?.find((profile) => profile.role === 'owner');
  const statusStyle = {
    active: 'bg-emerald-50 text-emerald-700',
    blocked: 'bg-red-50 text-red-700',
    expired: 'bg-amber-50 text-amber-700',
    pending: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-50 text-red-700',
  }[status];

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-slate-800 dark:text-brand-300">
            <Building2 />
          </span>
          <div>
            <h2 className="font-black">{organization.name}</h2>
            <p className="text-sm text-slate-500">
              Proprietário: {owner?.name || 'Não identificado'} • {organization.slug}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusStyle}`}>{status}</span>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <Info label="Plano" value={license?.plan_snapshot?.name || 'Não definido'} />
        <Info
          label="Início"
          value={license?.starts_at ? new Date(license.starts_at).toLocaleDateString('pt-BR') : '—'}
        />
        <Info
          label="Vencimento"
          value={license?.expires_at ? new Date(license.expires_at).toLocaleString('pt-BR') : '—'}
        />
      </div>

      {license?.block_reason && (
        <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">Motivo: {license.block_reason}</p>
      )}

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto]">
        <select value={planId} onChange={(event) => setPlanId(event.target.value)} className="master-input">
          {plans
            .filter((plan) => plan.active)
            .map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.duration_days} dias
              </option>
            ))}
        </select>
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Motivo para bloquear/cancelar"
          className="master-input"
        />
        <div className="flex flex-wrap gap-2">
          {status === 'active' ? (
            <button
              disabled={busy}
              onClick={() => void onAction(organization.id, 'block', undefined, reason)}
              className="master-action bg-red-600 text-white"
            >
              <Ban size={16} /> Bloquear
            </button>
          ) : status === 'blocked' && license?.expires_at && new Date(license.expires_at) > new Date() ? (
            <button
              disabled={busy}
              onClick={() => void onAction(organization.id, 'unblock')}
              className="master-action bg-emerald-600 text-white"
            >
              <CheckCircle2 size={16} /> Liberar
            </button>
          ) : null}
          <button
            disabled={busy || !planId}
            onClick={() =>
              void onAction(organization.id, status === 'pending' ? 'activate' : 'renew', planId)
            }
            className="master-action bg-brand-600 text-white"
          >
            <RefreshCw size={16} /> {status === 'pending' ? 'Ativar' : 'Renovar'}
          </button>
          {license && license.plan_id !== planId && (
            <button
              disabled={busy}
              onClick={() => void onAction(organization.id, 'change_plan', planId)}
              className="master-action border border-slate-300"
            >
              <Clock3 size={16} /> Trocar plano
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
