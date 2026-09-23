'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/StatCard';
import { AdminNav } from '@/components/AdminNav';
import { APP_VERSION } from '@/lib/version';
import {
  ArrowRight,
  Banknote,
  Building2,
  CarFront,
  ClipboardList,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';

const cards = [
  {
    href: '/admin/movimentacoes',
    icon: <ReceiptText />,
    title: 'Movimentações',
    text: 'Histórico de entradas, saídas e pagamentos.',
  },
  {
    href: '/admin/tarifas',
    icon: <Settings2 />,
    title: 'Tarifas',
    text: 'Tabelas, frações, tolerância e teto diário.',
  },
  {
    href: '/admin/clientes',
    icon: <CarFront />,
    title: 'Clientes e veículos',
    text: 'Base recorrente e histórico de utilização.',
  },
  {
    href: '/admin/servicos',
    icon: <ClipboardList />,
    title: 'Serviços',
    text: 'Catálogo de adicionais oferecidos.',
  },
  { href: '/admin/equipe', icon: <Users />, title: 'Equipe', text: 'Usuários e permissões da organização.' },
  {
    href: '/admin/auditoria',
    icon: <ShieldCheck />,
    title: 'Auditoria',
    text: 'Trilha de ações críticas do sistema.',
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState({ open: 0, entries: 0, revenue: 0, ticketAverage: 0 });
  const [platformAdmin, setPlatformAdmin] = useState(false);
  useEffect(() => {
    fetch('/api/dashboard')
      .then((response) => response.json())
      .then((data) => {
        if (!data.error) setStats(data);
      });
    fetch('/api/platform/me')
      .then((response) => response.json())
      .then((data) => setPlatformAdmin(Boolean(data.platformAdmin)))
      .catch(() => setPlatformAdmin(false));
  }, []);

  return (
    <AppShell title="Gestão">
      <AdminNav />
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-brand-700">VISÃO GERAL</p>
          {platformAdmin && (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white dark:bg-brand-500">
              Admin Master da Plataforma
            </span>
          )}
        </div>
        <h1 className="mt-1 text-3xl font-black">Dashboard</h1>
        <p className="mt-2 text-slate-500">Indicadores essenciais de hoje.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento do dia" value={`R$ ${stats.revenue.toFixed(2).replace('.', ',')}`} />
        <StatCard label="Veículos no pátio" value={String(stats.open)} />
        <StatCard label="Entradas hoje" value={String(stats.entries)} />
        <StatCard label="Ticket médio" value={`R$ ${stats.ticketAverage.toFixed(2).replace('.', ',')}`} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <DashboardCard key={card.href} {...card} />
        ))}
        {platformAdmin && (
          <DashboardCard
            href="/master"
            icon={<Building2 />}
            title="Painel Master"
            text="Gerencie estacionamentos, usuários, planos, licenças e auditoria da plataforma."
          />
        )}
      </div>
      <div className="mt-6 rounded-[2rem] border border-brand-100 bg-brand-50 p-6">
        <div className="flex gap-4">
          <span className="rounded-2xl bg-white p-3 text-brand-600">
            <Banknote />
          </span>
          <div>
            <h2 className="font-black">Versão {APP_VERSION}</h2>
            <p className="mt-1 text-sm text-slate-600">
              MVP com segurança transacional, isolamento multi-tenant e experiência mobile-first.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DashboardCard({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group block min-h-44 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[.99] dark:bg-slate-900"
    >
      <span className="text-brand-600">{icon}</span>
      <h2 className="mt-4 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
      <ArrowRight className="mt-4 text-brand-600 transition group-hover:translate-x-1" size={18} />
    </Link>
  );
}
