import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { api } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Text, TextField, useToast } from '../components';
import { ChevronLeft, Mail, MapPin, Phone, User } from '../layouts/icons';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
      });
      await refreshUser();
      toast.show('Profile saved');
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
        <Text variant="h2">Edit profile</Text>
        <span style={{ width: 40 }} />
      </div>

      {user?.customer_type === 'vip' ? (
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          <Badge label="VIP customer" tone="gold" />
        </div>
      ) : null}

      <form onSubmit={save}>
        <TextField
          label="Full name"
          value={fullName}
          onChange={setFullName}
          leftIcon={<User size={18} />}
          name="full_name"
        />
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          inputMode="email"
          leftIcon={<Mail size={18} />}
          name="email"
        />
        <TextField
          label="City"
          value={city}
          onChange={setCity}
          leftIcon={<MapPin size={18} />}
          name="city"
        />

        <div className="field">
          <span className="t-overline field__label">WhatsApp number</span>
          <div className="field__box" style={{ opacity: 0.6 }}>
            <span className="field__icon">
              <Phone size={18} />
            </span>
            <input value={user?.phone_e164 ?? ''} readOnly disabled />
          </div>
          <p className="t-caption field__helper">
            Your WhatsApp number is your login ID — contact the clinic to change it.
          </p>
        </div>

        {error ? (
          <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
            {error}
          </Text>
        ) : null}

        <Button title="Save" loading={saving} type="submit" />
      </form>
    </main>
  );
}
