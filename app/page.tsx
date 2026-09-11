import Link from 'next/link';
import { CarFront, Gauge, QrCode, ArrowRight, Smartphone } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex items-center justify-between">
          <BrandLogo />
          <Link href="/login" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-brand-700 shadow-sm ring-1 ring-brand-100 transition hover:ring-brand-300">Entrar</Link>
        </div>

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
              <Smartphone size={16}/> Mobile-first para estacionamentos
            </div>
            <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-950 sm:text-7xl">
              Seu pátio.<br/><span className="bg-gradient-to-r from-brand-700 to-brand-400 bg-clip-text text-transparent">Na palma da mão.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">Entrada rápida, cobrança por tempo, acompanhamento pelo cliente e gestão em uma única plataforma.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/operacao" className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-5 py-3 font-bold text-white shadow-brand transition hover:bg-brand-800">Abrir operação <ArrowRight size={18}/></Link>
              <Link href="/admin" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-700 ring-1 ring-slate-200 transition hover:ring-brand-200">Ver gestão</Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand-200/50 blur-3xl"/>
            <div className="relative rounded-[2.5rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur">
              <p className="text-xs font-black tracking-[.18em] text-brand-600">eSTACIONA</p>
              <p className="mt-2 text-2xl font-black">3 fluxos. 1 operação conectada.</p>
              <div className="mt-6 space-y-3">
                <Flow icon={<CarFront/>} title="Operação" text="Entrada e cobrança em poucos toques."/>
                <Flow icon={<QrCode/>} title="Cliente" text="Tempo, valor atual e QR no celular."/>
                <Flow icon={<Gauge/>} title="Gestão" text="Indicadores e controle do negócio."/>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <ModuleLink href="/operacao" icon={<CarFront/>} title="Operação" text="Entrada, cobrança e veículos no pátio."/>
          <ModuleLink href="/consultar" icon={<QrCode/>} title="Cliente" text="Consulta segura por placa, tempo, valor e QR."/>
          <ModuleLink href="/admin" icon={<Gauge/>} title="Gestão" text="Indicadores, movimentações e tarifas."/>
        </div>
      </div>
    </main>
  );
}

function Flow({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){
  return <div className="flex items-center gap-4 rounded-3xl bg-brand-50/80 p-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">{icon}</span><div><p className="font-black">{title}</p><p className="text-sm text-slate-500">{text}</p></div></div>
}
function ModuleLink({href,icon,title,text}:{href:string;icon:React.ReactNode;title:string;text:string}){
  return <Link href={href} className="group rounded-3xl border border-brand-100 bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:border-brand-300"><span className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</span><h2 className="text-xl font-black">{title}</h2><p className="mt-2 text-slate-500">{text}</p><ArrowRight className="mt-5 text-brand-600 transition group-hover:translate-x-1"/></Link>
}
