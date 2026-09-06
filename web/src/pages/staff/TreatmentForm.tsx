import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { api } from '../../api/services';
import { Procedure } from '../../api/types';
import { Button, Text, TextField, useToast } from '../../components';
import { ChevronLeft } from '../../layouts/icons';

/**
 * Create / edit a treatment.
 * Deliberately has NO price field — pricing lives only in prescriptions.
 * `session_gap` captures the time between sessions/visits.
 */
export default function StaffTreatmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const state = (useLocation().state ?? {}) as { procedure?: Procedure };
  const editing = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState('');
  const [visitsPerSession, setVisitsPerSession] = useState('');
  const [sessionGap, setSessionGap] = useState('');
  const [features, setFeatures] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = state.procedure;
    if (!p) return;
    setTitle(p.title ?? '');
    setCategory(p.category ?? '');
    setDescription(p.description ?? '');
    setDuration(p.duration ?? '');
    setSessions(p.sessions ? String(p.sessions) : '');
    setVisitsPerSession(p.visits_per_session ? String(p.visits_per_session) : '');
    setSessionGap(p.session_gap ?? '');
    setFeatures((p.key_features ?? []).join('\n'));
    setImageUrl(p.image_url ?? '');
  }, [state.procedure]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      duration: duration.trim() || undefined,
      sessions: sessions ? Number(sessions) : undefined,
      visits_per_session: visitsPerSession ? Number(visitsPerSession) : undefined,
      session_gap: sessionGap.trim() || undefined,
      key_features: features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      image_url: imageUrl.trim() || undefined,
    };
    try {
      if (editing) await api.updateProcedure(id!, payload);
      else await api.createProcedure(payload);
      toast.show(editing ? 'Treatment updated' : 'Treatment added');
      navigate('/staff/treatments', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
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
        <Text variant="h2">{editing ? 'Edit treatment' : 'Add treatment'}</Text>
        <span style={{ width: 40 }} />
      </div>

      <form onSubmit={save}>
        <TextField label="Title" value={title} onChange={setTitle} name="title" />
        <TextField
          label="Category"
          value={category}
          onChange={setCategory}
          name="category"
          hint="e.g. Facials, Injectables, Laser, Skin Care"
        />
        <TextField
          label="Description"
          value={description}
          onChange={setDescription}
          multiline
          rows={4}
          name="description"
        />
        <TextField
          label="Duration"
          value={duration}
          onChange={setDuration}
          name="duration"
          hint="e.g. 45 minutes"
        />
        <TextField
          label="Sessions"
          value={sessions}
          onChange={setSessions}
          inputMode="numeric"
          name="sessions"
        />
        <TextField
          label="Visits per session"
          value={visitsPerSession}
          onChange={setVisitsPerSession}
          inputMode="numeric"
          name="visits_per_session"
        />
        <TextField
          label="Time between sessions"
          value={sessionGap}
          onChange={setSessionGap}
          name="session_gap"
          hint="e.g. 3 weeks — the gap between each session/visit"
        />
        <TextField
          label="Key features"
          value={features}
          onChange={setFeatures}
          multiline
          rows={4}
          name="key_features"
          hint="One per line."
        />
        <TextField
          label="Image URL"
          value={imageUrl}
          onChange={setImageUrl}
          name="image_url"
          hint="Optional — a placeholder is used when empty."
        />

        {error ? (
          <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
            {error}
          </Text>
        ) : null}

        <Button title={editing ? 'Save changes' : 'Add treatment'} loading={saving} type="submit" />
      </form>
    </main>
  );
}
