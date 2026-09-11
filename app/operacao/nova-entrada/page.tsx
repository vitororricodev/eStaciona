'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AppShell } from '@/components/AppShell';
import { CheckCircle2, Loader2, Send, Search, UserCheck } from 'lucide-react';

export default function NovaEntradaPage() {
  const [plate,setPlate]=useState(''); const [lookupLoading,setLookupLoading]=useState(false); const [existing,setExisting]=useState<any>(null); const [lookupDone,setLookupDone]=useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<any>(null); const [qr, setQr] = useState('');
  const [tariffs,setTariffs]=useState<any[]>([]); const [tariffPlanId,setTariffPlanId]=useState(''); const [externalVehicle,setExternalVehicle]=useState<any>(null);
  useEffect(()=>{fetch('/api/tariffs?active=true').then(r=>r.json()).then(d=>{if(!d.error)setTariffs(d.tariffs||[])});},[]);

  const lookup=useCallback(async()=>{const clean=plate.replace(/[^A-Z0-9]/gi,'').toUpperCase(); if(clean.length<6)return; setLookupLoading(true);setError(''); const r=await fetch(`/api/vehicles/lookup?plate=${clean}`); const d=await r.json();setLookupLoading(false);setLookupDone(true); if(!r.ok){setError(d.error||'Erro ao consultar placa');return;} if(d.found){setExisting(d.vehicle);setExternalVehicle(null);if(d.hasOpenStay)setError('Este veículo já está no pátio.');} else {setExisting(null);fetch(`/api/vehicles/external?plate=${clean}`).then(r=>r.json()).then(x=>{if(x.found)setExternalVehicle(x.vehicle)}).catch(()=>{});}},[plate]);
  useEffect(()=>{setLookupDone(false);setExisting(null);setExternalVehicle(null)},[plate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError('');
    const f = new FormData(e.currentTarget);
    const body:any = Object.fromEntries(['plate','name','phone','make','model','color'].map(k => [k, f.get(k)]));
    body.tariffPlanId = tariffPlanId || null;
    const r = await fetch('/api/stays/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || 'Erro ao iniciar'); setLoading(false); return; }
    const url = `${window.location.origin}/cliente/${d.stay.public_token}`;
    setQr(await QRCode.toDataURL(url, { margin: 1, width: 320 })); setResult({ ...d.stay, url }); fetch('/api/notifications/entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stayId:d.stay.id})}).catch(()=>{}); setLoading(false);
  }

  if (result) {
    const phone = String(result.vehicles?.customers?.phone || '').replace(/\D/g,'');
    const message = encodeURIComponent(`Seu veículo ${result.vehicles?.plate} foi registrado no eStaciona. Acompanhe tempo e valor: ${result.url}`);
    return <AppShell title="Entrada registrada"><div className="mx-auto max-w-lg rounded-[2rem] bg-white p-6 shadow-soft"><CheckCircle2 size={52} className="text-emerald-500"/><h1 className="mt-4 text-3xl font-black">Entrada iniciada</h1><p className="mt-2 text-slate-500">{result.vehicles?.plate} já está no pátio. Portal e QR prontos.</p>{qr && <img src={qr} alt="QR da permanência" className="mx-auto my-6 w-64 rounded-2xl"/>}<a target="_blank" href={`https://wa.me/55${phone}?text=${message}`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 font-bold text-white"><Send size={18}/>Enviar pelo WhatsApp</a><div className="mt-3 grid grid-cols-2 gap-2"><Link href="/operacao/nova-entrada" className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-bold">Nova entrada</Link><Link href="/operacao" className="rounded-2xl bg-brand-50 px-4 py-3 text-center font-bold text-brand-700">Voltar</Link></div></div></AppShell>;
  }

  const customer=existing ? (Array.isArray(existing.customers)?existing.customers[0]:existing.customers) : null;
  return <AppShell title="Nova entrada"><form onSubmit={submit} className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 shadow-soft"><h1 className="text-3xl font-black">Nova entrada</h1><p className="mt-2 text-slate-500">A placa é o identificador principal. Cliente recorrente entra em poucos toques.</p>
    <label className="mt-5 block text-sm font-bold text-slate-700">Placa<div className="mt-2 flex gap-2"><input name="plate" value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" required maxLength={8} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-lg font-black uppercase outline-none focus:border-brand-500"/><button type="button" onClick={lookup} disabled={lookupLoading||plate.length<6} className="rounded-2xl bg-brand-50 px-4 text-brand-700 disabled:opacity-40">{lookupLoading?<Loader2 className="animate-spin"/>:<Search/>}</button></div></label>
    {lookupDone&&existing&&<div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-start gap-3"><UserCheck className="mt-0.5 text-emerald-700"/><div><p className="font-black text-emerald-900">Veículo recorrente encontrado</p><p className="text-sm text-emerald-800">{[existing.make,existing.model,existing.color].filter(Boolean).join(' • ') || existing.plate}</p><p className="mt-1 text-sm text-emerald-800">{customer?.name} • {customer?.phone}</p></div></div></div>}
    {!existing&&lookupDone&&<div className="mt-5"><div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-800">Primeira entrada desta placa. Complete o cadastro abaixo.</div><div className="grid grid-cols-2 gap-3"><Field key={`make-${externalVehicle?.make||''}`} name="make" label="Marca" placeholder="Volkswagen" defaultValue={externalVehicle?.make||''}/><Field key={`model-${externalVehicle?.model||''}`} name="model" label="Modelo" placeholder="Fox" defaultValue={externalVehicle?.model||''}/></div><Field key={`color-${externalVehicle?.color||''}`} name="color" label="Cor" placeholder="Prata" defaultValue={externalVehicle?.color||''}/><div className="my-6 h-px bg-slate-100"/><Field name="name" label="Nome do cliente" placeholder="João da Silva" required/><Field name="phone" label="WhatsApp" placeholder="11999999999" required/></div>}
    {existing&&<><input type="hidden" name="name" value={customer?.name||''}/><input type="hidden" name="phone" value={customer?.phone||''}/><input type="hidden" name="make" value={existing.make||''}/><input type="hidden" name="model" value={existing.model||''}/><input type="hidden" name="color" value={existing.color||''}/></>}
    {!lookupDone&&<p className="mt-4 text-sm text-slate-500">Digite a placa e toque na lupa para continuar.</p>}
    <label className="mt-5 block text-sm font-bold text-slate-700">Tarifa<div className="mt-2"><select value={tariffPlanId} onChange={e=>setTariffPlanId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"><option value="">Automática (recomendada)</option>{tariffs.map(t=><option key={t.id} value={t.id}>{t.name}{t.is_default?' • padrão':''}</option>)}</select><p className="mt-2 text-xs text-slate-500">No modo automático, o eStaciona aplica a tabela ativa compatível com data/horário e prioridade; se nenhuma regra especial se aplicar, usa a tarifa padrão.</p></div></label>
    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={loading||!lookupDone||Boolean(error)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-4 text-lg font-black text-white disabled:opacity-40">{loading && <Loader2 className="animate-spin"/>}Iniciar estacionamento</button>
  </form></AppShell>;
}
function Field({name,label,placeholder,required,defaultValue}:{name:string;label:string;placeholder:string;required?:boolean;defaultValue?:string}) { return <label className="mt-4 block text-sm font-bold text-slate-700">{label}<input name={name} placeholder={placeholder} required={required} defaultValue={defaultValue} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-500"/></label> }
