import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTestSessions, getUserProfile, initializeDatabase } from '@/lib/storage';
import type { TestSession } from '@/types';

export default function ResultsScreen() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [quitDate, setQuitDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const p = await getUserProfile();
      if (!p) return;
      const list = await getTestSessions(p.id);
      setSessions(list);
      setQuitDate(p.smokingHistory.quitDate);
    })();
  }, []);

  const { baseline, recovery } = useMemo(() => {
    const base: TestSession[] = [];
    const rec: TestSession[] = [];
    for (const s of sessions) {
      const t = s.completedAt ?? s.startedAt;
      if (quitDate && t >= quitDate) rec.push(s); else base.push(s);
    }
    return { baseline: base, recovery: rec };
  }, [sessions, quitDate]);

  const tests = ['reaction_time','stroop','digit_span','word_recall','simon_says'] as const;

  function avgScore(list: TestSession[], testType: string) {
    const vals = list.flatMap(s => s.tests.filter(t => t.testType === testType).map(t => t.score));
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  function latestScore(testType: string) {
    for (const s of sessions) {
      const test = s.tests.find(t => t.testType === testType);
      if (test) return test.score;
    }
    return null;
  }

  function usedVsNot(list: TestSession[], testType: string) {
    const used = list.filter(s => s.questionnaire?.marijuanaLast24h);
    const not = list.filter(s => s.questionnaire && !s.questionnaire.marijuanaLast24h);
    return { used: avgScore(used, testType), not: avgScore(not, testType) };
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Results</ThemedText>
      <ThemedText style={styles.subtitle}>Baseline vs recovery and recent activity</ThemedText>

      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.cardTitle}>Averages</ThemedText>
        {tests.map(t => {
          const base = avgScore(baseline, t);
          const rec = avgScore(recovery, t);
          if (base === null && rec === null) return null;
          const betterLower = t === 'reaction_time';
          const trend = base !== null && rec !== null ? (betterLower ? (base - rec) : (rec - base)) : null;
          return (
            <View key={t} style={styles.row}> 
              <ThemedText style={styles.rowLabel}>{labelForTest(t)}</ThemedText>
              <ThemedText style={styles.rowValue}>{base ?? '—'} → {rec ?? '—'} {trend !== null ? trendArrow(trend) : ''}</ThemedText>
            </View>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.cardTitle}>Latest Scores</ThemedText>
        {tests.map(t => (
          <View key={t} style={styles.row}>
            <ThemedText style={styles.rowLabel}>{labelForTest(t)}</ThemedText>
            <ThemedText style={styles.rowValue}>{latestScore(t) ?? '—'}</ThemedText>
          </View>
        ))}
      </ThemedView>

      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.cardTitle}>Used in last 24h</ThemedText>
        {tests.map(t => {
          const { used, not } = usedVsNot(sessions, t);
          if (used === null && not === null) return null;
          return (
            <View key={t} style={styles.row}>
              <ThemedText style={styles.rowLabel}>{labelForTest(t)}</ThemedText>
              <ThemedText style={styles.rowValue}>{used ?? '—'} vs {not ?? '—'}</ThemedText>
            </View>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.cardTitle}>Recent Sessions</ThemedText>
        {sessions.slice(0, 8).map(s => (
          <View key={s.id} style={styles.row}>
            <ThemedText style={styles.rowLabel}>{new Date(s.startedAt).toLocaleDateString()}</ThemedText>
            <ThemedText style={styles.rowValue}>{s.tests.length} tests • {s.questionnaire?.marijuanaLast24h ? 'Used' : 'No use'}</ThemedText>
          </View>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function labelForTest(key: string) {
  switch (key) {
    case 'reaction_time': return 'Reaction Time';
    case 'stroop': return 'Stroop';
    case 'digit_span': return 'Digit Span';
    case 'word_recall': return 'Word Recall';
    case 'simon_says': return 'Simon Says';
    default: return key;
  }
}

function trendArrow(delta: number) {
  if (delta > 0) return '↑';
  if (delta < 0) return '↓';
  return '→';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    },
  card: { marginTop: 16, padding: 16, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
});
