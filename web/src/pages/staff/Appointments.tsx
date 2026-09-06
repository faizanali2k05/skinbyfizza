import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { AppointmentStatus } from '../../api/types';
import { Badge, Button, Card, EmptyState, Spinner, Text, useToast } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { Calendar, Clock, Plus } from '../../layouts/icons';
import { fmtDateTime } from '../MyAppointments';

const STATUS_TONE: Record<AppointmentStatus, 'sage' | 'gold' | 'rose' | 'neutral'> = {
  confirmed: 'sage',
  pending: 'gold',
  completed: 'neutral',
  cancelled: 'rose',
};

const NEXT: Record<string, { label: string; status: AppointmentStatus }[]> = {
  pending: [
    { label: 'Confirm', status: 'confirmed' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  confirmed: [
    { label: 'Complete', status: 'completed' },
    { label: 'Cancel', status: 'cancelled' },
  ],
  completed: [],
  cancelled: [{ label: 'Reopen', status: 'pending' }],
};

export default function StaffAppointments() {
  const navigate = useNavigate();
  const toast = useToast();
  const [city, setCity] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const { data, loading, refetch, setData } = useQuery(
    () => api.getAppointments({ city: city || undefined, status: status || undefined }),
    [city, status],
    { refetchOnFocus: true },
  );
  const items = data ?? [];

  // City filter values come from the data itself, so it always matches reality.
  const cities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((a) => a.city && set.add(a.city));
    return Array.from(set);
  }, [items]);

  const setStatusFor = (id: string, next: AppointmentStatus) => {
    setData((list) => (list ?? []).map((a) => (a.id === id ? { ...a, status: next } : a)));
    api.setAppointmentStatus(id, next).catch(() => {
      toast.show('Could not update status', true);
      refetch();
    });
  };

  const reschedule = async (id: string) => {
    const input = window.prompt('New date & time (YYYY-MM-DD HH:MM)');
    if (!input) return;
    const when = new Date(input.replace(' ', 'T'));
    if (Number.isNaN(when.getTime())) {
      toast.show('Could not read that date', true);
      return;
    }
    try {
      await api.rescheduleAppointment(id, when.toISOString());
      toast.show('Rescheduled');
      refetch();
    } catch {
      toast.show('Could not reschedule', true);
    }
  };

  return (
    <main className="screen screen--wide">
      <div className="page-head">
        <Text variant="h1">Appointments</Text>
        <Button
          title="Assign new"
          size="sm"
          fullWidth={false}
          icon={<Plus size={16} />}
          onClick={() => navigate('/staff/appointments/new')}
        />
      </div>

      <div className="chips">
        <button
          type="button"
          className={`pill${!city ? ' is-active' : ''}`}
          onClick={() => setCity('')}
        >
          All cities
        </button>
        {cities.map((c) => (
          <button
            key={c}
            type="button"
            className={`pill${city === c ? ' is-active' : ''}`}
            onClick={() => setCity(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="chips">
        <button
          type="button"
          className={`pill${!status ? ' is-active' : ''}`}
          onClick={() => setStatus('')}
        >
          Any status
        </button>
        {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`pill${status === s ? ' is-active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : items.length === 0 ? (
        <EmptyState icon={<Calendar size={28} />} title="No appointments" />
      ) : (
        items.map((a) => (
          <Card key={a.id} style={{ marginBottom: 'var(--sp-md)' }}>
            <div className="row row--between" style={{ marginBottom: 'var(--sp-sm)' }}>
              <span className="flex1">
                <Text variant="h3">{a.procedure_title ?? 'Treatment'}</Text>
                <Text variant="caption">
                  {a.full_name ?? ''}
                  {a.city ? ` · ${a.city}` : ''}
                </Text>
              </span>
              <Badge label={a.status} tone={STATUS_TONE[a.status] ?? 'neutral'} />
            </div>

            <div className="row" style={{ gap: 'var(--sp-sm)' }}>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              <Text variant="bodySmall">{fmtDateTime(a.scheduled_at)}</Text>
            </div>
            {a.original_scheduled_at ? (
              <Text variant="caption" style={{ marginTop: 4 }}>
                Rescheduled from {fmtDateTime(a.original_scheduled_at)}
              </Text>
            ) : null}

            <div className="card-actions">
              {(NEXT[a.status] ?? []).map((n) => (
                <button
                  key={n.status}
                  type="button"
                  className="pill"
                  onClick={() => setStatusFor(a.id, n.status)}
                >
                  {n.label}
                </button>
              ))}
              <button type="button" className="pill" onClick={() => void reschedule(a.id)}>
                Reschedule
              </button>
            </div>
          </Card>
        ))
      )}
    </main>
  );
}
