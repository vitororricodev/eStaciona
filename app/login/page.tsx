'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError('');
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) });
    if (error || !data.user) { setError('Não foi possível entrar. Confira e-mail e senha.'); setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('must_change_password').eq('id', data.user.id).maybeSingle();
    router.push(profile?.must_change_password ? '/alterar-senha' : '/operacao');
    router.refresh();
  }
  return <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-white p-4 dark:from-slate-950 dark:to-slate-900"><div className="fixed right-4 top-4"><ThemeToggle/></div><div className="w-full max-w-md"><div className="mb-6 flex justify-center"><BrandLogo/></div><form onSubmit={submit} className="rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-brand-100"><p className="text-xs font-black tracking-[.16em] text-brand-600">ACESSO eSTACIONA</p><h1 className="mt-2 text-3xl font-black">Bem-vindo</h1><p className="mt-2 text-slate-500">Acesse a operação do seu estacionamento.</p><label className="mt-6 block text-sm font-semibold">E-mail</label><input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"/><label className="mt-4 block text-sm font-semibold">Senha</label><input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"/>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-2xl bg-brand-700 px-4 py-3 font-bold text-white shadow-brand disabled:opacity-60">{loading ? 'Entrando...' : 'Entrar no eStaciona'}</button></form><p className="mt-5 text-center text-xs font-semibold text-slate-400">O controle do seu pátio na palma da mão.</p></div></main>
}
