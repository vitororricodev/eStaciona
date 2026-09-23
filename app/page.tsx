import Link from 'next/link';
import { ArrowRight, CarFront, Gauge, QrCode, Smartphone } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdminUser } from '@/lib/platformAdmin';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let mustChangePassword = false;
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('must_change_password,role,active')
      .eq('id', user.id)
      .maybeSingle();
    mustChangePassword = Boolean(profile?.must_change_password);
    userRole = profile?.active ? profile.role : null;
  }

  const platformAdmin = await isPlatformAdminUser(user?.id);
  const canAccessManagement = userRole === 'owner' || userRole === 'manager' || platformAdmin;
  const managementHref = platformAdmin && !userRole ? '/master' : '/admin';

  const primaryHref = user
    ? mustChangePassword
      ? '/alterar-senha'
      : userRole
        ? '/operacao'
        : managementHref
    : '/login';

  return (
    <main className="home-shell relative min-h-screen overflow-hidden bg-[#f8fcff] text-slate-950 dark:bg-[#020817] dark:text-white">
      <div className="home-orb home-orb-one" />
      <div className="home-orb home-orb-two" />
      <div className="home-arc home-arc-one" />
      <div className="home-arc home-arc-two" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-7 sm:px-8 sm:pt-9 lg:px-10">
        <header className="home-enter home-enter-1 flex items-center justify-between gap-4">
          <BrandLogo size="lg" />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href={primaryHref}
              className="group inline-flex items-center gap-2 rounded-2xl border border-brand-200/80 bg-white/90 px-4 py-2.5 text-sm font-black text-brand-700 shadow-[0_10px_30px_rgba(24,119,248,0.10)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-[0_14px_34px_rgba(24,119,248,0.16)] dark:border-slate-700 dark:bg-slate-900/90 dark:text-brand-300"
            >
              {user
                ? mustChangePassword
                  ? 'Alterar senha'
                  : userRole
                    ? 'Operação'
                    : 'Administração'
                : 'Entrar'}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-150px)] items-center gap-12 py-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:py-10">
          <div className="home-enter home-enter-2 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand-200/70 bg-white/80 px-4 py-2.5 text-sm font-black text-brand-700 shadow-[0_8px_28px_rgba(24,119,248,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/75 dark:text-brand-300">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <Smartphone size={14} />
              </span>
              Mobile-first para estacionamentos
            </div>

            <h1 className="max-w-[760px] text-[3.4rem] font-black leading-[.88] tracking-[-0.065em] text-[#06132f] dark:text-white sm:text-[5rem] lg:text-[5.55rem] xl:text-[6.15rem]">
              Seu pátio.
              <span className="mt-2 block bg-gradient-to-r from-[#0c6ff2] via-[#208df8] to-[#49b7ff] bg-clip-text pb-2 text-transparent">
                Na palma da mão.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Entrada rápida, cobrança por tempo, acompanhamento pelo cliente e gestão em uma única
              plataforma.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link
                    href={primaryHref}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-3.5 font-black text-white shadow-[0_14px_35px_rgba(24,119,248,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(24,119,248,0.34)]"
                  >
                    {mustChangePassword
                      ? 'Alterar senha'
                      : userRole
                        ? 'Abrir operação'
                        : 'Abrir administração'}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  {!mustChangePassword && canAccessManagement && (
                    <Link
                      href={managementHref}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 font-black text-slate-700 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                    >
                      Ver gestão
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-3.5 font-black text-white shadow-[0_14px_35px_rgba(24,119,248,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(24,119,248,0.34)]"
                >
                  Entrar no eStaciona
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>

          <div className="home-enter home-enter-3 relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-8 rounded-[4rem] bg-gradient-to-br from-brand-300/20 via-sky-200/10 to-transparent blur-3xl dark:from-brand-500/10 dark:via-sky-500/5" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/90 bg-white/80 p-5 shadow-[0_30px_80px_rgba(17,88,160,0.14)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80 sm:p-7 lg:p-8">
              <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full border-[34px] border-brand-100/70 dark:border-brand-500/5" />
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-brand-200/30 blur-2xl dark:bg-brand-500/10" />

              <div className="relative">
                <p className="text-xs font-black tracking-[.2em] text-brand-600 dark:text-brand-300">
                  eSTACIONA
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#06132f] dark:text-white sm:text-3xl">
                  3 fluxos. 1 operação conectada.
                </h2>

                <div className="mt-7 space-y-3.5">
                  <Flow icon={<CarFront />} title="Operação" text="Entrada e cobrança em poucos toques." />
                  <Flow icon={<QrCode />} title="Cliente" text="Tempo, valor atual e QR no celular." />
                  <Flow icon={<Gauge />} title="Gestão" text="Indicadores e controle do negócio." />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-enter home-enter-4 grid gap-4 pb-4 md:grid-cols-3">
          {user && !mustChangePassword ? (
            <>
              {userRole && (
                <ModuleLink
                  href="/operacao"
                  icon={<CarFront />}
                  title="Operação"
                  text="Entrada, cobrança e veículos no pátio."
                />
              )}
              {userRole && (
                <ModuleLink
                  href="/consultar"
                  icon={<QrCode />}
                  title="Cliente"
                  text="Consulta segura por placa, tempo, valor e QR."
                />
              )}
              {canAccessManagement && (
                <ModuleLink
                  href={managementHref}
                  icon={<Gauge />}
                  title="Gestão"
                  text="Indicadores, movimentações e tarifas."
                />
              )}
            </>
          ) : (
            <>
              <ModuleCard
                icon={<CarFront />}
                title="Operação"
                text="Entrada, cobrança e veículos no pátio."
              />
              <ModuleCard
                icon={<QrCode />}
                title="Cliente"
                text="Consulta segura por placa, tempo, valor e QR."
              />
              <ModuleCard icon={<Gauge />} title="Gestão" text="Indicadores, movimentações e tarifas." />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Flow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flow-row group flex items-center gap-4 rounded-[1.65rem] border border-white/70 bg-[#edf8ff]/80 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-brand-500/30 dark:hover:bg-slate-800 sm:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-[0_8px_24px_rgba(24,119,248,0.10)] dark:bg-slate-950 dark:text-brand-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-[#06132f] dark:text-white sm:text-lg">{title}</p>
        <p className="mt-0.5 text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-base">{text}</p>
      </div>
      <ArrowRight
        size={18}
        className="shrink-0 text-brand-500/80 transition-transform duration-300 group-hover:translate-x-1"
      />
    </div>
  );
}

function ModuleLink({
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
      className="group rounded-[1.8rem] border border-brand-100 bg-white/70 p-6 shadow-[0_18px_50px_rgba(17,88,160,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70"
    >
      <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
        {icon}
      </span>
      <h2 className="text-lg font-black text-[#06132f] dark:text-white">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-300">{text}</p>
      <ArrowRight
        className="mt-4 text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-300"
        size={18}
      />
    </Link>
  );
}

function ModuleCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.8rem] border border-brand-100 bg-white/70 p-6 shadow-[0_18px_50px_rgba(17,88,160,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
        {icon}
      </span>
      <h2 className="text-lg font-black text-[#06132f] dark:text-white">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-300">{text}</p>
    </div>
  );
}
