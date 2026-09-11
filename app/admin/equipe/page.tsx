'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AdminNav } from '@/components/AdminNav';

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/staff');
    const data = await response.json();
    setRows(data.staff || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg('');
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        role: form.get('role'),
      }),
    });
    const data = await response.json();
    setSaving(false);
    setMsg(response.ok ? 'Usuário cadastrado com sucesso.' : data.error || 'Erro ao cadastrar usuário.');
    if (response.ok) {
      e.currentTarget.reset();
      void load();
    }
  }

  async function patch(id: string, payload: any) {
    const response = await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) setMsg(data.error);
    else void load();
  }

  return (
    <AppShell title="Gestão">
      <AdminNav />
      <h1 className="text-3xl font-black">Equipe</h1>
      <p className="mt-2 text-slate-500">Cadastre usuários manualmente e defina as permissões por perfil.</p>
      <form onSubmit={createStaff} className="mt-6 grid gap-3 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-5">
        <input name="name" required placeholder="Nome" className="rounded-2xl border border-slate-200 px-4 py-3" />
        <input name="email" required type="email" placeholder="E-mail" className="rounded-2xl border border-slate-200 px-4 py-3" />
        <input name="password" required type="password" minLength={8} placeholder="Senha" className="rounded-2xl border border-slate-200 px-4 py-3" />
        <select name="role" className="rounded-2xl border border-slate-200 px-4 py-3">
          <option value="operator">Operador</option>
          <option value="manager">Gerente</option>
        </select>
        <button disabled={saving} className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-60">
          {saving ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        {msg && <p className="text-sm md:col-span-2 lg:col-span-5">{msg}</p>}
      </form>
      <div className="mt-6 space-y-3">
        {rows.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-black">{item.name}</h2>
              <p className="text-sm text-slate-500">{item.role} • {item.active ? 'ativo' : 'inativo'}</p>
            </div>
            {item.role !== 'owner' && (
              <div className="flex gap-2">
                <select value={item.role} onChange={(e) => void patch(item.id, { role: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="operator">Operador</option>
                  <option value="manager">Gerente</option>
                </select>
                <button onClick={() => void patch(item.id, { active: !item.active })} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">
                  {item.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
