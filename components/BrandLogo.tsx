import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: {
    icon: 'h-11 w-11 sm:h-12 sm:w-12',
    wrap: 'h-[44px] w-[174px] sm:h-[48px] sm:w-[192px]',
  },
  md: {
    icon: 'h-[52px] w-[52px] sm:h-14 sm:w-14',
    wrap: 'h-[50px] w-[200px] sm:h-[56px] sm:w-[224px]',
  },
  lg: {
    icon: 'h-14 w-14 sm:h-[78px] sm:w-[78px]',
    wrap: 'h-[54px] w-[210px] sm:h-[72px] sm:w-[286px]',
  },
} as const;

export function BrandLogo({ href = '/', compact = false, size = 'md' }: BrandLogoProps) {
  const current = sizes[size];

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 sm:gap-4"
      aria-label="eStaciona - início"
    >
      <span className="relative shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
        <span className="absolute inset-1 rounded-[32%] bg-brand-400/15 blur-xl dark:bg-brand-400/20" />
        <Image
          src="/estaciona-icon-hq-transparent.png"
          alt=""
          width={580}
          height={440}
          priority
          className={`relative object-contain drop-shadow-[0_8px_20px_rgba(37,99,235,0.18)] ${current.icon}`}
        />
      </span>

      {!compact && (
        <span className={`relative block ${current.wrap}`}>
          <Image
            src="/estaciona-wordmark-light-hq.png"
            alt="eStaciona — O controle do seu pátio na palma da mão."
            fill
            priority
            sizes="286px"
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/estaciona-wordmark-dark-hq.png"
            alt="eStaciona — O controle do seu pátio na palma da mão."
            fill
            priority
            sizes="286px"
            className="hidden object-contain object-left dark:block"
          />
        </span>
      )}
    </Link>
  );
}
