'use client';

import { useLocale } from '@/app/lib/i18n/context';
import { Locale } from '@/app/lib/i18n/translations';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocaleCookie } from '@/app/lib/actions';

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    setLocale(nextLocale);
    startTransition(async () => {
      await setLocaleCookie(nextLocale);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all"
    >
      <span className="text-base leading-none">{locale === 'es' ? '🇲🇽' : '🇺🇸'}</span>
      <div className="hidden md:flex items-center gap-2 flex-1">
        <span className="text-xs font-semibold">{locale === 'es' ? 'Español' : 'English'}</span>
        <span className="ml-auto text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-500">
          {locale === 'es' ? 'EN →' : '← ES'}
        </span>
      </div>
    </button>
  );
}
