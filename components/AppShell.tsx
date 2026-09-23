'use client';

import { usePathname } from 'next/navigation';
import { BackButton } from '@/components/BackButton';
import { BrandLogo } from '@/components/BrandLogo';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LicenseGuard } from '@/components/LicenseGuard';

const roots = new Set(['/admin', '/operacao', '/master']);

function fallbackFor(pathname: string) {
  if (pathname.startsWith('/admin/')) return '/admin';
  if (pathname.startsWith('/operacao/')) return '/operacao';
  if (pathname.startsWith('/master/')) return '/master';
  if (pathname.startsWith('/cliente/')) return '/consultar';
  return '/';
}

export function AppShell({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const showBack =
    !roots.has(pathname) &&
    (pathname.startsWith('/admin/') || pathname.startsWith('/operacao/') || pathname.startsWith('/cliente/'));
  return (
    <main className="min-h-screen bg-slate-50 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:bg-slate-950 dark:text-slate-100">
      <LicenseGuard />
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:px-6">
          <div className="min-w-0 flex-1 sm:flex-none">
            <BrandLogo size="md" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-slate-900 dark:text-brand-300 sm:block">
              {title}
            </span>
            <ThemeToggle />
            {action}
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-3 py-5 sm:px-6 sm:py-6">
        {showBack && (
          <div className="mb-4">
            <BackButton fallback={fallbackFor(pathname)} />
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
