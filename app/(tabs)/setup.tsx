import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getUserProfile, initializeDatabase, upsertUserProfile, markSetupComplete } from '@/lib/storage';
import { Screen } from '@/components/ui/screen';
import * as Haptics from 'expo-haptics';

type Frequency = 'less_than_weekly' | 'few_times_week' | 'daily' | 'multiple_per_day';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'varied';
type Goal = 'track_using' | 'preparing_to_quit' | 'already_quitting';

export default function SetupScreen() {
  const router = useRouter();
  const inputBg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<string>('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [amount, setAmount] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('evening');
  const [goal, setGoal] = useState<Goal>('track_using');

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const profile = await getUserProfile();
      if (profile) {
        if (profile.smokingHistory.weeksSmoking !== undefined) setWeeks(String(profile.smokingHistory.weeksSmoking));
        if (profile.smokingHistory.frequency) setFrequency(profile.smokingHistory.frequency as Frequency);
        if (profile.smokingHistory.amountEstimate) setAmount(profile.smokingHistory.amountEstimate);
        if (profile.smokingHistory.timeOfDay) setTimeOfDay(profile.smokingHistory.timeOfDay as TimeOfDay);
        if (profile.smokingHistory.goal) setGoal(profile.smokingHistory.goal as Goal);
      }
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    try {
      const weeksInt = weeks ? parseInt(weeks, 10) : undefined;
      await upsertUserProfile({
        smokingHistory: {
          weeksSmoking: Number.isFinite(weeksInt as number) ? (weeksInt as number) : undefined,
          frequency,
          amountEstimate: amount || undefined,
          timeOfDay,
          goal,
        },
        setupComplete: true,
      });
      await markSetupComplete();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Failed to save setup.');
    }
  };

  if (loading) return <Screen><ThemedText>Loading…</ThemedText></Screen>;

  return (
    <Screen>
      <ThemedText type="title" style={styles.title}>Setup</ThemedText>
      <ThemedText style={styles.subtitle}>Tell us about your current usage</ThemedText>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Weeks into smoking</ThemedText>
        <TextInput
          keyboardType="number-pad"
          placeholder="e.g. 24"
          placeholderTextColor="#888"
          value={weeks}
          onChangeText={setWeeks}
          style={[styles.input, { backgroundColor: '#1e1f22', color: textColor }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Current frequency</ThemedText>
        <View style={styles.rowWrap}>
          {[
            { key: 'less_than_weekly', label: 'Less than weekly' },
            { key: 'few_times_week', label: 'Few times/week' },
            { key: 'daily', label: 'Daily' },
            { key: 'multiple_per_day', label: 'Multiple/day' },
          ].map(opt => (
            <ChoiceChip
              key={opt.key}
              label={opt.label}
              selected={frequency === (opt.key as Frequency)}
              onPress={() => setFrequency(opt.key as Frequency)}
            />
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Recent total amount (optional)</ThemedText>
        <TextInput
          placeholder="e.g. ~1g/day or 2 joints/day"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          style={[styles.input, { backgroundColor: '#1e1f22', color: textColor }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Typical time of day</ThemedText>
        <View style={styles.rowWrap}>
          {[
            { key: 'morning', label: 'Morning' },
            { key: 'afternoon', label: 'Afternoon' },
            { key: 'evening', label: 'Evening' },
            { key: 'night', label: 'Night' },
            { key: 'varied', label: 'Varied' },
          ].map(opt => (
            <ChoiceChip
              key={opt.key}
              label={opt.label}
              selected={timeOfDay === (opt.key as TimeOfDay)}
              onPress={() => setTimeOfDay(opt.key as TimeOfDay)}
            />
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <ThemedText style={styles.label}>Goal</ThemedText>
        <View style={styles.rowWrap}>
          {[
            { key: 'track_using', label: 'Track while using' },
            { key: 'preparing_to_quit', label: 'Preparing to quit' },
            { key: 'already_quitting', label: 'Already quitting' },
          ].map(opt => (
            <ChoiceChip
              key={opt.key}
              label={opt.label}
              selected={goal === (opt.key as Goal)}
              onPress={() => setGoal(opt.key as Goal)}
            />
          ))}
        </View>
      </View>

      <Pressable onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSave(); }} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
        <ThemedText style={styles.primaryBtnText}>Save and Continue</ThemedText>
      </Pressable>
    </Screen>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</ThemedText>
    </Pressable>
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
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e1f22',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#2d6cdf',
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2d6cdf',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
