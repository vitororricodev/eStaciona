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
        src="/estaciona-icon-hq-transparent.png"
        alt=""
        width={580}
        height={440}
        priority
        className="h-11 w-11 shrink-0 object-contain"
      />
      {!compact && (
        <span className="relative block h-[48px] w-[188px] sm:w-[208px]">
          <Image
            src="/estaciona-wordmark-light-hq.png"
            alt="eStaciona — O controle do seu pátio na palma da mão."
            fill
            priority
            sizes="208px"
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/estaciona-wordmark-dark-hq.png"
            alt="eStaciona — O controle do seu pátio na palma da mão."
            fill
            priority
            sizes="208px"
            className="hidden object-contain object-left dark:block"
          />
        </span>
      )}
    </Link>
  );
}
