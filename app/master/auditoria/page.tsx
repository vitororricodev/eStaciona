'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MasterNav } from '@/components/MasterNav';
import { ShieldCheck } from 'lucide-react';

type Event = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function MasterAuditoriaPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/platform/audit', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setEvents(data.events || []);
      })
      .catch((reason) => setError(reason.message || 'Não foi possível carregar a auditoria.'));
  }, []);

  return (
    <AppShell title="Auditoria Master">
      <MasterNav />
      <div className="mb-6 flex items-start gap-3">
        <span className="rounded-2xl bg-slate-950 p-3 text-white dark:bg-brand-500">
          <ShieldCheck />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Rastreabilidade</p>
          <h1 className="text-3xl font-black">Auditoria da plataforma</h1>
          <p className="mt-1 text-slate-500">Últimas 200 ações administrativas.</p>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-black">{event.action}</p>
                <p className="text-sm text-slate-500">
                  {event.entity} {event.entity_id ? `• ${event.entity_id}` : ''}
                </p>
              </div>
              <time className="text-xs text-slate-400">
                {new Date(event.created_at).toLocaleString('pt-BR')}
              </time>
            </div>
            <p className="mt-3 break-all text-xs text-slate-500">
              Master: {event.actor_user_id || 'sistema'}
            </p>
          </article>
        ))}
        {!error && events.length === 0 && (
          <p className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900">
            Nenhuma ação registrada.
          </p>
        )}
      </div>
    </AppShell>
  );
}
