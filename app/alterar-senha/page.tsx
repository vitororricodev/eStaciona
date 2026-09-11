'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AlterarSenhaPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    if (password.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('Não foi possível alterar a senha.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/account/password-changed', { method: 'POST' });
    if (!response.ok) {
      setError('Senha alterada, mas não foi possível concluir o primeiro acesso. Tente novamente.');
      setLoading(false);
      return;
    }

    router.replace('/operacao');
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-white p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="fixed right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><BrandLogo /></div>
        <form onSubmit={submit} className="rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-brand-100">
          <p className="text-xs font-black tracking-[.16em] text-brand-600">PRIMEIRO ACESSO</p>
          <h1 className="mt-2 text-3xl font-black">Crie sua nova senha</h1>
          <p className="mt-2 text-slate-500">Por segurança, a senha provisória deve ser substituída antes de acessar o sistema.</p>
          <label className="mt-6 block text-sm font-semibold">Nova senha</label>
          <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          <label className="mt-4 block text-sm font-semibold">Confirme a nova senha</label>
          <input name="confirm" type="password" minLength={8} required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="mt-6 w-full rounded-2xl bg-brand-700 px-4 py-3 font-bold text-white shadow-brand disabled:opacity-60">
            {loading ? 'Salvando...' : 'Alterar senha e continuar'}
          </button>
        </form>
      </div>
    </main>
  );
}
