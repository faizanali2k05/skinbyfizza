import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { Thread } from '../../api/types';
import { usePermissions } from '../../auth/AuthContext';
import { Badge, Card, EmptyState, Spinner, Text, useToast } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { MessagesSquare, User } from '../../layouts/icons';

type Filter = 'all' | 'general' | 'primary' | 'vip' | 'needs-reply';

function waitingHours(t: Thread) {
  const ms = Date.now() - new Date(t.updated_at).getTime();
  return Math.floor(ms / 3_600_000);
}

export default function StaffChats() {
  const navigate = useNavigate();
  const toast = useToast();
  const { triage } = usePermissions();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, loading, refetch, setData } = useQuery(api.getThreads, [], {
    refetchOnFocus: true,
    pollMs: 10000,
  });
  const threads = data ?? [];

  const promote = async (id: string) => {
    // Optimistic: the doctor should see it immediately.
    setData((list) => (list ?? []).map((t) => (t.id === id ? { ...t, triage: 'primary' } : t)));
    try {
      await api.setPrimary(id);
      toast.show('Thread sent to the doctor');
    } catch {
      toast.show('Could not promote thread', true);
      refetch();
    }
  };

  const shown = threads.filter((t) => {
    if (filter === 'general') return t.triage === 'general';
    if (filter === 'primary') return t.triage === 'primary';
    if (filter === 'vip') return t.customer_type === 'vip';
    if (filter === 'needs-reply') return t.last_sender_id === t.user_id;
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'needs-reply', label: 'Needs reply' },
    { key: 'general', label: 'General' },
    { key: 'primary', label: 'Primary' },
    { key: 'vip', label: 'VIP' },
  ];

  return (
    <main className="screen screen--wide">
      <Text variant="h1" style={{ marginTop: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }}>
        Chats
      </Text>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`pill${filter === f.key ? ' is-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : shown.length === 0 ? (
        <EmptyState icon={<MessagesSquare size={28} />} title="No conversations here" />
      ) : (
        shown.map((t) => {
          const awaiting = t.last_sender_id === t.user_id;
          const hrs = waitingHours(t);
          return (
            <Card key={t.id} style={{ marginBottom: 'var(--sp-md)' }}>
              <button
                type="button"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => navigate(`/staff/chats/${t.id}`, { state: { thread: t } })}
              >
                <div className="row">
                  <span className="avatar avatar--sm">
                    <User size={18} />
                  </span>
                  <span className="flex1">
                    <span className="row row--wrap" style={{ gap: 'var(--sp-sm)' }}>
                      <Text variant="title" as="span">
                        {t.full_name}
                      </Text>
                      {t.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
                      {t.triage === 'primary' ? <Badge label="Primary" tone="sage" /> : null}
                      {t.platform === 'whatsapp' ? <Badge label="WhatsApp" tone="warning" /> : null}
                      {awaiting ? <Badge label="Needs reply" tone="rose" /> : null}
                    </span>
                    <Text variant="bodySmall" clamp={1}>
                      {t.last_message ?? 'No messages yet'}
                    </Text>
                    {awaiting && hrs >= 1 ? (
                      <Text variant="caption">waiting {hrs}h</Text>
                    ) : null}
                  </span>
                </div>
              </button>

              {triage && t.triage !== 'primary' ? (
                <div className="card-actions">
                  <button
                    type="button"
                    className="card-action"
                    style={{ color: 'var(--gold)' }}
                    onClick={() => void promote(t.id)}
                  >
                    Make primary (send to doctor)
                  </button>
                </div>
              ) : null}
            </Card>
          );
        })
      )}
    </main>
  );
}
