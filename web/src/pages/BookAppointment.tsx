import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { api } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Card, Spinner, Text, TextField, useToast } from '../components';
import { useQuery } from '../hooks/useQuery';
import { readSync, storage } from '../platform/storage';
import { Check, ChevronLeft } from '../layouts/icons';

/**
 * Multi-step booking + consultation intake (WEB_PRD §5.4).
 * Steps 3–4 are stored as JSON in consultations.form, so adding questions is a
 * copy change here — no migration.
 */

type Draft = {
  scheduled_at: string;
  city: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  phone: string;
  email: string;
  referred_by: string;
  main_goal: string;
  routine: string;
  products: string;
  prior_treatments: string;
  sun_exposure: string;
  conditions: string;
  medications: string;
  allergies: string;
  pregnant: string;
  reactions: string;
  signature: string;
  agreed: boolean;
};

const EMPTY: Draft = {
  scheduled_at: '',
  city: 'Karachi',
  full_name: '',
  date_of_birth: '',
  address: '',
  phone: '',
  email: '',
  referred_by: '',
  main_goal: '',
  routine: '',
  products: '',
  prior_treatments: '',
  sun_exposure: '',
  conditions: '',
  medications: '',
  allergies: '',
  pregnant: '',
  reactions: '',
  signature: '',
  agreed: false,
};

const GOAL_CHIPS = ['Acne', 'Pigmentation', 'Anti-ageing', 'Scarring', 'Hair loss', 'General glow'];
const STEPS = ['Identity', 'Goal', 'Skincare', 'Medical', 'Consent'];

