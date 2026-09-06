import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Sparkles, X } from 'lucide-react';

/* ── Text ─────────────────────────────────────────────────────────────────
   Mirrors mobile/src/components/Text.tsx: a variant maps to a type style and
   a default colour role. */

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'overline';

const VARIANT_CLASS: Record<Variant, string> = {
  display: 't-display',
  h1: 't-h1',
  h2: 't-h2',
  h3: 't-h3',
  title: 't-title',
  body: 't-body',
  bodySmall: 't-body-sm',
  label: 't-label',
  caption: 't-caption',
  overline: 't-overline',
};

export function Text({
  variant = 'body',
  color,
  center,
  clamp,
  className = '',
  style,
  children,
  as,
}: {
  variant?: Variant;
  color?: string;
  center?: boolean;
  clamp?: 1 | 2;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3';
}) {
  const Tag = (as ??
    (variant === 'h1' ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'p')) as 'p';
  return (
    <Tag
      className={[
        VARIANT_CLASS[variant],
        center ? 'center' : '',
        clamp ? `clamp-${clamp}` : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...(color ? { color } : null), ...style }}
    >
      {children}
    </Tag>
  );
}

/* ── Button ───────────────────────────────────────────────────────────── */

export function Button({
  title,
  onClick,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  icon,
  type = 'button',
  size,
  className = '',
  style,
}: {
  title: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'light';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit';
  size?: 'sm';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={[
        'btn',
        `btn--${variant}`,
        fullWidth ? 'btn--full' : '',
        size === 'sm' ? 'btn--sm' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <span className="spinner spinner--sm" aria-label="Loading" />
      ) : (
        <>
          {icon}
          {title}
        </>
      )}
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */

export function Card({
  children,
  onClick,
  padded = true,
  elevated,
  className = '',
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  padded?: boolean;
  elevated?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = ['card', padded ? 'card--padded' : '', elevated ? 'card--elevated' : '', className]
    .filter(Boolean)
    .join(' ');
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────── */

export function Badge({
  label,
  tone = 'gold',
}: {
  label: string;
  tone?: 'gold' | 'rose' | 'sage' | 'neutral' | 'warning';
}) {
  return <span className={`badge badge--${tone}`}>{label}</span>;
}

/* ── TextField ────────────────────────────────────────────────────────── */

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  secure,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline,
  rows,
  inputMode,
  autoComplete,
  name,
  min,
  max,
}: {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  secure?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
  autoComplete?: string;
  name?: string;
  min?: string;
  max?: string;
}) {
  const [hidden, setHidden] = useState(!!secure);
  const id = name ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="field">
      {label ? (
        <label className="t-overline field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div
        className={[
          'field__box',
          multiline ? 'field__box--multiline' : '',
          error ? 'is-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {leftIcon ? <span className="field__icon">{leftIcon}</span> : null}
        {multiline ? (
          <textarea
            id={id}
            name={name}
            rows={rows ?? 4}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={secure ? (hidden ? 'password' : 'text') : type}
            value={value}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            min={min}
            max={max}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {secure ? (
          <button
            type="button"
            className="field__icon"
            aria-label={hidden ? 'Show password' : 'Hide password'}
            onClick={() => setHidden((h) => !h)}
          >
            {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="t-caption field__helper" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="t-caption field__helper">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon ?? <Sparkles size={28} />}</div>
      <Text variant="h3" center style={{ marginBottom: 'var(--sp-sm)' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" center>
          {subtitle}
        </Text>
      ) : null}
    </div>
  );
}

/* ── SectionHeader ────────────────────────────────────────────────────── */

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="section-head">
      <Text variant="h2">{title}</Text>
      {onSeeAll ? (
        <button type="button" onClick={onSeeAll} className="t-overline" style={{ color: 'var(--gold)' }}>
          See all
        </button>
      ) : null}
    </div>
  );
}

/* ── Spinner ──────────────────────────────────────────────────────────── */

export function Spinner({ center }: { center?: boolean }) {
  return <div className={`spinner${center ? ' spinner--center' : ''}`} role="status" aria-label="Loading" />;
}

/* ── Logo ─────────────────────────────────────────────────────────────── */

export function Logo({ size = 'medium', light }: { size?: 'medium' | 'large'; light?: boolean }) {
  const fs = size === 'large' ? 34 : 24;
  return (
    <div className={`logo${light ? ' logo--light' : ''}`}>
      <div className="logo__mark" style={{ fontSize: fs }}>
        Skin By
        <br />
        Dr. Fizza G
      </div>
      <div className="logo__sub">Dermatology</div>
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  // Escape closes; body scroll locks while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className="row row--between" style={{ marginBottom: 'var(--sp-lg)' }}>
            <Text variant="h3">{title}</Text>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/* ── Toasts ───────────────────────────────────────────────────────────── */

type Toast = { id: number; text: string; error?: boolean };
const ToastCtx = React.createContext<{ show: (text: string, error?: boolean) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const show = React.useCallback((text: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, text, error }]);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast${t.error ? ' toast--error' : ''}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Confirm dialog (replaces RN Alert.alert) ─────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <Text variant="h3" style={{ marginBottom: 'var(--sp-sm)' }}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" style={{ marginBottom: 'var(--sp-xl)' }}>
          {message}
        </Text>
      ) : null}
      <div className="row" style={{ gap: 'var(--sp-md)' }}>
        <Button title="Cancel" variant="outline" onClick={onCancel} />
        <Button
          title={confirmLabel}
          variant={destructive ? 'outline' : 'primary'}
          onClick={onConfirm}
          className={destructive ? 'danger-btn' : ''}
          style={destructive ? { color: 'var(--error)', borderColor: 'var(--error)' } : undefined}
        />
      </div>
    </Modal>
  );
}
