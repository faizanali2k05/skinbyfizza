import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/services';
import { User } from '../../api/types';
import { usePermissions } from '../../auth/AuthContext';
import { Badge, Button, Card, Spinner, Text, TextField, useToast } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { ChevronLeft } from '../../layouts/icons';
import { fmtDateTime } from '../MyAppointments';
import { formatPKR } from '../Prescriptions';

/** Full patient record: profile, prescriptions, instructions (team + doctor-self). */
export default function StaffUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const perms = usePermissions();
  const state = (useLocation().state ?? {}) as { user?: User };

  const { data: users } = useQuery(() => api.getUsers(), [], { enabled: !state.user });
  const user = state.user ?? (users ?? []).find((u) => u.id === id);

  const { data: rx, loading: rxLoading } = useQuery(() => api.getPrescriptions(id), [id]);
  const {
    data: instructions,
    loading: insLoading,
    refetch: refetchIns,
  } = useQuery(() => api.getInstructions(id!), [id]);

  const [audience, setAudience] = useState<'team' | 'doctor'>('team');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const addInstruction = async () => {
    if (!body.trim() || !id) return;
    setSaving(true);
    try {
      await api.addInstruction({ user_id: id, audience, body: body.trim() });
      setBody('');
      refetchIns();
      toast.show('Instruction saved');
    } catch {
      toast.show('Could not save instruction', true);
    } finally {
      setSaving(false);
    }
  };

  const { data: appointments } = useQuery(() => api.getAppointments(), []);
  const theirs = (appointments ?? []).filter((a) => a.user_id === id);

  return (
    <main className="screen screen--wide">
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Patient record</Text>
        <span style={{ width: 40 }} />
      </div>

      <Card elevated style={{ marginBottom: 'var(--sp-lg)' }}>
        <span className="row row--wrap" style={{ gap: 'var(--sp-sm)' }}>
          <Text variant="h3" as="span">
            {user?.full_name ?? '—'}
          </Text>
          {user?.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
          {user ? <Badge label={user.role} tone="neutral" /> : null}
        </span>
        <Text variant="caption" style={{ marginTop: 4 }}>
          {user?.phone_e164}
          {user?.email ? ` · ${user.email}` : ''}
          {user?.city ? ` · ${user.city}` : ''}
        </Text>
        {user?.interest_rating ? (
          <Text variant="caption">Interest rating: {user.interest_rating}/5</Text>
        ) : null}
        <div className="row" style={{ gap: 'var(--sp-md)', marginTop: 'var(--sp-lg)' }}>
          <Button
            title="Open chat"
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => navigate('/staff/chats')}
          />
          {perms.writeRx ? (
            <Button
              title="Add prescription"
              size="sm"
              fullWidth={false}
              onClick={() => navigate(`/staff/prescriptions/new?user=${id}`, { state: { user } })}
            />
          ) : null}
        </div>
      </Card>

      <Text variant="h3" style={{ marginBottom: 'var(--sp-md)' }}>
        Appointments
      </Text>
      {theirs.length === 0 ? (
        <Text variant="caption" style={{ marginBottom: 'var(--sp-xl)' }}>
          No appointments recorded.
        </Text>
      ) : (
        theirs.map((a) => (
          <Card key={a.id} style={{ marginBottom: 'var(--sp-sm)' }}>
            <div className="row row--between">
              <span className="flex1">
                <Text variant="title">{a.procedure_title ?? 'Treatment'}</Text>
                <Text variant="caption">{fmtDateTime(a.scheduled_at)}</Text>
              </span>
              <Badge label={a.status} tone="neutral" />
            </div>
          </Card>
        ))
      )}

      <Text variant="h3" style={{ margin: 'var(--sp-xxl) 0 var(--sp-md)' }}>
        Prescriptions
      </Text>
      {rxLoading ? (
        <Spinner />
      ) : (rx ?? []).length === 0 ? (
        <Text variant="caption">Nothing prescribed yet.</Text>
      ) : (
        (rx ?? []).map((r) => (
          <Card key={r.id} style={{ marginBottom: 'var(--sp-sm)' }}>
            <div className="row row--between">
              <span className="flex1">
                <Text variant="title">{r.item_name}</Text>
                {r.notes ? <Text variant="bodySmall">{r.notes}</Text> : null}
              </span>
              {r.price != null ? (
                <Text variant="title" color="var(--gold)">
                  {formatPKR(r.price)}
                </Text>
              ) : null}
            </div>
          </Card>
        ))
      )}

      <Text variant="h3" style={{ margin: 'var(--sp-xxl) 0 var(--sp-md)' }}>
        Instructions
      </Text>
      {insLoading ? (
        <Spinner />
      ) : (instructions ?? []).length === 0 ? (
        <Text variant="caption">No instructions written yet.</Text>
      ) : (
        (instructions ?? []).map((i) => (
          <Card key={i.id} style={{ marginBottom: 'var(--sp-sm)' }}>
            <Badge label={i.audience === 'team' ? 'For the team' : "Doctor's note"} tone={i.audience === 'team' ? 'sage' : 'gold'} />
            <Text variant="body" color="var(--text-primary)" style={{ marginTop: 'var(--sp-sm)' }}>
              {i.body}
            </Text>
            <Text variant="caption" style={{ marginTop: 'var(--sp-sm)' }}>
              {new Date(i.created_at).toLocaleString()}
            </Text>
          </Card>
        ))
      )}

      {/* Writing instructions is doctor-only (POST /instructions is doctor-gated). */}
      {perms.writeInstruction ? (
        <Card style={{ marginTop: 'var(--sp-lg)' }}>
          <Text variant="overline" style={{ marginBottom: 'var(--sp-md)' }}>
            Add an instruction
          </Text>
          <div className="chips">
            <button
              type="button"
              className={`pill${audience === 'team' ? ' is-active' : ''}`}
              onClick={() => setAudience('team')}
            >
              For the team
            </button>
            <button
              type="button"
              className={`pill${audience === 'doctor' ? ' is-active' : ''}`}
              onClick={() => setAudience('doctor')}
            >
              My own note
            </button>
          </div>
          <TextField
            label=""
            value={body}
            onChange={setBody}
            multiline
            rows={3}
            name="instruction"
            placeholder={
              audience === 'team'
                ? 'What should the team know or do for this patient?'
                : 'A private note for yourself.'
            }
          />
          <Button title="Save instruction" loading={saving} onClick={() => void addInstruction()} />
        </Card>
      ) : null}
    </main>
  );
}
