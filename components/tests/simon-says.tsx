import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TestResult } from '@/types';

const COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f'];

type Props = { onComplete: (result: TestResult) => void };

export default function SimonSaysTest({ onComplete }: Props) {
  const [sequence, setSequence] = useState<number[]>([randIdx()]);
  const [step, setStep] = useState(0);
  const [showing, setShowing] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [best, setBest] = useState(0);

  useEffect(() => {
    // play back sequence
    let i = 0;
    setShowing(true);
    const timer = setInterval(() => {
      setActive(sequence[i]);
      setTimeout(() => setActive(null), 350);
      i++;
      if (i >= sequence.length) {
        clearInterval(timer);
        setShowing(false);
        setStep(0);
      }
    }, 600);
    return () => clearInterval(timer);
  }, [sequence]);

  const onPress = (idx: number) => {
    if (showing) return;
    const expected = sequence[step];
    if (idx === expected) {
      const nextStep = step + 1;
      if (nextStep >= sequence.length) {
        const nextSeq = [...sequence, randIdx()];
        setBest(Math.max(best, sequence.length));
        setSequence(nextSeq);
      } else {
        setStep(nextStep);
      }
    } else {
      const result: TestResult = { testType: 'simon_says', score: best, details: { longest: best }, completedAt: new Date() };
      onComplete(result);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedText style={styles.title}>Simon Says</ThemedText>
      <ThemedText style={styles.meta}>Repeat the sequence. Best: {best}</ThemedText>
      <View style={styles.grid}>
        {COLORS.map((c, i) => (
          <Pressable key={i} onPress={() => onPress(i)} style={[styles.tile, { backgroundColor: c, opacity: active === i ? 1 : 0.6 }]} />
        ))}
      </View>
    </ThemedView>
  );
}

function randIdx() { return Math.floor(Math.random() * 4); }

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  meta: { marginTop: 6, opacity: 0.8 },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tile: { width: 120, height: 120, borderRadius: 12 },
});
