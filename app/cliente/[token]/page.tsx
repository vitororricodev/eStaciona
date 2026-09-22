'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CarFront, Clock3, QrCode as QrIcon, CheckCircle2, ReceiptText } from 'lucide-react';
import { formatDuration } from '@/domain/pricing';
export default function ClientePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [data, setData] = useState<any>(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);
  useEffect(() => {
    if (!token) return;
    const load = () =>
      fetch(`/api/public/stay/${token}`, { cache: 'no-store' }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || 'Não encontrado');
          return;
        }
        setData(d);
        QRCode.toDataURL(window.location.href, { margin: 1, width: 300 }).then(setQr);
      });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [token]);
  if (error)
    return (
      <State
        title="Estacionamento não encontrado"
        text="Confira o link ou faça uma nova consulta pela placa."
      />
    );
  if (!data)
    return (
      <main className="grid min-h-screen place-items-center bg-brand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </main>
    );
  const v = data.stay.vehicles;
  const vehicle = Array.isArray(v) ? v[0] : v;
  const open = data.stay.status === 'open';
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white p-4 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-2xl bg-brand-600 p-3 text-white">
            <CarFront />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-500">eStaciona Cliente</p>
            <h1 className="text-2xl font-black">{vehicle?.plate}</h1>
          </div>
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-400">Veículo</p>
              <h2 className="mt-1 text-xl font-black">
                {[vehicle?.make, vehicle?.model].filter(Boolean).join(' ') || 'Veículo'}
              </h2>
              <p className="text-sm text-slate-500">{vehicle?.color}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
            >
              {open ? 'EM ANDAMENTO' : data.stay.status === 'finished' ? 'FINALIZADO' : 'ENCERRADO'}
            </span>
          </div>
          <div className="my-6 grid grid-cols-2 gap-3">
            <Mini
              label="Entrada"
              value={new Date(data.stay.started_at).toLocaleString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })}
            />
            <Mini
              label={open ? 'Tempo atual' : 'Permanência'}
              value={formatDuration(Number(data.totalMinutes || 0))}
            />
          </div>
          <div className="rounded-[1.75rem] bg-gradient-to-br from-brand-600 to-brand-400 p-6 text-white">
            <p className="text-sm font-bold text-white/80">{open ? 'VALOR ATUAL' : 'VALOR FINAL'}</p>
            <p className="mt-1 text-5xl font-black">R$ {Number(data.amount).toFixed(2).replace('.', ',')}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/75">
              <Clock3 size={14} />
              {open ? 'Atualização automática a cada 30 segundos' : 'Permanência encerrada'}
            </div>
          </div>
          {data.stay_services?.length || data.stay?.stay_services?.length ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-black">
                <ReceiptText size={17} />
                Serviços
              </div>
              {(data.stay.stay_services || []).map((s: any, i: number) => (
                <div key={i} className="mt-2 flex justify-between text-sm">
                  <span>
                    {s.service_name} × {s.quantity}
                  </span>
                  <strong>
                    R$ {(Number(s.unit_price) * Number(s.quantity)).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400">TARIFA</p>
            <p className="mt-1 text-sm text-slate-600">
              {data.tariffSummary || 'Tarifa aplicada na entrada'}
            </p>
          </div>
          {open ? (
            <div className="mt-6 text-center">
              <div className="mb-3 flex items-center justify-center gap-2 font-bold">
                <QrIcon size={18} />
                QR para saída
              </div>
              {qr && <img src={qr} alt="QR da permanência" className="mx-auto w-52 rounded-2xl" />}
              <p className="mt-3 text-sm text-slate-500">
                Apresente no caixa. Pagamento online pode ser ativado quando o estacionamento configurar um
                provedor PIX.
              </p>
              <button
                disabled
                className="mt-4 w-full rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-400"
              >
                Pagar agora • configuração necessária
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 />
              <div>
                <p className="font-black">Atendimento concluído</p>
                <p className="text-sm">Obrigado por utilizar o estacionamento.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
function State({ title, text }: { title: string; text: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-50 p-5">
      <div className="max-w-md rounded-3xl bg-white p-7 text-center shadow-soft">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-2 text-slate-500">{text}</p>
        <a
          href="/consultar"
          className="mt-5 inline-block rounded-2xl bg-brand-600 px-5 py-3 font-bold text-white"
        >
          Consultar pela placa
        </a>
      </div>
    </main>
  );
}
