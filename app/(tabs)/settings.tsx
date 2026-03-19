import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import Constants from 'expo-constants';
import { getUserProfile, initializeDatabase, setQuitDate } from '@/lib/storage';
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

export default function SettingsScreen() {
  const [quit, setQuit] = useState<string>('');

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const p = await getUserProfile();
      if (p?.smokingHistory.quitDate) {
        const d = new Date(p.smokingHistory.quitDate);
        setQuit(d.toISOString().slice(0, 10));
      }
    })();
  }, []);

  const saveQuit = async () => {
    if (!quit) return;
    const date = new Date(quit);
    if (isNaN(date.getTime())) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD');
      return;
    }
    await setQuitDate(date);
    Alert.alert('Saved', 'Quit date updated');
  };

  const resetData = async () => {
    Alert.alert('Reset all data?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        const db = await SQLite.openDatabaseAsync('cognitive_test.db');
        await db.execAsync(`DROP TABLE IF EXISTS questionnaire_responses; DROP TABLE IF EXISTS test_results; DROP TABLE IF EXISTS test_sessions; DROP TABLE IF EXISTS user_profile;`);
        await initializeDatabase();
        Alert.alert('Done', 'All data reset');
      }}
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Settings</ThemedText>
      <ThemedText style={styles.subtitle}>Manage your app preferences and data</ThemedText>
      <Link href="/(tabs)/setup" style={styles.link}>Edit Setup</Link>

      <ThemedView style={styles.section} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.sectionTitle}>Quit Date</ThemedText>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput value={quit} onChangeText={setQuit} placeholder="YYYY-MM-DD" placeholderTextColor="#888" style={styles.input} />
          <ThemedText onPress={saveQuit} style={styles.link}>Save</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <ThemedText style={{ opacity: 0.8 }}>Daily reminders (coming soon)</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.sectionTitle}>Data</ThemedText>
        <ThemedText onPress={resetData} style={[styles.link, { color: '#ff6b6b' }]}>Reset all data</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <ThemedText>Version: {Constants?.expoConfig?.version ?? '1.0.0'}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    color: '#4da3ff'
  },
  section: { marginTop: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  input: { padding: 10, backgroundColor: '#1e1f22', borderRadius: 8, color: '#fff', minWidth: 140 },
});
