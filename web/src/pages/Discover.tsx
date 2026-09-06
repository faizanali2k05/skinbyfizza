import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { Procedure } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, SectionHeader, Spinner, Text } from '../components';
import { useProcedureSheet } from '../components/ProcedureSheet';
import { heroImage, procedurePlaceholder } from '../data/decor';
import { useQuery } from '../hooks/useQuery';
import { useI18n } from '../i18n';
import { Bell, Sparkles } from '../layouts/icons';

export default function Discover() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: procedures, loading } = useQuery(api.getProcedures, [], { refetchOnFocus: true });
  const { open } = useProcedureSheet();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.goodMorning');
    if (h < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  }, [t]);

  const firstName = (user?.full_name ?? 'there').split(' ')[0];
  const list = procedures ?? [];
  const mostWanted = list.slice(0, 2);
  const trending = list.slice(2);

  const Tile = ({ p }: { p: Procedure }) => (
    <button type="button" className="tile" onClick={() => open(p)}>
      <img src={p.image_url || procedurePlaceholder} alt="" loading="lazy" />
      <div className="tile__text">
        <Text variant="title">{p.title}</Text>
        <Text variant="caption">{p.category}</Text>
      </div>
    </button>
  );

  return (
    <main className="screen">
      <div className="page-head">
        <div className="flex1">
          <Text variant="display">
            {greeting}, {firstName}!
          </Text>
          <Text variant="overline" style={{ marginTop: 4 }}>
            Karachi Clinic
          </Text>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate('/app/notifications')}
          aria-label={t('more.notifications')}
        >
          <Bell size={20} />
        </button>
      </div>

      <div className="hero">
        <img src={heroImage} alt="" />
        <div className="hero__text">
          <Text variant="h2">{t('home.freeConsult')}</Text>
          <Text variant="body" style={{ marginTop: 4 }}>
            {t('auth.welcomeSubtitle')}
          </Text>
        </div>
      </div>

      {loading && !procedures ? (
        <Spinner center />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No treatments yet"
          subtitle="The clinic hasn't published its catalogue yet."
        />
      ) : (
        <>
          <SectionHeader title={t('home.mostWanted')} onSeeAll={() => navigate('/app/treatments')} />
          <div className="tile-grid">
            {mostWanted.map((p) => (
              <Tile key={p.id} p={p} />
            ))}
          </div>

          {trending.length > 0 ? (
            <>
              <SectionHeader title={t('home.trending')} onSeeAll={() => navigate('/app/treatments')} />
              <div className="tile-grid">
                {trending.map((p) => (
                  <Tile key={p.id} p={p} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
