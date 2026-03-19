import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import { getLatestSession, getTestSessions, getUserProfile, initializeDatabase, setQuitDate } from '@/lib/storage';
import { Screen } from '@/components/ui/screen';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [profile, setProfile] = useState<any | null>(null);
  const [latest, setLatest] = useState<any | null>(null);
  const [sessionsLast7, setSessionsLast7] = useState<number>(0);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const p = await getUserProfile();
      setProfile(p);
      if (p) {
        const all = await getTestSessions(p.id);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setSessionsLast7(all.filter(s => new Date(s.startedAt).getTime() >= sevenDaysAgo).length);
        const l = await getLatestSession(p.id);
        setLatest(l);
      }
    })();
  }, []);

  const mode = useMemo(() => {
    if (!profile) return '—';
    if (profile?.smokingHistory?.quitDate) return 'recovery mode';
    switch (profile?.smokingHistory?.goal) {
      case 'preparing_to_quit':
        return 'preparing to quit';
      case 'already_quitting':
        return 'recovery mode';
      default:
        return 'pre-quit baseline';
    }
  }, [profile]);

  const daysSinceQuit = useMemo(() => {
    const q = profile?.smokingHistory?.quitDate as Date | undefined;
    if (!q) return null;
    const ms = Date.now() - new Date(q).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }, [profile]);

  const weeksInto = profile?.smokingHistory?.weeksSmoking;

  return (
    <Screen>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Cognitive Test</ThemedText>
        <ThemedText style={styles.subtitle}>Track your cognitive performance and quitting journey</ThemedText>
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>

        <Link href="/(tabs)/session" asChild>
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <ThemedView style={styles.actionCard} lightColor="#f1f3f5" darkColor="#1e1f22">
              <IconSymbol name="play.circle.fill" size={32} color="#4da3ff" />
              <ThemedText style={styles.actionTitle}>Start Session</ThemedText>
              <ThemedText style={styles.actionDescription}>Begin cognitive testing</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/tests" asChild>
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <ThemedView style={styles.actionCard} lightColor="#f1f3f5" darkColor="#1e1f22">
              <IconSymbol name="brain.head.profile" size={32} color="#ffcc66" />
              <ThemedText style={styles.actionTitle}>Open Tests</ThemedText>
              <ThemedText style={styles.actionDescription}>Run individual tests</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/setup" asChild>
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <ThemedView style={styles.actionCard} lightColor="#f1f3f5" darkColor="#1e1f22">
              <IconSymbol name="person.crop.circle.fill" size={32} color="#2ad36b" />
              <ThemedText style={styles.actionTitle}>Setup Profile</ThemedText>
              <ThemedText style={styles.actionDescription}>Configure your profile</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </Link>
      </ThemedView>

      <ThemedView style={styles.statsContainer} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText type="subtitle">Status</ThemedText>
        <ThemedView style={styles.statRow}>
          <ThemedText style={styles.statLabel}>Current mode:</ThemedText>
          <ThemedText style={styles.statValue}>{mode}</ThemedText>
        </ThemedView>
        {daysSinceQuit === null ? (
          <ThemedView style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Weeks into smoking:</ThemedText>
            <ThemedText style={styles.statValue}>{weeksInto ?? '—'}</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Days since quitting:</ThemedText>
            <ThemedText style={styles.statValue}>{daysSinceQuit}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.statsContainer} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText type="subtitle">Recent Activity</ThemedText>
        <ThemedView style={styles.statRow}>
          <ThemedText style={styles.statLabel}>Last Session:</ThemedText>
          <ThemedText style={styles.statValue}>{latest ? new Date(latest.startedAt).toLocaleDateString() : '—'}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statRow}>
          <ThemedText style={styles.statLabel}>Last 7 days:</ThemedText>
          <ThemedText style={styles.statValue}>{sessionsLast7} sessions</ThemedText>
        </ThemedView>
      </ThemedView>

      {latest?.questionnaire && (
        <ThemedView style={styles.statsContainer} lightColor="#f1f3f5" darkColor="#1e1f22">
          <ThemedText type="subtitle">Quick Status</ThemedText>
          <View style={styles.quickGrid}>
            <QuickCard label="Mood" value={String(latest.questionnaire.mood)} />
            <QuickCard label="Clarity" value={String(latest.questionnaire.mentalClarity)} />
            <QuickCard label="Sleep (h)" value={String(latest.questionnaire.sleepHours)} />
            <QuickCard label="Used 24h" value={latest.questionnaire.marijuanaLast24h ? 'Yes' : 'No'} />
          </View>
        </ThemedView>
      )}

      {!profile?.smokingHistory?.quitDate && (
        <Pressable
          onPress={async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await setQuitDate(new Date());
            const updated = await getUserProfile();
            setProfile(updated);
          }}
          style={({ pressed }) => [styles.quitBtn, pressed && { opacity: 0.9 }]}>
          <ThemedText style={styles.quitBtnText}>Started Quitting</ThemedText>
        </Pressable>
      )}

    </Screen>
  );
}

function QuickCard({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.quickCard} lightColor="#f1f3f5" darkColor="#1e1f22">
      <ThemedText style={styles.quickCardLabel}>{label}</ThemedText>
      <ThemedText style={styles.quickCardValue}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    padding: 20,
    borderRadius: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  quickCard: {
    padding: 12,
    borderRadius: 10,
    width: '47%'
  },
  quickCardLabel: { fontSize: 12, opacity: 0.8 },
  quickCardValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quitBtn: {
    marginTop: 16,
    backgroundColor: '#2d6cdf',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
