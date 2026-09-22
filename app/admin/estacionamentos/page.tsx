'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Building2, ShieldCheck } from 'lucide-react';

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  profiles?: Array<{ name: string; role: string; active: boolean }>;
};

export default function EstacionamentosPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Organization[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/platform/organizations');
    const data = await response.json();
    if (response.ok) setRows(data.organizations || []);
    else setMsg(data.error || 'Não foi possível carregar os estacionamentos.');
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/platform/me');
        const data = await response.json();
        const isMaster = response.ok && Boolean(data.platformAdmin);
        setAuthorized(isMaster);

        if (!isMaster) {
          router.replace('/admin');
          return;
        }

        await load();
      } catch {
        setAuthorized(false);
        router.replace('/admin');
      }
    })();
  }, [load, router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const form = new FormData(e.currentTarget);
    const response = await fetch('/api/platform/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: form.get('organizationName'),
        ownerName: form.get('ownerName'),
        email: form.get('email'),
        temporaryPassword: form.get('temporaryPassword'),
      }),
    });
    const data = await response.json();
    setSaving(false);
    setMsg(
      response.ok ? 'Estacionamento cadastrado com sucesso!' : data.error || 'Erro ao criar estacionamento.',
    );
    if (response.ok) {
      e.currentTarget.reset();
      void load();
    }
  }

  if (authorized !== true) {
    return (
      <AppShell title="Gestão">
        <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Validando permissão de Admin Master...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Master">
      <div className="mb-6 flex items-start gap-3">
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-slate-900 dark:text-brand-300">
          <Building2 />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black">Estacionamentos</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white dark:bg-brand-500">
              <ShieldCheck size={14} /> Admin Master da Plataforma
            </span>
          </div>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Área exclusiva para cadastrar uma nova empresa e gerar o primeiro acesso do proprietário.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900 md:grid-cols-2"
      >
        <input
          name="organizationName"
          required
          placeholder="Nome do estacionamento"
          className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          name="ownerName"
          required
          placeholder="Nome do proprietário / gerente"
          className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          name="email"
          required
          type="email"
          placeholder="E-mail de acesso"
          className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          name="temporaryPassword"
          required
          type="password"
          minLength={8}
          placeholder="Senha provisória (mín. 8 caracteres)"
          className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          disabled={saving}
          className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          {saving ? 'Criando...' : 'Cadastrar estacionamento'}
        </button>
        {msg && (
          <p role="status" aria-live="polite" className="text-sm md:col-span-2">
            {msg}
          </p>
        )}
      </form>

      <div className="mt-6 space-y-3">
        {rows.map((item) => {
          const owner = item.profiles?.find((profile) => profile.role === 'owner');
          return (
            <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <h2 className="font-black">{item.name}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Proprietário: {owner?.name || 'Não identificado'} • {item.slug}
              </p>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
