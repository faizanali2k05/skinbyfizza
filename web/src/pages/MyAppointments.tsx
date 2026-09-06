import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { AppointmentStatus } from '../api/types';
import { Badge, Card, EmptyState, Spinner, Text } from '../components';
import { useQuery } from '../hooks/useQuery';
import { Calendar, ChevronLeft, Clock, CloudOff, MapPin } from '../layouts/icons';

const STATUS_TONE: Record<AppointmentStatus, 'sage' | 'gold' | 'rose' | 'neutral'> = {
  confirmed: 'sage',
  pending: 'gold',
  completed: 'neutral',
  cancelled: 'rose',
};

export function fmtDateTime(dt: string) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    });
  } catch {
    return dt;
  }
}

/** Patient view — labelled "Follow Up" per requirements, not "Upcoming". */
export default function MyAppointments() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(() => api.getAppointments(), [], {
    refetchOnFocus: true,
  });
  const items = data ?? [];
  const now = Date.now();
  const followUp = items.filter(
    (a) => new Date(a.scheduled_at).getTime() >= now && a.status !== 'cancelled',
  );
  const past = items.filter(
    (a) => new Date(a.scheduled_at).getTime() < now || a.status === 'cancelled',
  );

  const Item = ({ a }: { a: (typeof items)[number] }) => (
    <Card elevated style={{ marginBottom: 'var(--sp-lg)' }}>
      <div className="row row--between" style={{ marginBottom: 'var(--sp-md)' }}>
        <Text variant="h3">{a.procedure_title ?? 'Treatment'}</Text>
        <Badge label={a.status} tone={STATUS_TONE[a.status] ?? 'neutral'} />
      </div>
      <div className="row" style={{ gap: 'var(--sp-sm)', marginBottom: 'var(--sp-xs)' }}>
        <Clock size={16} style={{ color: 'var(--text-muted)' }} />
        <Text variant="bodySmall">{fmtDateTime(a.scheduled_at)}</Text>
      </div>
      {a.city ? (
        <div className="row" style={{ gap: 'var(--sp-sm)' }}>
          <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
          <Text variant="bodySmall">{a.city}</Text>
        </div>
      ) : null}
      {a.original_scheduled_at ? (
        <Text variant="caption" style={{ marginTop: 'var(--sp-sm)' }}>
          Rescheduled from {fmtDateTime(a.original_scheduled_at)}
        </Text>
      ) : null}
    </Card>
  );

  return (
    <main className="screen">
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Follow Up</Text>
        <span style={{ width: 40 }} />
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : error ? (
        <EmptyState
          icon={<CloudOff size={28} />}
          title="Couldn't load appointments"
          subtitle="Check your connection and try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          title="No appointments yet"
          subtitle="Book a treatment, or message the clinic to schedule a visit."
        />
      ) : (
        <>
          {followUp.map((a) => (
            <Item key={a.id} a={a} />
          ))}
          {past.length > 0 ? (
            <>
              <Text variant="h3" style={{ margin: 'var(--sp-xxl) 0 var(--sp-lg)' }}>
                Past
              </Text>
              {past.map((a) => (
                <Item key={a.id} a={a} />
              ))}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
