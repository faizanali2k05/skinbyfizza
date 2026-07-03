import { useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '../src/components';
import { useTheme, useThemedStyles } from '../src/theme/ThemeContext';
import { AppColors } from '../src/theme/palettes';
import { radius, spacing } from '../src/theme/spacing';
import { fonts } from '../src/theme/typography';
import { api } from '../src/api/services';
import { ApiError } from '../src/api/client';

type Msg = { id: string; role: 'user' | 'ai'; text: string; pending?: boolean };

let seq = 0;
const uid = () => `m${++seq}`;

export default function Chat() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: 'ai', text: 'Hi! I’m your skin consultant. Ask me about treatments, routines or your concerns.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const scrollDown = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Msg = { id: uid(), role: 'user', text };
    const history = messages.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    setMessages((m) => [...m, userMsg, { id: uid(), role: 'ai', text: '', pending: true }]);
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
      setMessages((m) =>
        m.map((x) => (x.pending ? { ...x, text: msg, pending: false } : x)),
      );
    } finally {
      setBusy(false);
      scrollDown();
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.aiDot} />
          <Text variant="h3">Skin Consultant</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollDown}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}
            >
              {m.pending ? (
                <ActivityIndicator color={colors.textMuted} size="small" />
              ) : (
                <Text
                  variant="body"
                  color={m.role === 'user' ? colors.textInverse : colors.textPrimary}
                >
                  {m.text}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={send}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || busy) && styles.sendDisabled]}
            onPress={send}
            disabled={!input.trim() || busy}
          >
            <Ionicons name="arrow-up" size={20} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage },
  list: { padding: spacing.xl, gap: spacing.md },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.gold, borderBottomRightRadius: 4 },
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, backgroundColor: colors.backgroundElevated,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44, color: colors.textPrimary, fontFamily: fonts.regular,
    fontSize: 15, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: 12,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
