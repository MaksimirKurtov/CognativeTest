import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Cognitive Test</ThemedText>
        <ThemedText style={styles.subtitle}>
          Track your cognitive performance and quitting journey
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        
        <Link href="/(tabs)/session" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <IconSymbol name="play.circle.fill" size={32} color="#007AFF" />
            <ThemedText style={styles.actionTitle}>Start Session</ThemedText>
            <ThemedText style={styles.actionDescription}>Begin cognitive testing</ThemedText>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/setup" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <IconSymbol name="person.crop.circle.fill" size={32} color="#34C759" />
            <ThemedText style={styles.actionTitle}>Setup Profile</ThemedText>
            <ThemedText style={styles.actionDescription}>Configure your profile</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <ThemedText type="subtitle">Recent Activity</ThemedText>
        <ThemedView style={styles.statRow}>
          <ThemedText style={styles.statLabel}>Last Session:</ThemedText>
          <ThemedText style={styles.statValue}>Not started yet</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statRow}>
          <ThemedText style={styles.statLabel}>Total Sessions:</ThemedText>
          <ThemedText style={styles.statValue}>0</ThemedText>
        </ThemedView>
      </ThemedView>
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
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: '#f8f9fa',
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
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
