import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, PlusCircle } from 'lucide-react';
import { api } from '../api/services';
import { Message } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Spinner, Text, useToast } from './index';

type Props = {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
  emptyHint?: string;
  /** Staff-only: select messages to tag for the doctor. */
  selectable?: boolean;
  selected?: string[];
  onToggleSelect?: (id: string) => void;
};

const POLL_MS = 4000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // API accepts a 12MB JSON body; base64 inflates ~33%

/**
 * Live chat thread — polls every 4s while the tab is visible (the realtime
 * substitute; the API has no websockets). Cursor is the newest created_at we
 * hold, so swapping in SSE later touches only this file.
 */
export function ChatThread({
  conversationId,
  onConversationCreated,
  emptyHint,
  selectable,
  selected = [],
  onToggleSelect,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sinceRef = useRef<string | undefined>(undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => setConvId(conversationId), [conversationId]);

  const scrollDown = useCallback(() => {
    window.setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, []);

  const poll = useCallback(async () => {
    if (!convId) {
      setLoading(false);
      return;
    }
    try {
      const fresh = await api.pollMessages(convId, sinceRef.current);
      if (fresh.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...fresh.filter((m) => !seen.has(m.id))];
        });
        sinceRef.current = fresh[fresh.length - 1].created_at;
        scrollDown();
      }
    } catch {
      // transient — keep polling
    } finally {
      setLoading(false);
    }
  }, [convId, scrollDown]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    sinceRef.current = undefined;
    void poll();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void poll();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [poll]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setInput('');
    setSending(true);
    try {
      const msg = await api.sendMessage(body, convId);
      setMessages((prev) => [...prev, msg]);
      sinceRef.current = msg.created_at;
      if (!convId && msg.conversation_id) {
        setConvId(msg.conversation_id);
        onConversationCreated?.(msg.conversation_id);
      }
      scrollDown();
    } catch {
      setInput(body); // put the text back so nothing is lost
      toast.show('Could not send — try again', true);
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.show('Image is too large (max 6 MB)', true);
      return;
    }
    setSending(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      const msg = await api.sendMessage(input.trim(), convId, {
        base64,
        mime: file.type || 'image/jpeg',
      });
      setMessages((prev) => [...prev, msg]);
      sinceRef.current = msg.created_at;
      setInput('');
      if (!convId && msg.conversation_id) {
        setConvId(msg.conversation_id);
        onConversationCreated?.(msg.conversation_id);
      }
      scrollDown();
    } catch {
      toast.show('Could not send the image', true);
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="chat">
      {loading ? (
        <Spinner center />
      ) : (
        <div className="chat__list" ref={listRef}>
          {messages.length === 0 ? (
            <Text variant="caption" center style={{ marginTop: 'var(--sp-huge)' }}>
              {emptyHint ?? 'No messages yet. Say hello!'}
            </Text>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              const isSelected = selected.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={[
                    'bubble',
                    mine ? 'bubble--mine' : 'bubble--theirs',
                    m.tagged_to_doctor || isSelected ? 'bubble--tagged' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={selectable && !mine ? () => onToggleSelect?.(m.id) : undefined}
                  style={selectable && !mine ? { cursor: 'pointer' } : undefined}
                >
                  {selectable && !mine ? (
                    <div className="bubble__select">
                      <input type="checkbox" readOnly checked={isSelected} />
                      {m.tagged_to_doctor ? 'tagged to doctor' : 'tap to tag'}
                    </div>
                  ) : null}
                  {m.type === 'image' && m.media_url ? (
                    <img src={m.media_url} alt={m.body || 'Attachment'} loading="lazy" />
                  ) : null}
                  {m.body ? <span>{m.body}</span> : null}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="composer">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
          }}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          aria-label="Attach image"
        >
          <PlusCircle size={26} />
        </button>
        <textarea
          value={input}
          placeholder="Type a message…"
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          className="send-btn"
          onClick={() => void send()}
          disabled={!input.trim() || sending}
          aria-label="Send"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
}
