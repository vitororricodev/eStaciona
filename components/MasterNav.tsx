'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const items = [
  ['/master', 'Visão geral'],
  ['/master/estacionamentos', 'Estacionamentos'],
  ['/master/licencas', 'Licenças'],
  ['/master/planos', 'Planos'],
  ['/master/auditoria', 'Auditoria'],
] as const;

export function MasterNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [pathname]);
  return (
    <nav aria-label="Navegação master" className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {items.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            ref={active ? activeRef : undefined}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
              active
                ? 'border-slate-950 bg-slate-950 text-white dark:border-brand-500 dark:bg-brand-500'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
