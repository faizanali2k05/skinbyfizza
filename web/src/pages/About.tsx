import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { Card, Logo, Text } from '../components';
import { useQuery } from '../hooks/useQuery';
import { ChevronLeft, Clock, Instagram, MapPin, Phone } from '../layouts/icons';

export default function About() {
  const navigate = useNavigate();
  const { data } = useQuery(api.getAbout, []);

  const description =
    data?.about?.description ??
    'Expert dermatology & aesthetic care — personalised treatments, delivered with a gentle, professional touch.';
  const locations = data?.locations ?? [];
  const instagram = data?.about?.instagram;
  const phone = data?.about?.phone;

  return (
    <main className="screen">
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">About</Text>
        <span style={{ width: 40 }} />
      </div>

      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 'var(--sp-lg)' }}>
        <Logo size="large" />
      </div>
      <Text variant="body" center style={{ marginBottom: 'var(--sp-xl)' }}>
        {description}
      </Text>

      {locations.map((loc) => (
        <Card key={loc.id} style={{ marginBottom: 'var(--sp-md)' }}>
          <div className="row" style={{ gap: 'var(--sp-lg)' }}>
            <MapPin size={20} style={{ color: 'var(--gold)', flex: '0 0 auto' }} />
            <span className="flex1">
              <Text variant="overline">{loc.name}</Text>
              <Text variant="body" color="var(--text-primary)">
                {[loc.address, loc.city].filter(Boolean).join(', ') || loc.city || '—'}
              </Text>
              {loc.phone ? <Text variant="caption">{loc.phone}</Text> : null}
            </span>
          </div>
        </Card>
      ))}

      <Card style={{ marginBottom: 'var(--sp-md)' }}>
        <div className="row" style={{ gap: 'var(--sp-lg)' }}>
          <Clock size={20} style={{ color: 'var(--gold)', flex: '0 0 auto' }} />
          <span className="flex1">
            <Text variant="overline">Hours</Text>
            <Text variant="body" color="var(--text-primary)">
              Mon–Sat, 11:00 AM – 8:00 PM
            </Text>
          </span>
        </div>
      </Card>

      <Text variant="h3" style={{ marginTop: 'var(--sp-xl)', marginBottom: 'var(--sp-md)' }}>
        Get in touch
      </Text>
      <div className="row" style={{ gap: 'var(--sp-md)' }}>
        {instagram ? (
          <a
            className="btn btn--outline btn--full"
            href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Instagram size={20} style={{ color: 'var(--gold)' }} />
            Instagram
          </a>
        ) : null}
        {phone ? (
          <a className="btn btn--outline btn--full" href={`tel:${phone}`}>
            <Phone size={20} style={{ color: 'var(--gold)' }} />
            Call
          </a>
        ) : null}
      </div>
    </main>
  );
}
