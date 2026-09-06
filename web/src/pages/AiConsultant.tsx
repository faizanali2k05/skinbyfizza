import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { api } from '../api/services';
import { Spinner, Text } from '../components';
import { ArrowUp } from '../layouts/icons';

type Msg = { id: string; role: 'user' | 'ai'; text: string; pending?: boolean };

let seq = 0;
const uid = () => `m${++seq}`;

const GREETING =
  'Hi! I’m your skin consultant. Ask me about treatments, routines or your concerns.';

/** AI Skin Consultant. Arriving with ?topic= prefills the input (from a
 *  treatment sheet's "Ask the AI consultant"). */
export default function AiConsultant() {
  const [params, setParams] = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Msg[]>([{ id: uid(), role: 'ai', text: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const topic = params.get('topic');
  useEffect(() => {
    if (!topic) return;
    setInput(`Tell me about ${topic}`);
    setParams({}, { replace: true });
  }, [topic, setParams]);

  const scrollDown = () =>
    window.setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history = messages.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text },
      { id: uid(), role: 'ai', text: '', pending: true },
    ]);
    setInput('');
    setBusy(true);
    scrollDown();
    try {
      const res = await api.aiChat(text, history);
      setMessages((m) =>
        m.map((x) => (x.pending ? { ...x, text: res.reply || '…', pending: false } : x)),
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'The consultant is unavailable right now.';
      setMessages((m) => m.map((x) => (x.pending ? { ...x, text: msg, pending: false } : x)));
    } finally {
      setBusy(false);
      scrollDown();
    }
  };

  return (
    <main
      className="screen screen--flush screen--nopad-bottom"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      <div
        style={{
          padding: 'var(--sp-sm) var(--sp-xl) var(--sp-md)',
          borderBottom: '1px solid var(--divider)',
          flex: '0 0 auto',
        }}
      >
        <div className="row" style={{ gap: 'var(--sp-sm)' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: 'var(--sage)',
              display: 'inline-block',
            }}
          />
          <Text variant="h2">Skin Consultant</Text>
        </div>
        <Text variant="caption" style={{ marginTop: 2 }}>
          Private &amp; judgement-free — ask anything
        </Text>
      </div>

      <div className="chat" style={{ flex: 1, minHeight: 0 }}>
        <div className="chat__list" ref={listRef} aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bubble ${m.role === 'user' ? 'bubble--mine' : 'bubble--theirs'}`}
            >
              {m.pending ? <Spinner /> : m.text}
            </div>
          ))}
        </div>

        <div
          className="composer"
          style={{ marginBottom: 'calc(var(--tab-h) + env(safe-area-inset-bottom))' }}
        >
          <textarea
            value={input}
            placeholder="Type your message…"
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
            disabled={!input.trim() || busy}
            aria-label="Send"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
