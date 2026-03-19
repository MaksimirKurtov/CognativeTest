import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ReactionTimeTest from '@/components/tests/reaction-time';
import StroopTest from '@/components/tests/stroop';
import DigitSpanTest from '@/components/tests/digit-span';
import WordRecallTest from '@/components/tests/word-recall';
import type { TestResult } from '@/types';
import { beginSession, completeSession, getUserProfile, initializeDatabase, upsertUserProfile } from '@/lib/storage';
import { useRouter } from 'expo-router';

export default function SessionScreen() {
  const router = useRouter();
  const tests = ['reaction_time','stroop','digit_span','word_recall'] as const;
  const totalSteps = tests.length + 1; // + questionnaire
  const [step, setStep] = useState<'intro'|'test'|'questionnaire'|'summary'>('intro');
  const [testIndex, setTestIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  type QState = {
    sleepHours: string;
    sleepQuality: number;
    wakeups: string;
    mood: number;
    motivation: number;
    anxiety: number;
    mentalClarity: number;
    energy: number;
    cravings: number;
    stress: number;
    caffeineToday: boolean;
    exerciseToday: boolean;
    sickToday: boolean;
    marijuanaLast24h: boolean;
    marijuanaUsedTime: string;
    marijuanaAmount: string;
    marijuanaMethod: 'joint' | 'bong' | 'vape' | 'edible' | 'other';
    notes: string;
  };
  const [questionnaire, setQuestionnaire] = useState<QState>({
    sleepHours: '',
    sleepQuality: 5,
    wakeups: '',
    mood: 5,
    motivation: 5,
    anxiety: 5,
    mentalClarity: 5,
    energy: 5,
    cravings: 5,
    stress: 5,
    caffeineToday: false,
    exerciseToday: false,
    sickToday: false,
    marijuanaLast24h: false,
    marijuanaUsedTime: '',
    marijuanaAmount: '',
    marijuanaMethod: 'joint',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      let p = await getUserProfile();
      if (!p) await upsertUserProfile({});
      setReady(true);
    })();
  }, []);

  const progress = useMemo(() => {
    let completed = 0;
    if (step === 'test') completed = testIndex;
    if (step === 'questionnaire') completed = tests.length;
    if (step === 'summary') completed = totalSteps;
    return Math.min(1, completed / totalSteps);
  }, [step, testIndex]);

  const startSession = () => {
    setStep('test');
    setTestIndex(0);
  };

  const onCompleteTest = (res: TestResult) => {
    setResults(r => [...r, res]);
    if (testIndex + 1 < tests.length) {
      setTestIndex(testIndex + 1);
    } else {
      setStep('questionnaire');
    }
  };

  const onSave = async () => {
    const profile = await getUserProfile();
    if (!profile) return;
    setSaving(true);
    const session = await beginSession(profile.id);
    await completeSession(session, results, {
      sleepHours: questionnaire.sleepHours ? parseFloat(questionnaire.sleepHours) : undefined,
      sleepQuality: questionnaire.sleepQuality,
      wakeups: questionnaire.wakeups ? parseInt(questionnaire.wakeups, 10) : undefined,
      mood: questionnaire.mood,
      motivation: questionnaire.motivation,
      anxiety: questionnaire.anxiety,
      mentalClarity: questionnaire.mentalClarity,
      energy: questionnaire.energy,
      cravings: questionnaire.cravings,
      stress: questionnaire.stress,
      caffeineToday: questionnaire.caffeineToday,
      exerciseToday: questionnaire.exerciseToday,
      sickToday: questionnaire.sickToday,
      marijuanaLast24h: questionnaire.marijuanaLast24h,
      marijuanaUsedTime: questionnaire.marijuanaLast24h ? questionnaire.marijuanaUsedTime || undefined : undefined,
      marijuanaAmount: questionnaire.marijuanaLast24h ? questionnaire.marijuanaAmount || undefined : undefined,
      marijuanaMethod: questionnaire.marijuanaLast24h ? questionnaire.marijuanaMethod : undefined,
      notes: questionnaire.notes || undefined,
      completedAt: new Date(),
    });
    setSaving(false);
    setStep('summary');
  };

  if (!ready) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (step === 'test') {
    const key = tests[testIndex];
    const indicator = (
      <ThemedView style={styles.progressWrap}>
        <ThemedView style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        <ThemedText style={styles.progressText}>Test {testIndex + 1} / {tests.length}</ThemedText>
      </ThemedView>
    );
    if (key === 'reaction_time') return <><ThemedView style={styles.container}>{indicator}</ThemedView><ReactionTimeTest onComplete={onCompleteTest} /></>;
    if (key === 'stroop') return <><ThemedView style={styles.container}>{indicator}</ThemedView><StroopTest onComplete={onCompleteTest} /></>;
    if (key === 'digit_span') return <><ThemedView style={styles.container}>{indicator}</ThemedView><DigitSpanTest onComplete={onCompleteTest} /></>;
    if (key === 'word_recall') return <><ThemedView style={styles.container}>{indicator}</ThemedView><WordRecallTest onComplete={onCompleteTest} /></>;
  }

  if (step === 'questionnaire') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.progressWrap}>
          <ThemedView style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          <ThemedText style={styles.progressText}>Questionnaire</ThemedText>
        </ThemedView>
        <ThemedText type="title" style={styles.title}>End of Session</ThemedText>
        <ThemedText style={styles.subtitle}>Tell us about your sleep and mental state</ThemedText>

        <FieldLabel text="Hours slept" />
        <TextInput placeholder="e.g. 7.5" keyboardType="decimal-pad" value={questionnaire.sleepHours} onChangeText={t => setQuestionnaire({ ...questionnaire, sleepHours: t })} placeholderTextColor="#888" style={styles.input} />

        <FieldLabel text="Sleep quality (1-10)" />
        <ChipRow value={questionnaire.sleepQuality} onChange={v => setQuestionnaire({ ...questionnaire, sleepQuality: v })} />

        <FieldLabel text="Number of wakeups" />
        <TextInput placeholder="e.g. 1" keyboardType="number-pad" value={questionnaire.wakeups} onChangeText={t => setQuestionnaire({ ...questionnaire, wakeups: t })} placeholderTextColor="#888" style={styles.input} />

        <FieldLabel text="Mood (1-10)" />
        <ChipRow value={questionnaire.mood} onChange={v => setQuestionnaire({ ...questionnaire, mood: v })} />

        <FieldLabel text="Motivation (1-10)" />
        <ChipRow value={questionnaire.motivation} onChange={v => setQuestionnaire({ ...questionnaire, motivation: v })} />

        <FieldLabel text="Anxiety (1-10)" />
        <ChipRow value={questionnaire.anxiety} onChange={v => setQuestionnaire({ ...questionnaire, anxiety: v })} />

        <FieldLabel text="Mental clarity (1-10)" />
        <ChipRow value={questionnaire.mentalClarity} onChange={v => setQuestionnaire({ ...questionnaire, mentalClarity: v })} />

        <FieldLabel text="Energy (1-10)" />
        <ChipRow value={questionnaire.energy} onChange={v => setQuestionnaire({ ...questionnaire, energy: v })} />

        <FieldLabel text="Cravings (1-10)" />
        <ChipRow value={questionnaire.cravings} onChange={v => setQuestionnaire({ ...questionnaire, cravings: v })} />

        <FieldLabel text="Stress (1-10)" />
        <ChipRow value={questionnaire.stress} onChange={v => setQuestionnaire({ ...questionnaire, stress: v })} />

        <FieldLabel text="Caffeine today" />
        <ToggleRow value={questionnaire.caffeineToday} onChange={v => setQuestionnaire({ ...questionnaire, caffeineToday: v })} />

        <FieldLabel text="Exercise today" />
        <ToggleRow value={questionnaire.exerciseToday} onChange={v => setQuestionnaire({ ...questionnaire, exerciseToday: v })} />

        <FieldLabel text="Sick today" />
        <ToggleRow value={questionnaire.sickToday} onChange={v => setQuestionnaire({ ...questionnaire, sickToday: v })} />

        <FieldLabel text="Used marijuana in last 24h" />
        <ToggleRow value={questionnaire.marijuanaLast24h} onChange={v => setQuestionnaire({ ...questionnaire, marijuanaLast24h: v })} />

        {questionnaire.marijuanaLast24h && (
          <>
            <FieldLabel text="Approximate time used" />
            <TextInput placeholder="e.g. 21:30" value={questionnaire.marijuanaUsedTime} onChangeText={t => setQuestionnaire({ ...questionnaire, marijuanaUsedTime: t })} placeholderTextColor="#888" style={styles.input} />

            <FieldLabel text="Amount (rough)" />
            <TextInput placeholder="e.g. ~0.5g or 1 joint" value={questionnaire.marijuanaAmount} onChangeText={t => setQuestionnaire({ ...questionnaire, marijuanaAmount: t })} placeholderTextColor="#888" style={styles.input} />

            <FieldLabel text="Method" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(['joint','bong','vape','edible','other'] as const).map(m => (
                <Pressable key={m} onPress={() => setQuestionnaire({ ...questionnaire, marijuanaMethod: m })} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: questionnaire.marijuanaMethod === m ? '#2d6cdf' : '#1e1f22' }}>
                  <ThemedText style={{ fontWeight: questionnaire.marijuanaMethod === m ? '700' : '400' }}>{m}</ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <FieldLabel text="Notes (optional)" />
        <TextInput placeholder="Anything notable about today…" value={questionnaire.notes} onChangeText={t => setQuestionnaire({ ...questionnaire, notes: t })} placeholderTextColor="#888" style={[styles.input, { minHeight: 80 }]} multiline />

        <Pressable onPress={onSave} style={[styles.btn, { marginTop: 16 }]} disabled={saving}>
          <ThemedText style={styles.btnText}>{saving ? 'Saving…' : 'Save Session'}</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (step === 'summary') {
    const items = results.map(r => `${r.testType}: ${Math.round(r.score)}`).join('\n');
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Session Summary</ThemedText>
        <ThemedText style={styles.subtitle}>{items}</ThemedText>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.replace('/(tabs)')} style={[styles.btn, { flex: 1 }]}>
            <ThemedText style={styles.btnText}>Go to Dashboard</ThemedText>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)/results')} style={[styles.btnOutline, { flex: 1 }]}>
            <ThemedText style={styles.btnTextAlt}>View Results</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Full Session</ThemedText>
      <ThemedText style={styles.subtitle}>Runs 4 tests in sequence, then a quick questionnaire.</ThemedText>
      <ThemedView style={styles.progressWrap}>
        <ThemedView style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        <ThemedText style={styles.progressText}>Ready</ThemedText>
      </ThemedView>
      <Pressable onPress={startSession} style={[styles.btn, { marginTop: 16 }]}>
        <ThemedText style={styles.btnText}>Start Full Session</ThemedText>
      </Pressable>
    </ThemedView>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 12,
  },
  btn: { backgroundColor: '#2d6cdf', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: '#2d6cdf', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTextAlt: { color: '#2d6cdf', fontWeight: '600' },
  progressWrap: { height: 6, backgroundColor: '#1e1f22', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#2d6cdf' },
  progressText: { marginTop: 8, marginBottom: 8, textAlign: 'center', opacity: 0.9 },
  input: { padding: 12, backgroundColor: '#1e1f22', borderRadius: 10, color: '#fff', marginBottom: 12 },
});

function FieldLabel({ text }: { text: string }) {
  return <ThemedText style={{ marginBottom: 8, opacity: 0.9 }}>{text}</ThemedText>;
}

function ChipRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const v = i + 1;
        const selected = v === value;
        return (
          <Pressable key={v} onPress={() => onChange(v)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: selected ? '#2d6cdf' : '#1e1f22' }}>
            <ThemedText style={{ fontWeight: selected ? '700' : '400' }}>{v}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
      <Pressable onPress={() => onChange(true)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: value ? '#2d6cdf' : '#1e1f22' }}>
        <ThemedText style={{ fontWeight: value ? '700' : '400' }}>Yes</ThemedText>
      </Pressable>
      <Pressable onPress={() => onChange(false)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: !value ? '#2d6cdf' : '#1e1f22' }}>
        <ThemedText style={{ fontWeight: !value ? '700' : '400' }}>No</ThemedText>
      </Pressable>
    </View>
  );
}
