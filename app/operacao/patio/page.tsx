'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { formatDuration } from '@/domain/pricing';
import { CarFront, Search, RefreshCw, ArrowRight, SlidersHorizontal } from 'lucide-react';
export default function PatioPage() {
  const [stays, setStays] = useState<any[]>([]),
    [q, setQ] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [sort, setSort] = useState('oldest'),
    [tariff, setTariff] = useState('all');
  async function load() {
    setLoading(true);
    setError('');
    const r = await fetch('/api/stays/open', { cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) setError(d.error || 'Erro ao carregar pátio');
    else setStays(d.stays || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);
  const tariffs = useMemo(
    () =>
      Array.from(new Map(stays.map((s) => [s.tariff_plans?.id, s.tariff_plans?.name])).entries()).filter(
        ([id]) => id,
      ),
    [stays],
  );
  const filtered = useMemo(() => {
    const term = q.replace(/\s/g, '').toUpperCase();
    const rows = stays.filter(
      (s) =>
        (!term ||
          String(s.vehicles?.plate || '').includes(term) ||
          String(s.vehicles?.customers?.name || '')
            .toUpperCase()
            .includes(term)) &&
        (tariff === 'all' || s.tariff_plans?.id === tariff),
    );
    return [...rows].sort((a, b) =>
      sort === 'newest'
        ? new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        : sort === 'value'
          ? b.amount - a.amount
          : sort === 'plate'
            ? String(a.vehicles?.plate).localeCompare(String(b.vehicles?.plate))
            : new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
    );
  }, [stays, q, sort, tariff]);
  const totalCurrent = stays.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    longest = stays.reduce((m, s) => Math.max(m, Number(s.totalMinutes || 0)), 0);
  return (
    <AppShell title="Veículos no pátio">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-700">OPERAÇÃO</p>
            <h1 className="text-3xl font-black">Pátio em tempo real</h1>
            <p className="mt-1 text-slate-500">{stays.length} veículo(s) com permanência aberta.</p>
          </div>
          <button onClick={load} className="rounded-2xl border border-slate-200 bg-white p-3 text-brand-700">
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-xs font-bold text-brand-700">VALOR ATUAL DO PÁTIO</p>
            <p className="mt-1 text-2xl font-black text-brand-800">
              R$ {totalCurrent.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <p className="text-xs font-bold text-slate-400">MAIOR PERMANÊNCIA</p>
            <p className="mt-1 text-2xl font-black">{formatDuration(longest)}</p>
          </div>
        </div>
        <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3">
            <Search className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar placa ou cliente"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <SlidersHorizontal size={16} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 px-2 py-2"
            >
              <option value="oldest">Mais antigos</option>
              <option value="newest">Mais recentes</option>
              <option value="value">Maior valor</option>
              <option value="plate">Placa</option>
            </select>
          </label>
          <select
            value={tariff}
            onChange={(e) => setTariff(e.target.value)}
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm"
          >
            <option value="all">Todas as tarifas</option>
            {tariffs.map(([id, name]) => (
              <option key={String(id)} value={String(id)}>
                {String(name)}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        {!loading && filtered.length === 0 && (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm">
            <CarFront className="mx-auto text-brand-300" size={48} />
            <h2 className="mt-4 text-xl font-black">Nenhum veículo encontrado</h2>
            <p className="mt-1 text-slate-500">As permanências abertas aparecerão aqui.</p>
          </div>
        )}
        <div className="space-y-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/operacao/cobrar?plate=${s.vehicles?.plate}`}
              className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-200 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-black">{s.vehicles?.plate}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    No pátio
                  </span>
                  {s.tariff_plans?.name && (
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                      {s.tariff_plans.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {[s.vehicles?.make, s.vehicles?.model].filter(Boolean).join(' ') || 'Veículo'} •{' '}
                  {s.vehicles?.customers?.name || 'Cliente não informado'}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Entrada{' '}
                  {new Date(s.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                  • {formatDuration(s.totalMinutes)}
                </p>
              </div>
              <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
                <p className="text-xs font-bold text-slate-400">ATUAL</p>
                <p className="text-xl font-black text-brand-700">
                  R$ {Number(s.amount).toFixed(2).replace('.', ',')}
                </p>
                <ArrowRight className="mt-2 text-brand-500 sm:ml-auto" size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
