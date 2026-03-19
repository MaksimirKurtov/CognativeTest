import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getLatestResultForTest, getUserProfile, initializeDatabase } from '@/lib/storage';
import { Screen } from '@/components/ui/screen';
import * as Haptics from 'expo-haptics';

export default function TestsScreen() {
  const [scores, setScores] = useState<Record<string, number | null>>({});

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const user = await getUserProfile();
      if (!user) return;
      const types = ['reaction_time','stroop','digit_span','word_recall','simon_says'];
      const entries = await Promise.all(
        types.map(async t => {
          const r = await getLatestResultForTest(user.id, t);
          return [t, r?.score ?? null] as const;
        })
      );
      setScores(Object.fromEntries(entries));
    })();
  }, []);

  const items = [
    { key: 'reaction_time', title: 'Reaction Time', desc: 'Measure your tap reaction speed' },
    { key: 'stroop', title: 'Stroop', desc: 'Name the ink color, not the word' },
    { key: 'digit_span', title: 'Digit Span', desc: 'Remember sequences of numbers' },
    { key: 'word_recall', title: 'Word Recall', desc: 'Recall words after short delay' },
    { key: 'simon_says', title: 'Simon Says', desc: 'Repeat the flashing sequence' },
  ];

  return (
    <Screen>
      <ThemedText type="title" style={styles.title}>Tests</ThemedText>
      <ThemedText style={styles.subtitle}>Choose a test to begin</ThemedText>
      {items.map(it => (
        <Link
          key={it.key}
          href={{ pathname: '/tests/[slug]', params: { slug: it.key } }}
          asChild>
          <Pressable onPress={() => Haptics.selectionAsync()} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }] }>
            <ThemedText style={styles.cardTitle}>{it.title}</ThemedText>
            <ThemedText style={styles.cardDesc}>{it.desc}</ThemedText>
            <ThemedText style={styles.cardMeta}>Latest: {scores[it.key] ?? '—'}</ThemedText>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 12,
  },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#1e1f22', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardDesc: { marginTop: 6, opacity: 0.9 },
  cardMeta: { marginTop: 6, fontSize: 12, opacity: 0.8 },
});
