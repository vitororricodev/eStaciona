'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { CarFront, QrCode, Search, ArrowRight, ParkingCircle, WalletCards } from 'lucide-react';

export default function OperacaoPage() {
  const router=useRouter(); const [plate,setPlate]=useState('');
  const [stats, setStats] = useState({ open: 0, entries: 0, revenue: 0, ticketAverage: 0 });
  useEffect(() => { fetch('/api/dashboard').then(r => r.json()).then(d => { if (!d.error) setStats(d); }); }, []);
  function search(e:FormEvent){e.preventDefault(); if(plate.trim())router.push(`/operacao/cobrar?plate=${encodeURIComponent(plate.trim().toUpperCase())}`)}
  return <AppShell title="Operação"><div className="mx-auto max-w-2xl">
    <Link href="/operacao/patio" className="mb-6 block rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-400 p-6 text-white shadow-soft transition hover:scale-[1.01]"><p className="text-sm font-semibold text-white/80">Agora no estacionamento</p><div className="mt-2 flex items-end justify-between"><div><p className="text-5xl font-black">{stats.open}</p><p className="mt-1 text-sm text-white/80">veículos no pátio • tocar para visualizar</p></div><ParkingCircle size={52} className="opacity-80"/></div></Link>
    <div className="grid gap-4 sm:grid-cols-2"><Link href="/operacao/nova-entrada" className="group rounded-[2rem] border border-brand-100 bg-brand-50 p-7 transition hover:border-brand-300"><span className="inline-flex rounded-2xl bg-white p-3 text-brand-600 shadow-sm"><CarFront/></span><h2 className="mt-5 text-2xl font-black">Nova entrada</h2><p className="mt-2 text-slate-500">Placa, identificação e permanência.</p><ArrowRight className="mt-6 text-brand-600 transition group-hover:translate-x-1"/></Link><Link href="/operacao/cobrar" className="group rounded-[2rem] bg-brand-600 p-7 text-white shadow-soft transition hover:bg-brand-700"><span className="inline-flex rounded-2xl bg-white/15 p-3"><QrCode/></span><h2 className="mt-5 text-2xl font-black">Cobrar</h2><p className="mt-2 text-white/75">Leia o QR ou localize pela placa.</p><ArrowRight className="mt-6 transition group-hover:translate-x-1"/></Link></div>
    <form onSubmit={search} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Search className="text-slate-400"/><input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="Pesquisar placa para cobrar" className="w-full bg-transparent py-2 text-lg font-semibold uppercase outline-none"/><button className="w-full rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-black text-brand-700 sm:w-auto">Buscar</button></div></form>
  <Link href="/operacao/caixa" className="mt-4 flex items-center justify-between rounded-3xl bg-white p-5 font-black shadow-sm"><span className="flex items-center gap-3"><WalletCards className="text-brand-600"/>Caixa do operador</span><ArrowRight size={18} className="text-brand-600"/></Link></div></AppShell>;
}
