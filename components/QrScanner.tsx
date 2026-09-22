'use client';
import { useEffect, useId, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

type Props = { onResult: (value: string) => void };

export function QrScanner({ onResult }: Props) {
  const id = `qr-${useId().replace(/:/g, '')}`;
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active) return;
    let scanner: any;
    let cancelled = false;
    setLoading(true);
    setError('');
    import('html5-qrcode')
      .then(async ({ Html5Qrcode }) => {
        if (cancelled) return;
        scanner = new Html5Qrcode(id);
        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (decodedText: string) => {
              onResult(decodedText);
              setActive(false);
            },
            () => undefined,
          );
        } catch {
          setError('Não foi possível acessar a câmera. Use a busca pela placa.');
          setActive(false);
        } finally {
          setLoading(false);
        }
      })
      .catch(() => {
        setError('Scanner indisponível neste navegador.');
        setActive(false);
        setLoading(false);
      });
    return () => {
      cancelled = true;
      if (scanner)
        scanner
          .stop()
          .catch(() => undefined)
          .finally(() => scanner.clear().catch(() => undefined));
    };
  }, [active, id, onResult]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Camera className="text-brand-600" />
          <div>
            <p className="font-black">Escanear QR Code</p>
            <p className="text-sm text-slate-500">Use a câmera traseira para localizar a permanência.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white"
        >
          {active ? (
            <span className="flex items-center gap-2">
              <CameraOff size={17} />
              Fechar
            </span>
          ) : (
            'Abrir câmera'
          )}
        </button>
      </div>
      {active && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950 p-2">
          <div id={id} className="min-h-64 w-full" />
          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-white">
              <Loader2 className="animate-spin" size={18} />
              Abrindo câmera...
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
    </div>
  );
}
