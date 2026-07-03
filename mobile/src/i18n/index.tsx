import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18n } from 'i18n-js';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLocale, RTL_LOCALES, translations } from './translations';

const STORAGE_KEY = 'app.locale';

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function pickInitialLocale(): AppLocale {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (tag === 'ur' || tag === 'ar') return tag;
  return 'en';
}

type I18nContextValue = {
  locale: AppLocale;
  isRTL: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('en');

  useEffect(() => {
    (async () => {
      const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as AppLocale | null;
      const next = saved ?? pickInitialLocale();
      applyLocale(next);
      setLocaleState(next);
    })();
  }, []);

  const applyLocale = (next: AppLocale) => {
    i18n.locale = next;
    const rtl = RTL_LOCALES.includes(next);
    // Note: flipping RTL at runtime needs an app reload to fully apply native
    // layout direction. We set it so the next launch is correct.
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  };

  const setLocale = useCallback(async (next: AppLocale) => {
    await AsyncStorage.setItem(STORAGE_KEY, next);
    applyLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: RTL_LOCALES.includes(locale),
      t: (key, options) => i18n.t(key, options),
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
