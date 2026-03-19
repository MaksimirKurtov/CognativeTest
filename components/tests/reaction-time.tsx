import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import type { TestResult } from '@/types';

type Props = { onComplete: (result: TestResult) => void };

export default function ReactionTimeTest({ onComplete }: Props) {
  const [trial, setTrial] = useState(0);
  const [state, setState] = useState<'ready' | 'waiting' | 'go'>('ready');
  const [times, setTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const startedAt = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
    };
  }, []);

  const startTrial = () => {
    setState('waiting');
    const delay = 800 + Math.random() * 1200;
    timeoutRef.current = setTimeout(() => {
      startedAt.current = Date.now();
      setState('go');
    }, delay);
  };

  const onTap = async () => {
    if (state === 'ready') {
      startTrial();
    } else if (state === 'waiting') {
      // tapped too early, restart
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setFalseStarts(fs => fs + 1);
      setState('ready');
    } else if (state === 'go') {
      const rt = Date.now() - (startedAt.current || Date.now());
      await Haptics.selectionAsync();
      const next = [...times, rt];
      setTimes(next);
      if (next.length >= 5) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        const fastest = Math.min(...next);
        const slowest = Math.max(...next);
        const result: TestResult = {
          testType: 'reaction_time',
          score: avg,
          reactionTimes: next,
          details: { avg, fastest, slowest, falseStarts, trials: next },
          completedAt: new Date(),
        };
        onComplete(result);
      } else {
        setTrial(trial + 1);
        setState('ready');
      }
    }
  };

  return (
    <Pressable onPress={onTap} style={{ flex: 1 }}>
      <ThemedView style={[styles.box, state === 'go' ? styles.go : state === 'waiting' ? styles.wait : styles.ready]}>
        {state === 'ready' && <ThemedText style={styles.title}>Tap to begin</ThemedText>}
        {state === 'waiting' && <ThemedText style={styles.title}>Wait for green…</ThemedText>}
        {state === 'go' && <ThemedText style={styles.title}>Tap!</ThemedText>}
        <ThemedText style={styles.subtitle}>Trial {times.length + 1} / 5</ThemedText>
        {times.length > 0 && <ThemedText style={styles.subtitle}>Last: {times[times.length - 1]} ms</ThemedText>}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginTop: 16 },
  ready: { backgroundColor: '#1e1f22' },
  wait: { backgroundColor: '#8b2d2d' },
  go: { backgroundColor: '#1f6f3b' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, opacity: 0.9 },
});
