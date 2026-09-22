'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AppShell } from '@/components/AppShell';
import { CheckCircle2, Loader2, Send, Search, UserCheck, BadgeCheck, CalendarDays } from 'lucide-react';
import { isValidBrazilianPlate, normalizePlate, plateFormatHint } from '@/lib/plate';

function normalizePhoneForWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export default function NovaEntradaPage() {
  const [plate, setPlate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [lookupDone, setLookupDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [qr, setQr] = useState('');
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [tariffPlanId, setTariffPlanId] = useState('');
  const [externalVehicle, setExternalVehicle] = useState<any>(null);
  const [hasParkingTag, setHasParkingTag] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);

  const cleanPlate = useMemo(() => normalizePlate(plate), [plate]);
  const validPlate = isValidBrazilianPlate(cleanPlate);

  useEffect(() => {
    fetch('/api/tariffs?active=true')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setTariffs(d.tariffs || []);
      });
  }, []);

  const lookup = useCallback(async () => {
    const clean = normalizePlate(plate);
    if (!isValidBrazilianPlate(clean)) {
      setError('Placa inválida. Use o padrão ABC1234 ou ABC1D23.');
      setLookupDone(false);
      return;
    }

    setLookupLoading(true);
    setError('');
    const r = await fetch(`/api/vehicles/lookup?plate=${clean}`);
    const d = await r.json();
    setLookupLoading(false);
    setLookupDone(true);

    if (!r.ok) {
      setError(d.error || 'Erro ao consultar placa');
      return;
    }

    if (d.found) {
      setExisting(d.vehicle);
      setExternalVehicle(null);
      if (d.hasOpenStay) setError('Este veículo já está no pátio.');
    } else {
      setExisting(null);
      fetch(`/api/vehicles/external?plate=${clean}`)
        .then((response) => response.json())
        .then((x) => {
          if (x.found) setExternalVehicle(x.vehicle);
        })
        .catch(() => {});
    }
  }, [plate]);

  useEffect(() => {
    setLookupDone(false);
    setExisting(null);
    setExternalVehicle(null);
    setError('');
  }, [plate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validPlate) {
      setError('Placa inválida. Use o padrão ABC1234 ou ABC1D23.');
      return;
    }

    setLoading(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const body: any = Object.fromEntries(
      ['plate', 'name', 'phone', 'make', 'model', 'color'].map((k) => [k, f.get(k)]),
    );
    body.plate = cleanPlate;
    body.tariffPlanId = tariffPlanId || null;
    body.hasParkingTag = hasParkingTag;
    body.isMonthly = isMonthly;

    const r = await fetch('/api/stays/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();

    if (!r.ok) {
      setError(d.error || 'Erro ao iniciar');
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/cliente/${d.stay.public_token}`;
    setQr(await QRCode.toDataURL(url, { margin: 1, width: 320 }));
    setResult({ ...d.stay, url });
    setLoading(false);
  }

  if (result) {
    const vehicle = Array.isArray(result.vehicles) ? result.vehicles[0] : result.vehicles;
    const customer = Array.isArray(vehicle?.customers) ? vehicle.customers[0] : vehicle?.customers;
    const phone = normalizePhoneForWhatsApp(String(customer?.phone || ''));
    const clientName = String(customer?.name || 'Cliente').trim() || 'Cliente';
    const vehiclePlate = String(vehicle?.plate || cleanPlate);
    const message = `Olá, ${clientName}.\n\nSeu veículo ${vehiclePlate} entrou no estacionamento.\n\nAcompanhe sua permanência:\n${result.url}`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return (
      <AppShell title="Entrada registrada">
        <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-4 shadow-soft sm:p-6">
          <CheckCircle2 size={52} className="text-emerald-500" />
          <h1 className="mt-4 text-2xl font-black sm:text-3xl">Entrada iniciada</h1>
          <p className="mt-2 text-slate-500">{vehiclePlate} já está no pátio. Portal e QR prontos.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.has_parking_tag && (
              <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                TAG
              </span>
            )}
            {result.is_monthly && (
              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                Mensalista
              </span>
            )}
          </div>

          {qr && (
            <img src={qr} alt="QR da permanência" className="mx-auto my-6 w-full max-w-64 rounded-2xl" />
          )}

          <a
            target="_blank"
            rel="noreferrer"
            href={whatsappUrl}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-center font-bold text-white transition hover:bg-emerald-700"
          >
            <Send size={18} /> Enviar ticket no WhatsApp
          </a>
          <p className="mt-2 text-center text-xs text-slate-500">
            O WhatsApp abrirá com a mensagem pronta. Basta tocar em enviar.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/operacao/nova-entrada"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-bold"
            >
              Nova entrada
            </Link>
            <Link
              href="/operacao"
              className="rounded-2xl bg-brand-50 px-4 py-3 text-center font-bold text-brand-700"
            >
              Voltar
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const customer = existing
    ? Array.isArray(existing.customers)
      ? existing.customers[0]
      : existing.customers
    : null;

  return (
    <AppShell title="Nova entrada">
      <form onSubmit={submit} className="mx-auto max-w-xl rounded-[2rem] bg-white p-4 shadow-soft sm:p-6">
        <h1 className="text-2xl font-black sm:text-3xl">Nova entrada</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          A placa é o identificador principal. Cliente recorrente entra em poucos toques.
        </p>

        <label className="mt-5 block text-sm font-bold text-slate-700">
          Placa
          <div className="mt-2 flex gap-2">
            <input
              name="plate"
              value={plate}
              onChange={(e) => setPlate(normalizePlate(e.target.value))}
              placeholder="ABC1D23"
              required
              maxLength={7}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-lg font-black uppercase outline-none ${plate && !validPlate ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500'}`}
            />
            <button
              type="button"
              onClick={() => void lookup()}
              disabled={lookupLoading || !validPlate}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 disabled:opacity-40"
              aria-label="Consultar placa"
            >
              {lookupLoading ? <Loader2 className="animate-spin" /> : <Search />}
            </button>
          </div>
          <span
            className={`mt-2 block text-xs ${plate && !validPlate ? 'text-red-600' : validPlate ? 'text-emerald-600' : 'text-slate-500'}`}
          >
            {plateFormatHint(plate) || 'Formatos aceitos: ABC1234 ou ABC1D23'}
          </span>
        </label>

        {lookupDone && existing && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 shrink-0 text-emerald-700" />
              <div className="min-w-0">
                <p className="font-black text-emerald-900">Veículo recorrente encontrado</p>
                <p className="break-words text-sm text-emerald-800">
                  {[existing.make, existing.model, existing.color].filter(Boolean).join(' • ') ||
                    existing.plate}
                </p>
                <p className="mt-1 break-words text-sm text-emerald-800">
                  {customer?.name} • {customer?.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {!existing && lookupDone && (
          <div className="mt-5">
            <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-800">
              Primeira entrada desta placa. Complete o cadastro abaixo.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                key={`make-${externalVehicle?.make || ''}`}
                name="make"
                label="Marca"
                placeholder="Volkswagen"
                defaultValue={externalVehicle?.make || ''}
              />
              <Field
                key={`model-${externalVehicle?.model || ''}`}
                name="model"
                label="Modelo"
                placeholder="Fox"
                defaultValue={externalVehicle?.model || ''}
              />
            </div>
            <Field
              key={`color-${externalVehicle?.color || ''}`}
              name="color"
              label="Cor"
              placeholder="Prata"
              defaultValue={externalVehicle?.color || ''}
            />
            <div className="my-6 h-px bg-slate-100" />
            <Field name="name" label="Nome do cliente" placeholder="João da Silva" required />
            <Field name="phone" label="WhatsApp" placeholder="75999999999" required inputMode="tel" />
          </div>
        )}

        {existing && (
          <>
            <input type="hidden" name="name" value={customer?.name || ''} />
            <input type="hidden" name="phone" value={customer?.phone || ''} />
            <input type="hidden" name="make" value={existing.make || ''} />
            <input type="hidden" name="model" value={existing.model || ''} />
            <input type="hidden" name="color" value={existing.color || ''} />
          </>
        )}

        {!lookupDone && (
          <p className="mt-4 text-sm text-slate-500">
            Digite uma placa válida e toque na lupa para continuar.
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${hasParkingTag ? 'border-brand-300 bg-brand-50' : 'border-slate-200'}`}
          >
            <input
              type="checkbox"
              checked={hasParkingTag}
              onChange={(e) => setHasParkingTag(e.target.checked)}
              className="h-5 w-5"
            />
            <BadgeCheck className="shrink-0 text-brand-600" size={20} />
            <span className="text-sm font-bold">Possui TAG</span>
          </label>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${isMonthly ? 'border-violet-300 bg-violet-50' : 'border-slate-200'}`}
          >
            <input
              type="checkbox"
              checked={isMonthly}
              onChange={(e) => setIsMonthly(e.target.checked)}
              className="h-5 w-5"
            />
            <CalendarDays className="shrink-0 text-violet-600" size={20} />
            <span className="text-sm font-bold">Mensalista</span>
          </label>
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-700">
          Tarifa
          <div className="mt-2">
            <select
              value={tariffPlanId}
              onChange={(e) => setTariffPlanId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500"
            >
              <option value="">Automática (recomendada)</option>
              {tariffs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.is_default ? ' • padrão' : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              No modo automático, o eStaciona aplica a tabela ativa compatível com data/horário e prioridade.
            </p>
          </div>
        </label>

        {error && <p className="mt-4 break-words rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          disabled={loading || !lookupDone || !validPlate || Boolean(error)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-4 text-base font-black text-white disabled:opacity-40 sm:text-lg"
        >
          {loading && <Loader2 className="animate-spin" />} Iniciar estacionamento
        </button>
      </form>
    </AppShell>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
  defaultValue,
  inputMode,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  inputMode?: 'text' | 'tel';
}) {
  return (
    <label className="mt-4 block min-w-0 text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        inputMode={inputMode}
        className="mt-2 w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-brand-500"
      />
    </label>
  );
}
