'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MasterNav } from '@/components/MasterNav';
import { Building2, ChevronDown, KeyRound, Pencil, Plus, Search, Trash2, UserPlus } from 'lucide-react';

type OrganizationUser = {
  id: string;
  name: string;
  email: string | null;
  role: 'owner' | 'manager' | 'operator';
  active: boolean;
  must_change_password: boolean;
  created_at: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  profiles?: OrganizationUser[];
};

export default function MasterEstacionamentosPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/platform/organizations', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setOrganizations(data.organizations || []);
  }, []);

  useEffect(() => {
    void load().catch((reason) =>
      setMessage(reason.message || 'Não foi possível carregar os estacionamentos.'),
    );
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return organizations.filter((organization) => {
      const users = (organization.profiles || []).map((user) => `${user.name} ${user.email || ''}`).join(' ');
      return `${organization.name} ${organization.slug || ''} ${users}`.toLowerCase().includes(term);
    });
  }, [organizations, query]);

  async function mutate(url: string, options: RequestInit, successMessage: string) {
    setMessage('');
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? successMessage : data.error || 'Não foi possível concluir a ação.');
      if (response.ok) await load();
      return response.ok;
    } catch {
      setMessage('Falha de conexão. Verifique a internet e tente novamente.');
      return false;
    }
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const ok = await mutate(
      '/api/platform/organizations',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: form.get('organizationName'),
          ownerName: form.get('ownerName'),
          email: form.get('email'),
          temporaryPassword: form.get('temporaryPassword'),
        }),
      },
      'Estacionamento cadastrado. A licença pode ser liberada no módulo Licenças.',
    );
    setSaving(false);
    if (ok) event.currentTarget.reset();
  }

  return (
    <AppShell title="Estacionamentos">
      <MasterNav />
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Cadastro e acesso</p>
        <h1 className="mt-1 text-3xl font-black">Estacionamentos</h1>
        <p className="mt-2 text-slate-500">
          Cadastre estacionamentos e administre nomes, e-mails, papéis, acessos e senhas dos usuários.
        </p>
      </div>

      <form
        onSubmit={createOrganization}
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
          autoComplete="new-password"
          placeholder="Senha provisória"
          className="master-input"
        />
        <button
          disabled={saving}
          className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-60 md:col-span-2"
        >
          {saving ? 'Cadastrando...' : 'Cadastrar estacionamento'}
        </button>
        <p className="text-xs text-slate-500 md:col-span-2">
          O proprietário deverá trocar a senha no primeiro acesso. A licença é configurada separadamente.
        </p>
      </form>

      <label className="relative mt-6 block rounded-3xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <Search className="absolute left-7 top-7 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar estacionamento, usuário ou e-mail"
          className="master-input w-full pl-10"
        />
      </label>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-800"
        >
          {message}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {filtered.map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} mutate={mutate} />
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
  mutate,
}: {
  organization: Organization;
  mutate: (url: string, options: RequestInit, successMessage: string) => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [organizationName, setOrganizationName] = useState(organization.name);
  const [addingUser, setAddingUser] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => setOrganizationName(organization.name), [organization.name]);

  async function updateOrganization() {
    await mutate(
      `/api/platform/organizations/${organization.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: organizationName }),
      },
      'Estacionamento atualizado.',
    );
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('temporaryPassword') || '');
    const confirmPassword = String(form.get('confirmTemporaryPassword') || '');
    if (password !== confirmPassword) {
      setFormError('As senhas provisórias não conferem.');
      return;
    }
    const ok = await mutate(
      `/api/platform/organizations/${organization.id}/users`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          role: form.get('role'),
          temporaryPassword: password,
        }),
      },
      'Usuário cadastrado. A troca de senha será exigida no primeiro acesso.',
    );
    if (ok) setAddingUser(false);
  }

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="shrink-0 rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-slate-800 dark:text-brand-300">
            <Building2 />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-black">{organization.name}</h2>
            <p className="text-sm text-slate-500">
              {organization.profiles?.length || 0} usuário(s) • {organization.slug}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="master-action border border-slate-300"
        >
          Gerenciar <ChevronDown size={16} className={expanded ? 'rotate-180' : ''} />
        </button>
      </div>

      {expanded && (
        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-xs font-bold text-slate-500">
              Nome do estacionamento
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="master-input mt-1 w-full"
              />
            </label>
            <button
              type="button"
              onClick={() => void updateOrganization()}
              className="master-action self-end bg-slate-950 text-white dark:bg-brand-600"
            >
              <Pencil size={16} /> Salvar nome
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black">Usuários cadastrados</h3>
              <p className="text-sm text-slate-500">E-mails e acessos vinculados a este estacionamento.</p>
            </div>
            <button
              type="button"
              onClick={() => setAddingUser((value) => !value)}
              className="master-action bg-brand-600 text-white"
            >
              <UserPlus size={16} /> {addingUser ? 'Cancelar' : 'Adicionar usuário'}
            </button>
          </div>

          {addingUser && (
            <form
              onSubmit={createUser}
              className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 md:grid-cols-2"
            >
              <input name="name" required placeholder="Nome do usuário" className="master-input" />
              <input name="email" required type="email" placeholder="E-mail" className="master-input" />
              <select name="role" className="master-input">
                <option value="operator">Operador</option>
                <option value="manager">Gerente</option>
                <option value="owner">Proprietário</option>
              </select>
              <input
                name="temporaryPassword"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="Senha provisória"
                className="master-input"
              />
              <input
                name="confirmTemporaryPassword"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="Confirmar senha"
                className="master-input md:col-span-2"
              />
              <button className="rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white md:col-span-2">
                Cadastrar usuário
              </button>
              {formError && <p className="text-sm font-semibold text-red-600 md:col-span-2">{formError}</p>}
            </form>
          )}

          <div className="mt-4 space-y-3">
            {(organization.profiles || []).map((user) => (
              <UserEditor key={user.id} organizationId={organization.id} user={user} mutate={mutate} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function UserEditor({
  organizationId,
  user,
  mutate,
}: {
  organizationId: string;
  user: OrganizationUser;
  mutate: (url: string, options: RequestInit, successMessage: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setName(user.name);
    setEmail(user.email || '');
    setRole(user.role);
    setActive(user.active);
  }, [user]);

  const endpoint = `/api/platform/organizations/${organizationId}/users/${user.id}`;

  async function save() {
    await mutate(
      endpoint,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, active }),
      },
      'Usuário atualizado.',
    );
  }

  async function remove() {
    if (!window.confirm(`Excluir o usuário ${user.name}? Esta ação remove o acesso e não pode ser desfeita.`))
      return;
    await mutate(endpoint, { method: 'DELETE' }, 'Usuário excluído.');
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    if (password !== confirmPassword) {
      setPasswordError('As senhas provisórias não conferem.');
      return;
    }
    const ok = await mutate(
      `${endpoint}/password`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) },
      'Senha provisória redefinida. A troca será exigida no próximo acesso.',
    );
    if (ok) setResettingPassword(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.25fr_.75fr_auto]">
        <label className="text-xs font-bold text-slate-500">
          Nome
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="master-input mt-1 w-full"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          E-mail
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="master-input mt-1 w-full"
          />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Papel
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as OrganizationUser['role'])}
            className="master-input mt-1 w-full"
          >
            <option value="owner">Proprietário</option>
            <option value="manager">Gerente</option>
            <option value="operator">Operador</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 self-end rounded-2xl border border-slate-200 px-4 text-sm font-bold dark:border-slate-700">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />{' '}
          Ativo
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void save()} className="master-action bg-brand-600 text-white">
          <Pencil size={16} /> Salvar
        </button>
        <button
          type="button"
          onClick={() => setResettingPassword((value) => !value)}
          className="master-action border border-brand-200 text-brand-700"
        >
          <KeyRound size={16} /> Redefinir senha
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          className="master-action border border-red-200 text-red-700"
        >
          <Trash2 size={16} /> Excluir
        </button>
        <span className="text-xs text-slate-500">
          {user.must_change_password ? 'Troca de senha pendente' : 'Senha regularizada'}
        </span>
      </div>

      {resettingPassword && (
        <form
          onSubmit={resetPassword}
          className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            name="password"
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            placeholder="Nova senha provisória"
            className="master-input"
          />
          <input
            name="confirmPassword"
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            className="master-input"
          />
          <button className="master-action bg-slate-950 text-white dark:bg-brand-600">
            <KeyRound size={16} /> Definir senha
          </button>
          {passwordError && (
            <p className="text-sm font-semibold text-red-600 sm:col-span-3">{passwordError}</p>
          )}
        </form>
      )}
    </div>
  );
}
