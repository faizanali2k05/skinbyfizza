import React, { createContext, useContext, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { Badge } from './Badge';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { AppColors } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';
import { useAuth } from '../auth/AuthContext';
import { procedurePlaceholder } from '../data/decor';
import { Procedure } from '../api/types';

type Ctx = { open: (p: Procedure) => void };
const ProcedureSheetContext = createContext<Ctx | null>(null);

/** Provides a global treatment-detail popup any screen can trigger. */
export function ProcedureSheetProvider({ children }: { children: React.ReactNode }) {
  const [proc, setProc] = useState<Procedure | null>(null);
  return (
    <ProcedureSheetContext.Provider value={{ open: setProc }}>
      {children}
      <ProcedureSheet procedure={proc} onClose={() => setProc(null)} />
    </ProcedureSheetContext.Provider>
  );
}

export function useProcedureSheet(): Ctx {
  const c = useContext(ProcedureSheetContext);
  if (!c) throw new Error('useProcedureSheet must be used within ProcedureSheetProvider');
  return c;
}

function Meta({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={colors.gold} />
      <Text variant="caption">{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

function ProcedureSheet({ procedure, onClose }: { procedure: Procedure | null; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const p = procedure;

  const book = () => {
    onClose();
    if (isAuthenticated && p) router.push({ pathname: '/book/[id]', params: { id: p.id } });
    else router.push('/(auth)/sign-in');
  };

  return (
    <Modal visible={!!p} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          {p ? (
            <>
              <View style={styles.hero}>
                <Image source={p.image_url || procedurePlaceholder} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
                <View style={styles.heroText}>
                  {p.category ? <Badge label={p.category} tone="gold" /> : null}
                  <Text variant="h1" style={styles.heroTitle}>{p.title}</Text>
                </View>
              </View>

              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                {p.description ? <Text variant="body" style={styles.desc}>{p.description}</Text> : null}

                <View style={styles.metaGrid}>
                  {p.duration ? <Meta icon="time-outline" label="Duration" value={p.duration} /> : null}
                  {p.sessions ? <Meta icon="repeat-outline" label="Sessions" value={String(p.sessions)} /> : null}
                  {p.session_gap ? <Meta icon="calendar-outline" label="Gap" value={p.session_gap} /> : null}
                </View>

                {p.key_features && p.key_features.length > 0 ? (
                  <>
                    <Text variant="h3" style={styles.section}>Highlights</Text>
                    {p.key_features.map((f) => (
                      <View key={f} style={styles.feature}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.sage} />
                        <Text variant="body" color={colors.textPrimary}>{f}</Text>
                      </View>
                    ))}
                  </>
                ) : null}
              </ScrollView>

              <View style={styles.cta}>
                <Button title={isAuthenticated ? 'Book now' : 'Log in to book'} onPress={book} />
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
    sheet: {
      maxHeight: '88%',
      backgroundColor: c.backgroundElevated,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glassBorder,
      overflow: 'hidden',
    },
    grabber: {
      width: 40, height: 4, borderRadius: 2, backgroundColor: c.textMuted,
      alignSelf: 'center', marginTop: spacing.md, opacity: 0.5, zIndex: 2,
    },
    hero: { height: 220, justifyContent: 'flex-end', marginTop: -spacing.md },
    close: {
      position: 'absolute', top: spacing.lg, right: spacing.lg, width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
    },
    heroText: { padding: spacing.xl, gap: spacing.sm },
    heroTitle: { marginTop: 2 },
    body: { paddingHorizontal: spacing.xl },
    bodyContent: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
    desc: { marginBottom: spacing.lg },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    meta: {
      minWidth: 90, gap: 2, backgroundColor: c.glassTint, borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.glassBorder, padding: spacing.md,
    },
    section: { marginTop: spacing.xxl, marginBottom: spacing.md },
    feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    cta: {
      padding: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider,
    },
  });
