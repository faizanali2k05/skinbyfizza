import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readSync, storage } from '../platform/storage';
import { AppLocale, RTL_LOCALES, translations } from './translations';

const STORAGE_KEY = 'app.locale';

/** Resolve a dotted key ("auth.signIn") against a locale table, falling back to English. */
function lookup(locale: AppLocale, key: string): string {
  const walk = (obj: unknown, path: string[]): unknown =>
    path.reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      obj,
    );
  const parts = key.split('.');
  const hit = walk(translations[locale], parts) ?? walk(translations.en, parts);
  return typeof hit === 'string' ? hit : key;
}

type I18nContextValue = {
  locale: AppLocale;
  isRTL: boolean;
  t: (key: string) => string;
  setLocale: (locale: AppLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLocale(): AppLocale {
  const saved = readSync(STORAGE_KEY);
  if (saved === 'ur' || saved === 'ar' || saved === 'en') return saved;
  const nav = navigator.language?.slice(0, 2);
  return nav === 'ur' || nav === 'ar' ? nav : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  // Direction is applied on <html>, so RTL flips the whole layout — no reload
  // needed, unlike React Native's I18nManager.
  useEffect(() => {
    const rtl = RTL_LOCALES.includes(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void storage.set(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: RTL_LOCALES.includes(locale),
      t: (key: string) => lookup(locale, key),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
