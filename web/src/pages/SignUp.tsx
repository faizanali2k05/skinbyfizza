import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Text, TextField } from '../components';
import { useI18n } from '../i18n';
import { ChevronLeft, Lock, Mail, MapPin, Phone, User } from '../layouts/icons';

export default function SignUp() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+92');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Karachi');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !password) {
      setError('Name, WhatsApp number and password are required.');
      return;
    }
    if (!/^\+\d{8,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter your WhatsApp number with country code, e.g. +92300…');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp({
        full_name: fullName.trim(),
        phone_e164: phone.replace(/\s/g, ''),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        password,
      });
      navigate('/app/discover', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="screen" style={{ maxWidth: 460 }}>
      <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
        <ChevronLeft size={24} />
      </button>

      <div style={{ margin: 'var(--sp-lg) 0 var(--sp-xl)' }}>
        <Text variant="h1">{t('auth.createAccount')}</Text>
        <Text variant="body" style={{ marginTop: 'var(--sp-xs)' }}>
          {t('auth.welcomeSubtitle')}
        </Text>
      </div>

      <form onSubmit={onSubmit}>
        <TextField
          label={t('auth.fullName')}
          placeholder="Aisha Khan"
          leftIcon={<User size={18} />}
          value={fullName}
          onChange={setFullName}
          autoComplete="name"
          name="full_name"
        />
        <TextField
          label={t('auth.whatsappNumber')}
          hint={t('auth.countryCodeHint')}
          placeholder="+92 300 1234567"
          leftIcon={<Phone size={18} />}
          value={phone}
          onChange={setPhone}
          inputMode="tel"
          autoComplete="tel"
          name="phone"
        />
        <TextField
          label="Email (optional)"
          placeholder="you@email.com"
          leftIcon={<Mail size={18} />}
          value={email}
          onChange={setEmail}
          type="email"
          inputMode="email"
          autoComplete="email"
          name="email"
        />
        <TextField
          label="City"
          placeholder="Karachi"
          leftIcon={<MapPin size={18} />}
          value={city}
          onChange={setCity}
          name="city"
        />
        <TextField
          label={t('auth.password')}
          placeholder="At least 6 characters"
          secure
          leftIcon={<Lock size={18} />}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          name="new-password"
        />

        {error ? (
          <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
            {error}
          </Text>
        ) : null}

        <Button title={t('auth.createAccount')} loading={loading} type="submit" />
      </form>

      <button
        type="button"
        className="row"
        style={{ justifyContent: 'center', width: '100%', padding: 'var(--sp-xl) 0', gap: 6 }}
        onClick={() => navigate('/sign-in', { replace: true })}
      >
        <Text variant="bodySmall" as="span">
          {t('auth.haveAccount')}
        </Text>
        <Text variant="bodySmall" as="span" color="var(--gold)">
          {t('auth.signIn')}
        </Text>
      </button>
    </main>
  );
}
