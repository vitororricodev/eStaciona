'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AdminNav } from '@/components/AdminNav';
export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => setRows(d.logs || []));
  }, []);
  return (
    <AppShell title="Gestão">
      <AdminNav />
      <h1 className="text-3xl font-black">Auditoria</h1>
      <p className="mt-2 text-slate-500">Trilha de ações críticas do sistema.</p>
      <div className="mt-6 space-y-2">
        {rows.map((x) => (
          <div key={x.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{x.action}</strong>
              <span className="text-xs text-slate-400">{new Date(x.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {x.entity} {x.entity_id ? `• ${x.entity_id}` : ''}
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-400">
              {JSON.stringify(x.metadata)}
            </pre>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
