import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/services';
import { Thread } from '../../api/types';
import { usePermissions } from '../../auth/AuthContext';
import { Badge, Button, Text, useToast } from '../../components';
import { ChatThread } from '../../components/ChatThread';
import { ChevronLeft } from '../../layouts/icons';

/** Staff thread view — reply, promote to primary, and tag messages for the doctor. */
export default function StaffChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { triage } = usePermissions();
  const state = (useLocation().state ?? {}) as { thread?: Thread };
  const thread = state.thread;

  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [isPrimary, setIsPrimary] = useState(thread?.triage === 'primary');

  const toggle = (msgId: string) =>
    setSelected((s) => (s.includes(msgId) ? s.filter((x) => x !== msgId) : [...s, msgId]));

  const tag = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      await api.tagDoctor(selected);
      toast.show(`${selected.length} message(s) tagged for the doctor`);
      setSelected([]);
    } catch {
      toast.show('Could not tag messages', true);
    } finally {
      setBusy(false);
    }
  };

  const promote = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await api.setPrimary(id);
      setIsPrimary(true);
      toast.show('Thread sent to the doctor');
    } catch {
      toast.show('Could not promote thread', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="screen screen--flush screen--nopad-bottom"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 900 }}
    >
      <div
        className="row"
        style={{
          padding: 'var(--sp-md) var(--sp-xl)',
          borderBottom: '1px solid var(--divider)',
          flex: '0 0 auto',
        }}
      >
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <span className="flex1">
          <Text variant="h3">{thread?.full_name ?? 'Conversation'}</Text>
          <span className="row row--wrap" style={{ gap: 6, marginTop: 4 }}>
            {thread?.customer_type === 'vip' ? <Badge label="VIP" tone="gold" /> : null}
            {isPrimary ? <Badge label="Primary" tone="sage" /> : null}
            {thread?.platform === 'whatsapp' ? (
              <Text variant="caption" as="span" color="var(--sage)">
                replies go to WhatsApp
              </Text>
            ) : null}
          </span>
        </span>
      </div>

      {triage ? (
        <div
          className="row row--wrap"
          style={{
            gap: 'var(--sp-md)',
            padding: 'var(--sp-md) var(--sp-xl)',
            borderBottom: '1px solid var(--divider)',
            flex: '0 0 auto',
          }}
        >
          {!isPrimary ? (
            <Button
              title="Make primary"
              variant="outline"
              size="sm"
              fullWidth={false}
              loading={busy}
              onClick={() => void promote()}
            />
          ) : null}
          <Button
            title={selected.length ? `Tag ${selected.length} to doctor` : 'Tap a message to tag'}
            variant={selected.length ? 'primary' : 'outline'}
            size="sm"
            fullWidth={false}
            disabled={!selected.length || busy}
            onClick={() => void tag()}
          />
        </div>
      ) : null}

      <div className="chat" style={{ flex: 1, minHeight: 0 }}>
        <ChatThread
          conversationId={id}
          emptyHint="No messages in this thread yet."
          selectable={triage}
          selected={selected}
          onToggleSelect={toggle}
        />
      </div>
    </main>
  );
}
