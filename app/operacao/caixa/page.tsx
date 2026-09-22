'use client';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
export default function Page() {
  const [s, setS] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const load = () =>
    fetch('/api/cash')
      .then((r) => r.json())
      .then((d) => {
        setS(d.session);
        setLoaded(true);
      });
  useEffect(() => {
    void load();
  }, []);
  async function act(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setMsg('');
    const f = new FormData(e.currentTarget);
    const body: any = { action };
    for (const [k, v] of f.entries()) body[k] = v;
    const r = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setMsg(r.ok ? 'Operação concluída.' : d.error || 'Erro');
    if (r.ok) {
      e.currentTarget.reset();
      load();
    }
  }
  async function movement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/cash/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: f.get('type'),
        amount: f.get('amount'),
        description: f.get('description'),
      }),
    });
    const d = await r.json();
    setMsg(r.ok ? 'Movimento registrado.' : d.error);
    if (r.ok) {
      e.currentTarget.reset();
      load();
    }
  }
  return (
    <AppShell title="Caixa">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">Caixa</h1>
        <p className="mt-2 text-slate-500">Abertura, sangria, suprimento e fechamento.</p>
        {!loaded ? (
          <p className="mt-6">Carregando...</p>
        ) : !s ? (
          <form onSubmit={(e) => act(e, 'open')} className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <label className="text-sm font-bold">
              Valor inicial
              <input
                name="openingAmount"
                type="number"
                min="0"
                step="0.01"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <button className="mt-4 w-full rounded-2xl bg-brand-600 py-3 font-black text-white">
              Abrir caixa
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <K label="Abertura" value={s.opening_amount} />
              <K label="Dinheiro recebido" value={s.cashPayments} />
              <K label="Suprimentos" value={s.supply} />
              <K label="Sangrias" value={s.withdrawal} />
              <K label="Esperado em caixa" value={s.expected} />
            </div>
            <form
              onSubmit={movement}
              className="mt-5 grid gap-3 rounded-3xl bg-white p-5 shadow-sm sm:grid-cols-3"
            >
              <select name="type" className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="supply">Suprimento</option>
                <option value="withdrawal">Sangria</option>
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Valor"
                className="rounded-2xl border border-slate-200 px-4 py-3"
              />
              <input
                name="description"
                required
                placeholder="Motivo"
                className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"
              />
              <button className="rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white sm:col-span-1">
                Registrar
              </button>
            </form>
            <form
              onSubmit={(e) => act(e, 'close')}
              className="mt-5 rounded-3xl border border-brand-100 bg-brand-50 p-5"
            >
              <label className="text-sm font-bold">
                Valor contado no fechamento
                <input
                  name="closingAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="mt-2 w-full rounded-2xl border border-brand-100 bg-white px-4 py-3"
                />
              </label>
              <textarea
                name="notes"
                placeholder="Observações"
                className="mt-3 w-full rounded-2xl border border-brand-100 bg-white px-4 py-3"
              />
              <button className="mt-3 w-full rounded-2xl bg-brand-600 py-3 font-black text-white">
                Fechar caixa
              </button>
            </form>
          </>
        )}
        {msg && <p className="mt-4 rounded-2xl bg-white p-3 text-sm shadow-sm">{msg}</p>}
      </div>
    </AppShell>
  );
}
function K({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black">
        R${' '}
        {Number(value || 0)
          .toFixed(2)
          .replace('.', ',')}
      </p>
    </div>
  );
}
