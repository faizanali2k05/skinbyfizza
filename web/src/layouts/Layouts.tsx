import { NavLink, Outlet } from 'react-router-dom';
import {
  Calendar,
  ChatBubbleIcon,
  Grid,
  Home,
  MoreHorizontal,
  Sparkles,
  User as UserIcon,
  Users,
} from './icons';

type Tab = {
  to: string;
  label: string;
  icon: React.ReactNode;
  home?: boolean;
};

function TabBar({ tabs }: { tabs: Tab[] }) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            ['tab', t.home ? 'tab--home' : '', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
          }
          aria-label={t.label}
        >
          {t.home ? (
            <span className="fab">{t.icon}</span>
          ) : (
            <>
              {t.icon}
              <span>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Patient shell — bottom tabs on mobile, left rail ≥1024px (see index.css). */
export function PatientLayout() {
  const tabs: Tab[] = [
    { to: '/app/treatments', label: 'Treatments', icon: <Grid size={20} /> },
    { to: '/app/ai', label: 'AI Consult', icon: <Sparkles size={20} /> },
    { to: '/app/discover', label: 'Home', icon: <Home size={22} />, home: true },
    { to: '/app/profile', label: 'Profile', icon: <UserIcon size={20} /> },
    { to: '/app/more', label: 'More', icon: <MoreHorizontal size={22} /> },
  ];
  return (
    <div className="app-shell">
      <TabBar tabs={tabs} />
      <Outlet />
    </div>
  );
}

/** Staff shell — same glass bar, staff destinations. */
export function StaffLayout() {
  const tabs: Tab[] = [
    { to: '/staff/chats', label: 'Chats', icon: <ChatBubbleIcon size={20} /> },
    { to: '/staff/users', label: 'Users', icon: <Users size={20} /> },
    { to: '/staff', label: 'Home', icon: <Home size={22} />, home: true },
    { to: '/staff/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
    { to: '/staff/treatments', label: 'Treatments', icon: <Sparkles size={20} /> },
  ];
  return (
    <div className="app-shell">
      <TabBar tabs={tabs} />
      <Outlet />
    </div>
  );
}

/** Bare shell for auth + full-screen detail routes. */
export function PlainLayout() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}
