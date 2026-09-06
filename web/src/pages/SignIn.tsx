import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Text, TextField } from '../components';
import { useI18n } from '../i18n';
import { ChevronLeft, Lock, User } from '../layouts/icons';

export default function SignIn() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const u = await signIn(identifier, password);
      const staff = u.role === 'doctor' || u.role === 'manager';
      navigate(staff ? '/staff' : '/app/discover', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="screen" style={{ maxWidth: 460 }}>
      <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
        <ChevronLeft size={24} />
      </button>

      <div style={{ margin: 'var(--sp-lg) 0 var(--sp-xxl)' }}>
        <Text variant="h1">{t('auth.signIn')}</Text>
        <Text variant="body" style={{ marginTop: 'var(--sp-xs)' }}>
          {t('auth.forFasterCheckout')}
        </Text>
      </div>

      <form onSubmit={onSubmit}>
        <TextField
          label={t('auth.emailOrPhone')}
          placeholder="you@email.com  /  +92 3xx xxxxxxx"
          leftIcon={<User size={18} />}
          value={identifier}
          onChange={setIdentifier}
          autoComplete="username"
          name="identifier"
        />
        <TextField
          label={t('auth.password')}
          placeholder="••••••••"
          secure
          leftIcon={<Lock size={18} />}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          name="password"
        />

        {error ? (
          <Text variant="bodySmall" color="var(--error)" style={{ marginBottom: 'var(--sp-md)' }}>
            {error}
          </Text>
        ) : null}

        <Text variant="caption" style={{ marginBottom: 'var(--sp-xl)' }}>
          If the clinic registered you from WhatsApp, your password is your WhatsApp number.
        </Text>

        <Button title={t('auth.signIn')} loading={loading} type="submit" />
      </form>

      <button
        type="button"
        className="row"
        style={{ justifyContent: 'center', width: '100%', padding: 'var(--sp-xl) 0', gap: 6 }}
        onClick={() => navigate('/sign-up', { replace: true })}
      >
        <Text variant="bodySmall" as="span">
          {t('auth.noAccount')}
        </Text>
        <Text variant="bodySmall" as="span" color="var(--gold)">
          {t('auth.register')}
        </Text>
      </button>
    </main>
  );
}
