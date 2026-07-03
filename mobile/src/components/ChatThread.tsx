import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { AppColors } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';
import { fonts } from '../theme/typography';
import { api } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Message } from '../api/types';

type Props = {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
  emptyHint?: string;
};

/** Live chat thread: polls every 4s while mounted and sends text messages. */
export function ChatThread({ conversationId, onConversationCreated, emptyHint }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const sinceRef = useRef<string | undefined>(undefined);

  useEffect(() => setConvId(conversationId), [conversationId]);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

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
  }, [convId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    sinceRef.current = undefined;
    poll();
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
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
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollDown}
        >
          {messages.length === 0 ? (
            <Text variant="caption" center style={styles.empty}>
              {emptyHint ?? 'No messages yet. Say hello!'}
            </Text>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text variant="body" color={mine ? colors.textInverse : colors.textPrimary}>
                    {m.body}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending) && styles.disabled]}
          onPress={send}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    list: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
    empty: { marginTop: spacing.huge },
    bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    mine: { alignSelf: 'flex-end', backgroundColor: c.gold, borderBottomRightRadius: 4 },
    theirs: {
      alignSelf: 'flex-start', backgroundColor: c.surface, borderBottomLeftRadius: 4,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border,
    },
    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider, backgroundColor: c.backgroundElevated,
    },
    input: {
      flex: 1, maxHeight: 120, minHeight: 44, color: c.textPrimary, fontFamily: fonts.regular,
      fontSize: 15, backgroundColor: c.surface, borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingHorizontal: spacing.lg, paddingTop: 12,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center' },
    disabled: { opacity: 0.4 },
  });
