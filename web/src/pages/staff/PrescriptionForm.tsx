import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { api } from '../../api/services';
import { User } from '../../api/types';
import { Button, Card, Text, TextField, useToast } from '../../components';
import { ChevronLeft } from '../../layouts/icons';

/** Doctor adds a product OR service (e.g. Botox) with its price. */
export default function StaffPrescriptionForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const state = (useLocation().state ?? {}) as { user?: User };
  const userId = params.get('user') ?? state.user?.id ?? '';

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('No patient selected — open this from a patient record.');
      return;
    }
    if (!itemName.trim()) {
      setError('Enter the product or service name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createPrescription({
        user_id: userId,
        item_name: itemName.trim(),
        price: price ? Number(price) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.show('Prescription added');
      navigate(-1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="screen" style={{ maxWidth: 560 }}>
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Add prescription</Text>
        <span style={{ width: 40 }} />
      </div>

      {state.user ? (
        <Card style={{ marginBottom: 'var(--sp-lg)' }}>
          <Text variant="overline">Patient</Text>
          <Text variant="title">{state.user.full_name}</Text>
          <Text variant="caption">{state.user.phone_e164}</Text>
        </Card>
      ) : null}

      <form onSubmit={save}>
        <TextField
          label="Product or service"
          value={itemName}
          onChange={setItemName}
          name="item_name"
          hint="A product, or a service such as Botox."
        />
        <TextField
          label="Price (PKR)"
          value={price}
          onChange={setPrice}
          inputMode="decimal"
          name="price"
        />
        <TextField label="Notes" value={notes} onChange={setNotes} multiline rows={3} name="notes" />

        {error ? (
          <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
            {error}
          </Text>
        ) : null}

        <Button title="Save prescription" loading={saving} type="submit" />
      </form>
    </main>
  );
}
