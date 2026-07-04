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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="h2">Treatments</Text>
        <View style={{ width: 24 }} />
      </View>

      <Button
        title="Add treatment"
        icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
        onPress={() => router.push('/(staff)/procedure-form')}
        style={styles.add}
      />

      {loading && !data ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.huge }} />
      ) : procedures.length === 0 ? (
        <EmptyState icon="sparkles-outline" title="No treatments yet" subtitle="Add your first treatment above." />
      ) : (
        procedures.map((p) => (
          <Card key={p.id} style={styles.card} padded>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="title">{p.title}</Text>
                <Text variant="caption">{p.category}{p.duration ? ` · ${p.duration}` : ''}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => router.push({ pathname: '/(staff)/procedure-form', params: { id: p.id } })}
              >
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </Pressable>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  add: { marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  flex: { flex: 1 },
  del: { marginLeft: spacing.sm },
});
