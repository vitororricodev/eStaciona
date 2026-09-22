'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const items = [
  ['/admin', 'Dashboard'],
  ['/admin/movimentacoes', 'Movimentações'],
  ['/admin/relatorios', 'Relatórios'],
  ['/admin/clientes', 'Clientes'],
  ['/admin/tarifas', 'Tarifas'],
  ['/admin/servicos', 'Serviços'],
  ['/admin/equipe', 'Equipe'],
  ['/admin/auditoria', 'Auditoria'],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [pathname]);
  return (
    <nav aria-label="Navegação da gestão" className="admin-nav mb-6 flex gap-2 overflow-x-auto pb-2">
      {items.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            ref={active ? activeRef : undefined}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
