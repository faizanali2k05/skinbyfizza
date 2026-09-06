import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { User } from '../../api/types';
import { usePermissions } from '../../auth/AuthContext';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Spinner,
  Text,
  TextField,
  useToast,
} from '../../components';
import { useQuery } from '../../hooks/useQuery';
import {
  Award,
  Key,
  Pause,
  Play,
  Search,
  Star,
  Stethoscope,
  Trash2,
  Users as UsersIcon,
} from '../../layouts/icons';

export default function StaffUsers() {
  const navigate = useNavigate();
  const toast = useToast();
  const perms = usePermissions();
  const [q, setQ] = useState('');
  const [registering, setRegistering] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data, loading, refetch, setData } = useQuery(
    () => api.getUsers(q.trim() || undefined),
    [q],
    { refetchOnFocus: true },
  );
  const users = data ?? [];

  /** Optimistic patch, revert (refetch) on failure. */
  const run = (patch: (list: User[]) => User[], call: () => Promise<unknown>) => {
    setData((list) => patch(list ?? []));
    call().catch(() => {
      toast.show('Action failed — reverting', true);
      refetch();
    });
  };

  return (
    <main className="screen screen--wide">
      <Text variant="h1" style={{ marginTop: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }}>
        Users
      </Text>

      <div className="searchbar">
        <Search size={18} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
        <input
          value={q}
          placeholder="Search name or number"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon size={28} />} title="No users found" />
      ) : (
        users.map((u) => (
          <Card key={u.id} style={{ marginBottom: 'var(--sp-md)' }}>
            <div className="row">
              <span className="flex1">
                <span className="row row--wrap" style={{ gap: 'var(--sp-sm)' }}>
                  <Text variant="title" as="span">
                    {u.full_name}
                  </Text>
                  {u.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
                  <Badge label={u.role} tone="neutral" />
                  {!u.email ? <Badge label="WhatsApp only" tone="warning" /> : null}
                  {u.status === 'inactive' ? <Badge label="inactive" tone="rose" /> : null}
                </span>
                <Text variant="caption">
                  {u.phone_e164}
                  {u.email ? ` · ${u.email}` : ''}
                  {u.city ? ` · ${u.city}` : ''}
                </Text>
              </span>
            </div>

            {/* Interest rating — doctor only (POST /users/:id/rating is doctor-gated) */}
            {perms.setRating ? (
              <div className="stars">
                <Text variant="caption" as="span" style={{ marginRight: 'var(--sp-sm)' }}>
                  Interest
                </Text>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Set interest ${n}`}
                    onClick={() =>
                      run(
                        (l) => l.map((x) => (x.id === u.id ? { ...x, interest_rating: n } : x)),
                        () => api.setUserRating(u.id, n),
                      )
                    }
                  >
                    <Star
                      size={18}
                      fill={u.interest_rating && u.interest_rating >= n ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
            ) : u.interest_rating ? (
              <Text variant="caption" style={{ marginTop: 'var(--sp-md)' }}>
                Interest: {u.interest_rating}/5
              </Text>
            ) : null}

            <div className="card-actions">
              <button
                type="button"
                className="card-action"
                onClick={() => navigate(`/staff/users/${u.id}`, { state: { user: u } })}
              >
                Open record
              </button>

              {perms.registerLead && !u.email ? (
                <button type="button" className="card-action" onClick={() => setRegistering(u)}>
                  <Key size={16} /> Register
                </button>
              ) : null}

              {perms.setVip ? (
                <button
                  type="button"
                  className="card-action"
                  onClick={() =>
                    run(
                      (l) =>
                        l.map((x) =>
                          x.id === u.id
                            ? { ...x, customer_type: u.customer_type !== 'vip' ? 'vip' : 'regular' }
                            : x,
                        ),
                      () => api.setUserVip(u.id, u.customer_type !== 'vip'),
                    )
                  }
                >
                  <Star size={16} /> {u.customer_type === 'vip' ? 'Unset VIP' : 'Set VIP'}
                </button>
              ) : null}

              {perms.setUserStatus ? (
                <button
                  type="button"
                  className="card-action"
                  onClick={() =>
                    run(
                      (l) =>
                        l.map((x) =>
                          x.id === u.id
                            ? { ...x, status: u.status === 'active' ? 'inactive' : 'active' }
                            : x,
                        ),
                      () => api.setUserStatus(u.id, u.status === 'active' ? 'inactive' : 'active'),
                    )
                  }
                >
                  {u.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  {u.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              ) : null}

              {perms.setUserRole && u.role === 'user' ? (
                <button
                  type="button"
                  className="card-action"
                  onClick={() =>
                    run(
                      (l) => l.map((x) => (x.id === u.id ? { ...x, role: 'manager' } : x)),
                      () => api.setUserRole(u.id, 'manager'),
                    )
                  }
                >
                  <Award size={16} /> Make manager
                </button>
              ) : null}

              {perms.writeRx ? (
                <button
                  type="button"
                  className="card-action"
                  onClick={() =>
                    navigate(`/staff/prescriptions/new?user=${u.id}`, { state: { user: u } })
                  }
                >
                  <Stethoscope size={16} /> Prescription
                </button>
              ) : null}

              {perms.deleteUser ? (
                <button
                  type="button"
                  className="card-action card-action--danger"
                  onClick={() => setDeleting(u)}
                >
                  <Trash2 size={16} /> Delete
                </button>
              ) : null}
            </div>
          </Card>
        ))
      )}

      <RegisterLeadModal
        target={registering}
        onClose={() => setRegistering(null)}
        onDone={(updated) => {
          setData((list) => (list ?? []).map((x) => (x.id === updated.id ? updated : x)));
          setRegistering(null);
          toast.show('Login created — they can sign in now');
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={deleting ? `${deleting.full_name} — this cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) {
            run(
              (l) => l.filter((x) => x.id !== target.id),
              () => api.deleteUser(target.id),
            );
          }
        }}
      />
    </main>
  );
}

/** Give a WhatsApp lead a real login (email + password). */
function RegisterLeadModal({
  target,
  onClose,
  onDone,
}: {
  target: User | null;
  onClose: () => void;
  onDone: (u: User) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.registerUser(target!.id, email.trim(), password);
      onDone(res.user);
      setEmail('');
      setPassword('');
    } catch {
      setError('Could not register — that email may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Register ${target?.full_name ?? ''}`}>
      <Text variant="caption" style={{ marginBottom: 'var(--sp-lg)' }}>
        Creates app login credentials for this WhatsApp lead ({target?.phone_e164}).
      </Text>
      <TextField label="Email" value={email} onChange={setEmail} type="email" name="lead-email" />
      <TextField label="Password" value={password} onChange={setPassword} secure name="lead-password" />
      {error ? (
        <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
          {error}
        </Text>
      ) : null}
      <Button title="Create login" loading={saving} onClick={() => void submit()} />
    </Modal>
  );
}
