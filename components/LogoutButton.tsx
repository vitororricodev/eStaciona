'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      title="Sair do sistema"
      aria-label="Sair do sistema"
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
    >
      <LogOut size={17} />
      <span className="hidden sm:inline">{loading ? 'Saindo...' : 'Sair'}</span>
    </button>
  );
}
