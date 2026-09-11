'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const SPLASH_KEY = 'estaciona-splash-shown';

export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SPLASH_KEY) === '1') {
        setVisible(false);
        return;
      }
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      // Em navegadores restritos, a animação apenas será exibida normalmente.
    }

    const leaveTimer = window.setTimeout(() => setLeaving(true), 1150);
    const hideTimer = window.setTimeout(() => setVisible(false), 1500);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#03142f] transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <div className="splash-aurora splash-aurora-a" />
      <div className="splash-aurora splash-aurora-b" />
      <div className="splash-grid" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="splash-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="splash-logo-wrap">
          <Image
            src="/estaciona-icon-hq-transparent.png"
            alt=""
            width={580}
            height={440}
            priority
            className="h-[126px] w-[126px] object-contain sm:h-[148px] sm:w-[148px]"
          />
        </div>

        <div className="relative mt-5 h-[68px] w-[272px] sm:h-[78px] sm:w-[314px]">
          <Image
            src="/estaciona-wordmark-dark-hq.png"
            alt="eStaciona"
            fill
            priority
            sizes="314px"
            className="object-contain"
          />
        </div>

        <div className="mt-7 h-1.5 w-52 overflow-hidden rounded-full bg-white/10 sm:w-64">
          <span className="splash-loader block h-full rounded-full bg-gradient-to-r from-brand-500 via-sky-300 to-cyan-300" />
        </div>
      </div>
    </div>
  );
}
