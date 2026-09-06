import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Repeat, Sparkles, X } from 'lucide-react';
import { Procedure } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { procedurePlaceholder } from '../data/decor';
import { Badge, Button, Text } from './index';

type Ctx = { open: (p: Procedure) => void };
const ProcedureSheetContext = createContext<Ctx | null>(null);

/** Global treatment-detail sheet any screen can trigger — same as the app. */
export function ProcedureSheetProvider({ children }: { children: React.ReactNode }) {
  const [proc, setProc] = useState<Procedure | null>(null);
  return (
    <ProcedureSheetContext.Provider value={{ open: setProc }}>
      {children}
      <ProcedureSheet procedure={proc} onClose={() => setProc(null)} />
    </ProcedureSheetContext.Provider>
  );
}

export function useProcedureSheet(): Ctx {
  const c = useContext(ProcedureSheetContext);
  if (!c) throw new Error('useProcedureSheet must be used within ProcedureSheetProvider');
  return c;
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="meta">
      <span style={{ color: 'var(--gold)' }}>{icon}</span>
      <Text variant="caption">{label}</Text>
      <Text variant="label">{value}</Text>
    </div>
  );
}

function ProcedureSheet({
  procedure: p,
  onClose,
}: {
  procedure: Procedure | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!p) return;
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
  }, [p, onClose]);

  if (!p) return null;

  const askAi = () => {
    onClose();
    navigate(isAuthenticated ? `/app/ai?topic=${encodeURIComponent(p.title)}` : '/sign-in');
  };

  const book = () => {
    onClose();
    navigate(isAuthenticated ? `/app/book/${p.id}` : '/sign-in');
  };

  return (
    <div className="backdrop backdrop--sheet" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__hero">
          <img src={p.image_url || procedurePlaceholder} alt="" />
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
          <div className="sheet__hero-text">
            {p.category ? <Badge label={p.category} tone="gold" /> : null}
            <Text variant="h1">{p.title}</Text>
          </div>
        </div>

        <div className="sheet__body">
          {p.description ? (
            <Text variant="body" style={{ marginBottom: 'var(--sp-lg)' }}>
              {p.description}
            </Text>
          ) : null}

          <div className="meta-grid">
            {p.duration ? <Meta icon={<Clock size={16} />} label="Duration" value={p.duration} /> : null}
            {p.sessions ? (
              <Meta icon={<Repeat size={16} />} label="Sessions" value={String(p.sessions)} />
            ) : null}
            {p.session_gap ? (
              <Meta icon={<Calendar size={16} />} label="Gap" value={p.session_gap} />
            ) : null}
          </div>

          {p.key_features && p.key_features.length > 0 ? (
            <>
              <Text variant="h3" style={{ marginTop: 'var(--sp-xxl)', marginBottom: 'var(--sp-md)' }}>
                Highlights
              </Text>
              {p.key_features.map((f) => (
                <div key={f} className="feature">
                  <CheckCircle2 size={18} style={{ color: 'var(--sage)', flex: '0 0 auto' }} />
                  <Text variant="body" color="var(--text-primary)">
                    {f}
                  </Text>
                </div>
              ))}
            </>
          ) : null}
        </div>

        <div className="sheet__cta stack">
          <Button title={isAuthenticated ? 'Book this treatment' : 'Log in to book'} onClick={book} />
          <Button
            title={isAuthenticated ? 'Ask the AI consultant' : 'Log in to ask'}
            variant="outline"
            icon={<Sparkles size={17} />}
            onClick={askAi}
          />
        </div>
      </div>
    </div>
  );
}
