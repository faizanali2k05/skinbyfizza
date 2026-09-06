import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { api } from '../../api/services';
import { User } from '../../api/types';
import { Badge, Button, Card, Text, TextField, useToast } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { ChevronLeft, Search } from '../../layouts/icons';

/**
 * Assign-new UI per requirements: Full name → City → Treatment, with the
 * patient found by searching their number.
 */
export default function StaffAssignAppointment() {
  const navigate = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<User | null>(null);
  const [procedureId, setProcedureId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [city, setCity] = useState('Karachi');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: procedures } = useQuery(api.getProcedures, []);
  const { data: users, loading: searching } = useQuery(
    () => api.getUsers(q.trim() || undefined),
    [q],
    { enabled: q.trim().length > 1 },
  );

  const matches = useMemo(() => (users ?? []).slice(0, 8), [users]);

  const submit = async () => {
    if (!picked) {
      setError('Search for and select the patient first.');
      return;
    }
    if (!scheduledAt) {
      setError('Choose a date and time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.assignAppointment({
        user_id: picked.id,
        procedure_id: procedureId || undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        city: city || undefined,
      });
      toast.show('Appointment assigned');
      navigate('/staff/appointments', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not assign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="screen" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Assign new</Text>
        <span style={{ width: 40 }} />
      </div>

      <Text variant="overline" style={{ marginBottom: 'var(--sp-sm)' }}>
        Full name — search by number
      </Text>
      <div className="searchbar">
        <Search size={18} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
        <input
          value={q}
          placeholder="+92300… or name"
          onChange={(e) => {
            setQ(e.target.value);
            setPicked(null);
          }}
        />
      </div>

      {picked ? (
        <Card style={{ marginBottom: 'var(--sp-lg)' }}>
          <div className="row row--between">
            <span className="flex1">
              <Text variant="title">{picked.full_name}</Text>
              <Text variant="caption">{picked.phone_e164}</Text>
            </span>
            {picked.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
            <button type="button" className="card-action" onClick={() => setPicked(null)}>
              Change
            </button>
          </div>
        </Card>
      ) : q.trim().length > 1 ? (
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          {searching ? (
            <Text variant="caption">Searching…</Text>
          ) : matches.length === 0 ? (
            <Text variant="caption">No patient found with that number or name.</Text>
          ) : (
            matches.map((u) => (
              <button
                key={u.id}
                type="button"
                className="menu__row"
                style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', marginBottom: 6 }}
                onClick={() => {
                  setPicked(u);
                  setCity(u.city || 'Karachi');
                }}
              >
                <span className="flex1">
                  <Text variant="label">{u.full_name}</Text>
                  <Text variant="caption">{u.phone_e164}</Text>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <TextField label="City" value={city} onChange={setCity} name="city" />

      <div className="field">
        <span className="t-overline field__label">Treatment</span>
        <div className="field__box">
          <select
            value={procedureId}
            onChange={(e) => setProcedureId(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 15,
              height: '100%',
            }}
          >
            <option value="">— Select a treatment —</option>
            {(procedures ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextField
        label="Date & time"
        type="datetime-local"
        value={scheduledAt}
        onChange={setScheduledAt}
        name="scheduled_at"
      />

      {error ? (
        <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
          {error}
        </Text>
      ) : null}

      <Button title="Assign appointment" loading={saving} onClick={() => void submit()} />
    </main>
  );
}
