import { useMemo, useState } from 'react';
import { api } from '../api/services';
import { EmptyState, Spinner, Text } from '../components';
import { useProcedureSheet } from '../components/ProcedureSheet';
import { tileFor } from '../data/decor';
import { useQuery } from '../hooks/useQuery';
import { useI18n } from '../i18n';
import { Search, Sparkles, X } from '../layouts/icons';

export default function Treatments() {
  const { t } = useI18n();
  const { open } = useProcedureSheet();
  const { data: procedures, loading } = useQuery(api.getProcedures, [], { refetchOnFocus: true });

  const [active, setActive] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    (procedures ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [procedures]);

  const needle = q.trim().toLowerCase();
  const filtered = (procedures ?? []).filter(
    (p) =>
      (!active || p.category === active) &&
      (!needle ||
        p.title.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle)),
  );

  return (
    <main className="screen">
      <div className="page-head">
        <Text variant="h1">{t('nav.categories')}</Text>
        <button
          type="button"
          className="icon-btn"
          onClick={() => {
            setSearching((s) => !s);
            setQ('');
          }}
          aria-label={t('common.search')}
        >
          {searching ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {searching ? (
        <div className="searchbar">
          <Search size={16} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
          <input
            autoFocus
            value={q}
            placeholder="Search treatments…"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      ) : null}

      {categories.length > 0 ? (
        <div className="chips">
          <button
            type="button"
            className={`pill${!active ? ' is-active' : ''}`}
            onClick={() => setActive(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`pill${active === c ? ' is-active' : ''}`}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {loading && !procedures ? (
        <Spinner center />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No treatments yet"
          subtitle="The clinic hasn't added treatments in this category."
        />
      ) : (
        <div style={{ marginTop: 'var(--sp-sm)' }}>
          {filtered.map((p) => (
            <button key={p.id} type="button" className="list-row" onClick={() => open(p)}>
              <span className="flex1">
                <Text variant="h3" style={{ fontWeight: 500 }}>
                  {p.title}
                </Text>
                <Text variant="caption">{p.category}</Text>
              </span>
              <img
                className="list-row__thumb"
                src={p.image_url || tileFor(p.category)}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
