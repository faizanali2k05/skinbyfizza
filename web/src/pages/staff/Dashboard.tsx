import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { Badge, Card, ConfirmDialog, Text } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { useI18n } from '../../i18n';
import { AppLocale } from '../../i18n/translations';
import {
  Calendar,
  Languages,
  LogOut,
  MessagesSquare,
  Moon,
  Sun,
  Users,
} from '../../layouts/icons';
import { useTheme } from '../../theme/ThemeContext';

function isToday(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString();
}

export default function StaffDashboard() {
  const { user, signOut, refreshUser } = useAuth();
  const { isDark, toggle } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const { data: threads } = useQuery(api.getThreads, [], { refetchOnFocus: true });
  const { data: appointments } = useQuery(() => api.getAppointments(), [], { refetchOnFocus: true });
  const { data: users } = useQuery(() => api.getUsers(), [], { refetchOnFocus: true });

  // "Awaiting a staff reply" = the patient spoke last. Same rule the backend
  // reminder sweep uses (api/src/lib/reminders.js).
  const needsReply = (threads ?? []).filter((th) => th.last_sender_id === th.user_id).length;
  const todaysVisits = (appointments ?? []).filter(
    (a) => isToday(a.scheduled_at) && a.status !== 'cancelled',
  ).length;
  const patients = (users ?? []).filter((u) => u.role === 'user').length;

  const stats = [
    {
      icon: <MessagesSquare size={18} />,
      value: needsReply,
      label: 'Need a reply',
      tone: 'var(--info)',
      to: '/staff/chats',
    },
    {
      icon: <Calendar size={18} />,
      value: todaysVisits,
      label: "Today's visits",
      tone: 'var(--sage)',
      to: '/staff/appointments',
    },
    {
      icon: <Users size={18} />,
      value: patients,
      label: 'Patients',
      tone: 'var(--gold)',
      to: '/staff/users',
    },
  ];

  const cycleLocale = () => {
    const order: AppLocale[] = ['en', 'ur', 'ar'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 18 ? t('home.goodAfternoon') : t('home.goodEvening');

  return (
    <main className="screen screen--wide">
      <div className="page-head">
        <div className="flex1">
          <Text variant="display">
            {greeting}, {(user?.full_name ?? '').split(' ')[0]}
          </Text>
          <div className="row" style={{ gap: 'var(--sp-sm)', marginTop: 6 }}>
            <Badge label={user?.role ?? 'staff'} tone="gold" />
            <Text variant="caption" as="span">
              Skin By Dr. Fizza G · Karachi
            </Text>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <Card key={s.label} className="stat" onClick={() => navigate(s.to)}>
            <span className="stat__icon" style={{ color: s.tone }}>
              {s.icon}
            </span>
            <div className="stat__value">{s.value}</div>
            <Text variant="caption">{s.label}</Text>
          </Card>
        ))}
      </div>

      <Text variant="h3" style={{ marginTop: 'var(--sp-xxl)', marginBottom: 'var(--sp-md)' }}>
        Settings
      </Text>

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
        title="Log out"
        confirmLabel="Log out"
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
