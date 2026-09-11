import { BrandLogo } from '@/components/BrandLogo';
import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AppShell({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-slate-900 dark:text-brand-300 sm:block">{title}</span>
            <ThemeToggle />
            {action}
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </main>
  );
}
