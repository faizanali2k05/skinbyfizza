import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog, Text } from '../components';
import { useI18n } from '../i18n';
import { AppLocale } from '../i18n/translations';
import { ChevronRight, Info, Languages, LifeBuoy, LogOut, Moon, Sun } from '../layouts/icons';
import { useTheme } from '../theme/ThemeContext';

export default function More() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);

  const rows = [
    { icon: <LifeBuoy size={20} />, title: t('more.helpSupport'), sub: t('more.helpSupportSub') },
    { icon: <Info size={20} />, title: t('more.aboutClinic'), sub: t('more.aboutClinicSub') },
  ];

  const cycleLocale = () => {
    const order: AppLocale[] = ['en', 'ur', 'ar'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  return (
    <main className="screen">
      <Text variant="h1" style={{ marginTop: 'var(--sp-sm)', marginBottom: 'var(--sp-xl)' }}>
        {t('more.title')}
      </Text>

      <div className="menu">
        {rows.map((r) => (
          <button
            key={r.title}
            type="button"
            className="menu__row"
            onClick={() => navigate('/app/about')}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{r.icon}</span>
            <span className="flex1">
              <Text variant="label">{r.title}</Text>
              <Text variant="caption">{r.sub}</Text>
            </span>
            <ChevronRight
              size={18}
              style={{
                color: 'var(--text-muted)',
                transform: isRTL ? 'scaleX(-1)' : undefined,
              }}
            />
          </button>
        ))}
      </div>

      <button type="button" className="setting-row" onClick={toggle}>
        <span style={{ color: 'var(--gold)' }}>{isDark ? <Moon size={20} /> : <Sun size={20} />}</span>
        <Text variant="label" className="flex1">
          Appearance
        </Text>
        <Text variant="overline" as="span" color="var(--gold)">
          {isDark ? 'DARK' : 'LIGHT'}
        </Text>
      </button>

      <button type="button" className="setting-row" onClick={cycleLocale}>
        <span style={{ color: 'var(--gold)' }}>
          <Languages size={20} />
        </span>
        <Text variant="label" className="flex1">
          {t('more.language')}
        </Text>
        <Text variant="overline" as="span" color="var(--gold)">
          {locale.toUpperCase()}
        </Text>
      </button>

      <button
        type="button"
        className="row"
        style={{
          justifyContent: 'center',
          width: '100%',
          gap: 'var(--sp-sm)',
          padding: 'var(--sp-xl) 0',
          marginTop: 'var(--sp-lg)',
          color: 'var(--error)',
        }}
        onClick={() => setConfirmOut(true)}
      >
        <LogOut size={20} />
        <Text variant="label" as="span" color="var(--error)">
          {t('more.logout')}
        </Text>
      </button>

      <ConfirmDialog
        open={confirmOut}
        title={t('more.logout')}
        message="You'll need to sign in again to see your appointments and chat."
        confirmLabel={t('more.logout')}
        destructive
        onCancel={() => setConfirmOut(false)}
        onConfirm={async () => {
          setConfirmOut(false);
          await signOut();
          navigate('/welcome', { replace: true });
        }}
      />
    </main>
  );
}
