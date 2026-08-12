import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, EmptyState } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { useQuery } from '../../src/hooks/useQuery';
import { api } from '../../src/api/services';

export default function StaffProcedures() {
  const router = useRouter();
  const { data, loading, refetch, setData } = useQuery(api.getProcedures, [], { refetchOnFocus: true });
  const procedures = data ?? [];
  const { colors } = useTheme();

  const remove = (id: string, title: string) =>
    Alert.alert('Delete treatment?', title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // optimistic: drop it immediately, revert on failure
          setData((list) => (list ?? []).filter((p) => p.id !== id));
          api.deleteProcedure(id).catch(() => {
            Alert.alert('Could not delete');
            refetch();
          });
        },
      },
    ]);

  return (
    <Screen scroll padded refreshing={loading} onRefresh={refetch}>
      <Text variant="h1" style={styles.title}>Treatments</Text>

      <Button
        title="Add treatment"
        icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
        onPress={() => router.push('/staff-procedure-form')}
        style={styles.add}
      />

      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : procedures.length === 0 ? (
        <EmptyState icon="sparkles-outline" title="No treatments yet" subtitle="Add your first treatment above." />
      ) : (
        procedures.map((p) => (
          <Card
            key={p.id}
            style={styles.card}
            padded
            onPress={() => router.push({ pathname: '/staff-procedure-form', params: { id: p.id } })}
          >
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="title">{p.title}</Text>
                <Text variant="caption">{p.category}{p.duration ? ` · ${p.duration}` : ''}</Text>
                {p.description ? (
                  <Text variant="bodySmall" numberOfLines={2} style={styles.desc}>{p.description}</Text>
                ) : null}
              </View>
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
              <Pressable hitSlop={8} onPress={() => remove(p.id, p.title)} style={styles.del}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.sm, marginBottom: spacing.lg },
  add: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  flex: { flex: 1 },
  desc: { marginTop: spacing.sm },
  del: { marginLeft: spacing.sm },
});
