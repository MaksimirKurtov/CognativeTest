import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TestResult } from '@/types';

const COLORS = [
  { name: 'Red', value: '#e74c3c' },
  { name: 'Green', value: '#2ecc71' },
  { name: 'Blue', value: '#3498db' },
  { name: 'Yellow', value: '#f1c40f' },
];

type Props = { onComplete: (result: TestResult) => void };

export default function StroopTest({ onComplete }: Props) {
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [rtList, setRtList] = useState<number[]>([]);
  const startedAt = useRef<number>(Date.now());
  const [current, setCurrent] = useState<{ word: string; color: string }>(() => nextStim());

  useEffect(() => {
    startedAt.current = Date.now();
  }, [trial]);

  function nextStim() {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)].name;
    let color = COLORS[Math.floor(Math.random() * COLORS.length)].value;
    // ensure conflict 50% of time
    if (Math.random() < 0.5) {
      let other = COLORS[Math.floor(Math.random() * COLORS.length)].value;
      while (other === color) other = COLORS[Math.floor(Math.random() * COLORS.length)].value;
      color = other;
    }
    return { word, color };
  }

  const onAnswer = (colorName: string) => {
    const colorMap: Record<string, string> = {
      Red: '#e74c3c',
      Green: '#2ecc71',
      Blue: '#3498db',
      Yellow: '#f1c40f',
    };
    const isCorrect = colorMap[colorName] === current.color;
    const rt = Date.now() - startedAt.current;
    setCorrect(c => c + (isCorrect ? 1 : 0));
    setRtList(list => [...list, rt]);
    if (trial + 1 >= 10) {
      const finalCorrect = isCorrect ? correct + 1 : correct;
      const accuracy = Math.round((finalCorrect / 10) * 100);
      const avgRt = Math.round(rtList.concat([rt]).reduce((a, b) => a + b, 0) / 10);
      const result: TestResult = {
        testType: 'stroop',
        score: accuracy,
        accuracy,
        details: { avgRt, mistakes: 10 - finalCorrect },
        completedAt: new Date(),
      };
      onComplete(result);
    } else {
      setTrial(t => t + 1);
      setCurrent(nextStim());
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView style={styles.promptBox} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={[styles.word, { color: current.color }]}>{current.word}</ThemedText>
        <ThemedText style={styles.meta}>Trial {trial + 1} / 10</ThemedText>
      </ThemedView>
      <View style={styles.choices}>
        {COLORS.map(c => (
          <Pressable key={c.name} style={[styles.choice, { backgroundColor: '#1e1f22' }]} onPress={() => onAnswer(c.name)}>
            <ThemedText style={styles.choiceText}>{c.name}</ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  promptBox: { padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  word: { fontSize: 36, fontWeight: '800' },
  meta: { marginTop: 8, opacity: 0.8 },
  choices: { marginTop: 24, gap: 12 },
  choice: { paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
  choiceText: { fontSize: 16, fontWeight: '600' },
});
