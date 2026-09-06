import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { Card, EmptyState, Spinner, Text } from '../components';
import { useQuery } from '../hooks/useQuery';
import { ChevronLeft, CloudOff, Stethoscope } from '../layouts/icons';

export function formatPKR(price?: number | null) {
  if (price == null) return null;
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(Number(price));
  } catch {
    return `Rs ${price}`;
  }
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(() => api.getPrescriptions(), []);
  const items = data ?? [];

  return (
    <main className="screen">
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <Text variant="h2">Prescriptions</Text>
        <span style={{ width: 40 }} />
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : error ? (
        <EmptyState icon={<CloudOff size={28} />} title="Couldn't load prescriptions" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Stethoscope size={28} />}
          title="No prescriptions yet"
          subtitle="Products & services from your doctor will appear here."
        />
      ) : (
        items.map((rx) => (
          <Card key={rx.id} style={{ marginBottom: 'var(--sp-md)' }}>
            <div className="row">
              <span className="flex1">
                <Text variant="title">{rx.item_name}</Text>
                {rx.notes ? (
                  <Text variant="bodySmall" style={{ marginTop: 2 }}>
                    {rx.notes}
                  </Text>
                ) : null}
                <Text variant="caption" style={{ marginTop: 'var(--sp-sm)' }}>
                  {new Date(rx.created_at).toLocaleDateString()}
                </Text>
              </span>
              {rx.price != null ? (
                <Text variant="h3" color="var(--gold)">
                  {formatPKR(rx.price)}
                </Text>
              ) : null}
            </div>
          </Card>
        ))
      )}
    </main>
  );
}
