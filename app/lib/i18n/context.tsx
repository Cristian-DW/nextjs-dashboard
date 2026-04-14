'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations, { Locale, TranslationDict } from './translations';

const STORAGE_KEY = 'deltux_pos_locale';
const DEFAULT_LOCALE: Locale = 'es';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDict;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: translations[DEFAULT_LOCALE],
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === 'es' || saved === 'en')) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = DEFAULT_LOCALE;
      }
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {}
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Use inside any client component to access translations and locale switcher */
export function useLocale() {
  return useContext(LocaleContext);
}

/** Shorthand for just the translation object */
export function useT() {
  return useContext(LocaleContext).t;
}
