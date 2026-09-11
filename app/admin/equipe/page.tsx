'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AdminNav } from '@/components/AdminNav';

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [viewerRole, setViewerRole] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/staff');
    const data = await response.json();
    setRows(data.staff || []);
    setViewerRole(data.viewerRole || '');
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
    setMsg('');
    const response = await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) setMsg(data.error);
    else {
      setMsg('Usuário atualizado com sucesso.');
      void load();
    }
  }

  async function resetPassword(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setMsg('');
    setResetting(true);

    const form = new FormData(e.currentTarget);
    const password = String(form.get('temporaryPassword') || '');
    const confirm = String(form.get('confirmTemporaryPassword') || '');

    if (password.length < 8) {
      setMsg('A senha provisória precisa ter pelo menos 8 caracteres.');
      setResetting(false);
      return;
    }

    if (password !== confirm) {
      setMsg('As senhas provisórias não conferem.');
      setResetting(false);
      return;
    }

    const response = await fetch(`/api/staff/${id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    setResetting(false);

    if (!response.ok) {
      setMsg(data.error || 'Não foi possível redefinir a senha.');
      return;
    }

    setMsg('Senha provisória definida. No próximo login, o usuário será obrigado a criar uma nova senha.');
    setResetId(null);
    e.currentTarget.reset();
  }

  function canReset(item: any) {
    if (item.role === 'owner') return false;
    if (viewerRole === 'owner') return true;
    return viewerRole === 'manager' && item.role === 'operator';
  }

  return (
    <AppShell title="Gestão">
      <AdminNav />

      <h1 className="text-3xl font-black">Equipe</h1>
      <p className="mt-2 text-slate-500">
        Cadastre usuários, defina permissões e gerencie senhas provisórias.
      </p>

      <form
        onSubmit={createStaff}
        className="mt-6 grid gap-3 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-5"
      >
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
      </form>

      {msg && (
        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {msg}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {rows.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">{item.name}</h2>
                <p className="text-sm text-slate-500">{item.role} • {item.active ? 'ativo' : 'inativo'}</p>
              </div>

              {item.role !== 'owner' && (
                <div className="flex flex-wrap gap-2">
                  <select
                    value={item.role}
                    onChange={(e) => void patch(item.id, { role: e.target.value })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="operator">Operador</option>
                    <option value="manager">Gerente</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => void patch(item.id, { active: !item.active })}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold"
                  >
                    {item.active ? 'Desativar' : 'Ativar'}
                  </button>

                  {canReset(item) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMsg('');
                        setResetId(resetId === item.id ? null : item.id);
                      }}
                      className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700"
                    >
                      {resetId === item.id ? 'Cancelar senha' : 'Redefinir senha'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {resetId === item.id && canReset(item) && (
              <form
                onSubmit={(e) => void resetPassword(e, item.id)}
                className="mt-4 grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-[1fr_1fr_auto]"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500">Senha provisória</label>
                  <input
                    name="temporaryPassword"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Confirmar senha</label>
                  <input
                    name="confirmTemporaryPassword"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                  />
                </div>

                <button
                  disabled={resetting}
                  className="self-end rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {resetting ? 'Salvando...' : 'Definir senha'}
                </button>

                <p className="text-xs text-slate-500 md:col-span-3">
                  O usuário entrará com essa senha provisória e será obrigado a criar uma nova senha antes de acessar o sistema.
                </p>
              </form>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
