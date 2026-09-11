import Image from 'next/image';
import Link from 'next/link';

export function BrandLogo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5"
      aria-label="eStaciona - início"
    >
      <Image
        src="/estaciona-icon.png"
        alt=""
        width={48}
        height={48}
        priority
        className="h-11 w-11 shrink-0 object-contain"
      />
      {!compact && (
        <Image
          src="/estaciona-wordmark.png"
          alt="eStaciona — O controle do seu pátio na palma da mão."
          width={203}
          height={59}
          priority
          className="h-auto w-[154px] sm:w-[175px]"
        />
      )}
    </Link>
  );
}
