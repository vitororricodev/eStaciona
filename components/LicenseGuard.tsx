'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Ban, Clock3, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AccessState = {
  exempt?: boolean;
  organizationId?: string;
  active: boolean;
  status: string;
  expiresAt?: string | null;
  error?: string | null;
};

export function LicenseGuard() {
  const pathname = usePathname();
  const [access, setAccess] = useState<AccessState | null>(null);
  const masterArea = pathname.startsWith('/master');

  const refresh = useCallback(async () => {
    const response = await fetch('/api/license/me', { cache: 'no-store' });
    if (!response.ok && response.status === 401) return;
    const data = await response.json();
    if (response.ok) setAccess(data);
  }, []);

  useEffect(() => {
    if (masterArea) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [masterArea, refresh]);

  useEffect(() => {
    if (masterArea || !access?.organizationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`license:${access.organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_licenses',
          filter: `organization_id=eq.${access.organizationId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [access?.organizationId, masterArea, refresh]);

  if (masterArea || !access || access.exempt || access.active) return null;
  return <BlockedOverlay access={access} />;
}

export function BlockedOverlay({ access }: { access: AccessState }) {
  const icon =
    access.status === 'expired' ? (
      <Clock3 size={34} />
    ) : access.status === 'blocked' ? (
      <Ban size={34} />
    ) : (
      <ShieldAlert size={34} />
    );

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-md">
      <section className="w-full max-w-lg rounded-[2rem] bg-white p-7 text-center shadow-2xl dark:bg-slate-900">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {icon}
        </span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-red-600">Acesso suspenso</p>
        <h1 className="mt-2 text-2xl font-black">Licença indisponível</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {access.error || 'Entre em contato com o administrador da plataforma para regularizar o acesso.'}
        </p>
        {access.expiresAt && (
          <p className="mt-3 text-xs text-slate-500">
            Validade registrada: {new Date(access.expiresAt).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="mt-5 text-xs text-slate-500">
          Esta tela será liberada automaticamente quando a licença for reativada.
        </p>
      </section>
    </div>
  );
}

export function LicenseBlockedPageContent() {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>({
    active: false,
    status: 'pending',
    error: 'Verificando a licença...',
  });

  const refresh = useCallback(async () => {
    const response = await fetch('/api/license/me', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && data.active) {
      router.replace('/operacao');
      router.refresh();
      return;
    }
    if (response.ok) setAccess(data);
  }, [router]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!access.organizationId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`blocked-license:${access.organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_licenses',
          filter: `organization_id=eq.${access.organizationId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [access.organizationId, refresh]);

  return <BlockedOverlay access={access} />;
}
