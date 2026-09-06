import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { Card, EmptyState, Spinner, Text } from '../components';
import { useQuery } from '../hooks/useQuery';
import { Bell, ChevronLeft, CloudOff } from '../layouts/icons';

export default function Notifications() {
  const navigate = useNavigate();
  const { data, loading, error, setData } = useQuery(() => api.getNotifications(), [], {
    refetchOnFocus: true,
  });
  const items = data ?? [];

  // Tap = mark read (optimistic; the server call is fire-and-forget).
  const markRead = (id: string) => {
    setData((list) => (list ?? []).map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    api.markNotificationRead(id).catch(() => {});
  };

  return (
    <main className="screen">
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Notifications</Text>
        <span style={{ width: 40 }} />
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : error ? (
        <EmptyState icon={<CloudOff size={28} />} title="Couldn't load notifications" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="You're all caught up"
          subtitle="New updates will appear here."
        />
      ) : (
        items.map((n) => (
          <Card key={n.id} style={{ marginBottom: 'var(--sp-md)' }} onClick={() => markRead(n.id)}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 6,
                  flex: '0 0 auto',
                  background: n.is_read ? 'var(--text-muted)' : 'var(--gold)',
                }}
              />
              <span className="flex1">
                <Text variant="title">{n.title}</Text>
                {n.body ? (
                  <Text variant="bodySmall" style={{ marginTop: 2 }}>
                    {n.body}
                  </Text>
                ) : null}
                <Text variant="caption" style={{ marginTop: 'var(--sp-sm)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </Text>
              </span>
            </div>
          </Card>
        ))
      )}
    </main>
  );
}
