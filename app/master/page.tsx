'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MasterNav } from '@/components/MasterNav';
import { StatCard } from '@/components/StatCard';
import { AlertTriangle, BadgeCheck, Ban, Building2, Clock3, ShieldCheck } from 'lucide-react';

type Stats = {
  total: number;
  active: number;
  blocked: number;
  expired: number;
  pending: number;
  expiringSoon: number;
  projectedRevenueCents: number;
};

export default function MasterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/platform/overview', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setStats(data.stats);
      })
      .catch((reason) => setError(reason.message || 'Não foi possível carregar o painel.'));
  }, []);

  return (
    <AppShell title="Painel Master">
      <MasterNav />
      <div className="mb-6 flex items-start gap-3">
        <span className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-brand-500">
          <ShieldCheck />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Gestão SaaS</p>
          <h1 className="text-3xl font-black">Painel Master</h1>
          <p className="mt-1 text-slate-500">Licenças, planos e clientes da plataforma.</p>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!stats && !error && <p className="text-sm text-slate-500">Carregando indicadores...</p>}
      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Estacionamentos" value={String(stats.total)} />
            <StatCard label="Licenças ativas" value={String(stats.active)} />
            <StatCard label="Bloqueados" value={String(stats.blocked)} />
            <StatCard label="Expirados" value={String(stats.expired)} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Summary icon={<BadgeCheck />} label="Ativos" value={stats.active} tone="green" />
            <Summary icon={<Ban />} label="Bloqueados" value={stats.blocked} tone="red" />
            <Summary icon={<Clock3 />} label="Vencem em 7 dias" value={stats.expiringSoon} tone="amber" />
            <Summary icon={<AlertTriangle />} label="Pendentes" value={stats.pending} tone="slate" />
          </div>
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Building2 className="text-brand-600" />
              <div>
                <p className="text-sm text-slate-500">Receita contratada estimada</p>
                <p className="text-2xl font-black">
                  {(stats.projectedRevenueCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Indicador baseado nos preços atuais gravados nas licenças. Não representa pagamentos
              conciliados.
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Summary({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'green' | 'red' | 'amber' | 'slate';
}) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  };
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
      <span className={`inline-flex rounded-xl p-2 ${tones[tone]}`}>{icon}</span>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
