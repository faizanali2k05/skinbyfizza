import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { Procedure } from '../../api/types';
import { Button, Card, ConfirmDialog, EmptyState, Spinner, Text, useToast } from '../../components';
import { useQuery } from '../../hooks/useQuery';
import { Pencil, Plus, Sparkles, Trash2 } from '../../layouts/icons';

export default function StaffTreatments() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, refetch, setData } = useQuery(api.getProcedures, [], {
    refetchOnFocus: true,
  });
  const procedures = data ?? [];
  const [deleting, setDeleting] = useState<Procedure | null>(null);

  return (
    <main className="screen screen--wide">
      <div className="page-head">
        <Text variant="h1">Treatments</Text>
        <Button
          title="Add treatment"
          size="sm"
          fullWidth={false}
          icon={<Plus size={16} />}
          onClick={() => navigate('/staff/treatments/new')}
        />
      </div>

      {loading && !data ? (
        <Spinner center />
      ) : procedures.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No treatments yet"
          subtitle="Add your first treatment above."
        />
      ) : (
        procedures.map((p) => (
          <Card key={p.id} style={{ marginBottom: 'var(--sp-md)' }}>
            <div className="row" style={{ gap: 'var(--sp-lg)' }}>
              <span className="flex1">
                <Text variant="title">{p.title}</Text>
                <Text variant="caption">
                  {[p.category, p.duration, p.sessions ? `${p.sessions} sessions` : null, p.session_gap]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {p.description ? (
                  <Text variant="bodySmall" clamp={2} style={{ marginTop: 'var(--sp-sm)' }}>
                    {p.description}
                  </Text>
                ) : null}
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Edit"
                onClick={() => navigate(`/staff/treatments/${p.id}`, { state: { procedure: p } })}
              >
                <Pencil size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete"
                style={{ color: 'var(--error)' }}
                onClick={() => setDeleting(p)}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </Card>
        ))
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete treatment?"
        message={deleting?.title}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (!target) return;
          setData((list) => (list ?? []).filter((p) => p.id !== target.id));
          api.deleteProcedure(target.id).catch(() => {
            toast.show('Could not delete', true);
            refetch();
          });
        }}
      />
    </main>
  );
}
