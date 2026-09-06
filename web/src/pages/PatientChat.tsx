import { useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { Spinner, Text } from '../components';
import { ChatThread } from '../components/ChatThread';
import { useQuery } from '../hooks/useQuery';
import { ChevronLeft } from '../layouts/icons';

/**
 * The patient's single thread with the clinic. The API returns only their own
 * conversation from /chat/threads; if none exists yet, sending the first
 * message creates it (ChatThread handles the id hand-back).
 */
export default function PatientChat() {
  const navigate = useNavigate();
  const { data, loading } = useQuery(api.getThreads, []);
  const conversationId = data?.[0]?.id;

  return (
    <main
      className="screen screen--flush screen--nopad-bottom"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
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
          <Text variant="h3">Chat with the clinic</Text>
          <Text variant="caption">We usually reply within a few hours</Text>
        </span>
      </div>

      <div
        className="chat"
        style={{ flex: 1, minHeight: 0, marginBottom: 'calc(var(--tab-h) + env(safe-area-inset-bottom))' }}
      >
        {loading ? (
          <Spinner center />
        ) : (
          <ChatThread
            conversationId={conversationId}
            emptyHint="No messages yet. Say hello — the clinic will reply here."
          />
        )}
      </div>
    </main>
  );
}
