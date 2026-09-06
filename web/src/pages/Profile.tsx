import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Badge, Card, Text } from '../components';
import { Bell, Calendar, ChevronRight, MessagesSquare, Stethoscope, User } from '../layouts/icons';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const rows = [
    {
      icon: <Calendar size={19} />,
      title: 'Follow Up',
      sub: 'Visits booked for you by the clinic',
      to: '/app/appointments',
    },
    {
      icon: <Stethoscope size={19} />,
      title: 'Prescriptions',
      sub: 'Products & services from your doctor',
      to: '/app/prescriptions',
    },
    {
      icon: <MessagesSquare size={19} />,
      title: 'Chat with the clinic',
      sub: 'Message the team directly',
      to: '/app/chat',
    },
    {
      icon: <Bell size={19} />,
      title: 'Notifications',
      sub: 'Updates from the clinic',
      to: '/app/notifications',
    },
  ];

  return (
    <main className="screen">
      <Text variant="h1" style={{ marginTop: 'var(--sp-sm)', marginBottom: 'var(--sp-xl)' }}>
        Profile
      </Text>

      <Card elevated onClick={() => navigate('/app/profile/edit')} className="card--padded">
        <div className="row">
          <span className="avatar">
            <User size={26} />
          </span>
          <span className="flex1">
            <span className="row" style={{ gap: 'var(--sp-sm)' }}>
              <Text variant="title" as="span">
                {user?.full_name}
              </Text>
              {user?.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
            </span>
            <Text variant="caption">{user?.email ?? user?.phone_e164}</Text>
          </span>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
      </Card>

      <div className="menu" style={{ marginTop: 'var(--sp-lg)' }}>
        {rows.map((r) => (
          <button key={r.title} type="button" className="menu__row" onClick={() => navigate(r.to)}>
            <span className="menu__icon">{r.icon}</span>
            <span className="flex1">
              <Text variant="label">{r.title}</Text>
              <Text variant="caption">{r.sub}</Text>
            </span>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </div>
    </main>
  );
}
