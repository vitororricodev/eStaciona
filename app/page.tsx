import Link from 'next/link';
import { ArrowRight, CarFront, Gauge, QrCode } from 'lucide-react';
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

        <section className="py-9 sm:py-12 lg:py-14">
          <div className="home-enter home-enter-2 max-w-3xl">
            <h1 className="max-w-[760px] text-[3rem] font-black leading-[.9] tracking-[-0.06em] text-[#06132f] dark:text-white sm:text-[4.5rem] lg:text-[5.25rem]">
              Seu pátio.
              <span className="mt-2 block bg-gradient-to-r from-[#0c6ff2] via-[#208df8] to-[#49b7ff] bg-clip-text pb-2 text-transparent">
                Na palma da mão.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Entrada, cobrança, acompanhamento e gestão em uma única plataforma.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
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
        </section>

        <section className="home-enter home-enter-3 grid gap-3 pb-4 md:grid-cols-3">
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
              <ModuleLink
                href="/login"
                icon={<CarFront />}
                title="Operação"
                text="Entrada, cobrança e veículos no pátio."
              />
              <ModuleLink
                href="/consultar"
                icon={<QrCode />}
                title="Cliente"
                text="Consulta segura por placa, tempo, valor e QR."
              />
              <ModuleLink
                href="/login"
                icon={<Gauge />}
                title="Gestão"
                text="Indicadores, movimentações e tarifas."
              />
            </>
          )}
        </section>
      </div>
    </main>
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
      className="group rounded-[1.65rem] border border-brand-100 bg-white/70 p-5 shadow-[0_18px_50px_rgba(17,88,160,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70"
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