export default function BookAppointment() {
  const { procedureId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const { data: procedures, loading } = useQuery(api.getProcedures, []);
  const procedure = useMemo(
    () => (procedures ?? []).find((p) => p.id === procedureId),
    [procedures, procedureId],
  );

  const draftKey = `booking-draft:${procedureId}`;
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => {
    // Restore an in-progress form after an accidental reload.
    const saved = readSync(draftKey);
    if (saved) {
      try {
        return { ...EMPTY, ...(JSON.parse(saved) as Partial<Draft>) };
      } catch {
        /* corrupt draft — start clean */
      }
    }
    return EMPTY;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Prefill from the signed-in profile the first time only.
  useEffect(() => {
    setDraft((d) => ({
      ...d,
      full_name: d.full_name || user?.full_name || '',
      phone: d.phone || user?.phone_e164 || '',
      email: d.email || user?.email || '',
      city: d.city || user?.city || 'Karachi',
    }));
  }, [user]);

  useEffect(() => {
    void storage.set(draftKey, JSON.stringify(draft));
  }, [draft, draftKey]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const validate = (i: number): string | null => {
    if (i === 0) {
      if (!draft.scheduled_at) return 'Choose a date and time for your visit.';
      if (new Date(draft.scheduled_at).getTime() < Date.now()) return 'Pick a future date and time.';
      if (!draft.full_name.trim()) return 'Full name is required.';
      if (!draft.phone.trim()) return 'A contact number is required.';
    }
    if (i === 1 && !draft.main_goal.trim()) return 'Tell us your main goal or concern.';
    if (i === 4) {
      if (!draft.agreed) return 'Please agree to the consultation terms.';
      if (!draft.signature.trim()) return 'Type your name as an e-signature.';
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const err = validate(4);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.bookAppointment({
        procedure_id: procedureId,
        scheduled_at: new Date(draft.scheduled_at).toISOString(),
        city: draft.city || undefined,
        consultation: {
          full_name: draft.full_name,
          date_of_birth: draft.date_of_birth || undefined,
          address: draft.address || undefined,
          phone: draft.phone,
          email: draft.email || undefined,
          referred_by: draft.referred_by || undefined,
          main_goal: draft.main_goal,
          form: {
            skincare: {
              routine: draft.routine,
              products: draft.products,
              prior_treatments: draft.prior_treatments,
              sun_exposure: draft.sun_exposure,
            },
            medical: {
              conditions: draft.conditions,
              medications: draft.medications,
              allergies: draft.allergies,
              pregnant_or_nursing: draft.pregnant,
              prior_reactions: draft.reactions,
            },
          },
          signature: draft.signature,
          agreed: draft.agreed,
        },
      });
      await storage.remove(draftKey);
      toast.show('Appointment requested — the clinic will confirm shortly.');
      navigate('/app/appointments', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not book. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center />;

  return (
    <main className="screen" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Book a visit</Text>
        <span style={{ width: 40 }} />
      </div>

      {procedure ? (
        <Card style={{ marginBottom: 'var(--sp-lg)' }}>
          <div className="row row--between">
            <span className="flex1">
              <Text variant="title">{procedure.title}</Text>
              <Text variant="caption">
                {[procedure.category, procedure.duration, procedure.session_gap]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </span>
            <Badge label={`Step ${step + 1}/5`} tone="neutral" />
          </div>
        </Card>
      ) : null}

      {/* stepper */}
      <div className="chips" style={{ marginBottom: 'var(--sp-xl)' }}>
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`pill${i === step ? ' is-active' : ''}`}
            style={{ opacity: i > step ? 0.5 : 1, pointerEvents: 'none' }}
          >
            {i < step ? <Check size={14} /> : null}
            {label}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <>
          <TextField
            label="Preferred date & time"
            type="datetime-local"
            value={draft.scheduled_at}
            onChange={(v) => set('scheduled_at', v)}
            name="scheduled_at"
          />
          <TextField label="City" value={draft.city} onChange={(v) => set('city', v)} name="city" hint="The clinic currently serves Karachi." />
          <TextField label="Full name" value={draft.full_name} onChange={(v) => set('full_name', v)} name="full_name" />
          <TextField label="Date of birth" type="date" value={draft.date_of_birth} onChange={(v) => set('date_of_birth', v)} name="dob" />
          <TextField label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} inputMode="tel" name="phone" />
          <TextField label="Email" value={draft.email} onChange={(v) => set('email', v)} type="email" inputMode="email" name="email" />
          <TextField label="Address" value={draft.address} onChange={(v) => set('address', v)} multiline rows={2} name="address" />
          <TextField label="Referred by" value={draft.referred_by} onChange={(v) => set('referred_by', v)} name="referred_by" />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div className="chips">
            {GOAL_CHIPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`pill${draft.main_goal.includes(g) ? ' is-active' : ''}`}
                onClick={() =>
                  set('main_goal', draft.main_goal.includes(g) ? draft.main_goal.replace(g, '').replace(/^,\s*|,\s*$/g, '') : [draft.main_goal, g].filter(Boolean).join(', '))
                }
              >
                {g}
              </button>
            ))}
          </div>
          <TextField
            label="Main goal or concern"
            value={draft.main_goal}
            onChange={(v) => set('main_goal', v)}
            multiline
            rows={4}
            name="main_goal"
            hint="Tap a chip above or describe it in your own words."
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <TextField label="Current skincare routine" value={draft.routine} onChange={(v) => set('routine', v)} multiline rows={3} name="routine" />
          <TextField label="Products you use" value={draft.products} onChange={(v) => set('products', v)} multiline rows={3} name="products" />
          <TextField label="Previous treatments" value={draft.prior_treatments} onChange={(v) => set('prior_treatments', v)} multiline rows={3} name="prior_treatments" />
          <TextField label="Daily sun exposure" value={draft.sun_exposure} onChange={(v) => set('sun_exposure', v)} name="sun_exposure" />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <TextField label="Medical conditions" value={draft.conditions} onChange={(v) => set('conditions', v)} multiline rows={3} name="conditions" />
          <TextField label="Current medications" value={draft.medications} onChange={(v) => set('medications', v)} multiline rows={3} name="medications" />
          <TextField label="Allergies" value={draft.allergies} onChange={(v) => set('allergies', v)} multiline rows={2} name="allergies" />
          <TextField label="Pregnant or nursing?" value={draft.pregnant} onChange={(v) => set('pregnant', v)} name="pregnant" />
          <TextField label="Any prior reactions to treatments?" value={draft.reactions} onChange={(v) => set('reactions', v)} multiline rows={2} name="reactions" />
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Card style={{ marginBottom: 'var(--sp-lg)' }}>
            <Text variant="overline" style={{ marginBottom: 'var(--sp-sm)' }}>
              Summary
            </Text>
            <Text variant="body" color="var(--text-primary)">
              {procedure?.title ?? 'Consultation'}
            </Text>
            <Text variant="bodySmall">
              {draft.scheduled_at ? new Date(draft.scheduled_at).toLocaleString() : '—'} · {draft.city}
            </Text>
            <Text variant="bodySmall" style={{ marginTop: 'var(--sp-sm)' }}>
              {draft.main_goal}
            </Text>
          </Card>

          <label
            className="row"
            style={{ gap: 'var(--sp-md)', alignItems: 'flex-start', marginBottom: 'var(--sp-lg)', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={draft.agreed}
              onChange={(e) => set('agreed', e.target.checked)}
              style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--gold)' }}
            />
            <Text variant="bodySmall">
              I confirm the information above is accurate, and I consent to a consultation and any
              treatment agreed with the doctor.
            </Text>
          </label>

          <TextField
            label="Type your full name as signature"
            value={draft.signature}
            onChange={(v) => set('signature', v)}
            name="signature"
          />
        </>
      ) : null}

      {error ? (
        <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
          {error}
        </Text>
      ) : null}

      <div className="row" style={{ gap: 'var(--sp-md)', marginTop: 'var(--sp-lg)' }}>
        {step > 0 ? <Button title="Back" variant="outline" onClick={() => setStep((s) => s - 1)} /> : null}
        {step < 4 ? (
          <Button title="Next" onClick={next} />
        ) : (
          <Button title="Confirm booking" loading={saving} onClick={() => void submit()} />
        )}
      </div>
    </main>
  );
}
