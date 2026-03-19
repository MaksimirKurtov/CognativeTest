import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TestResult } from '@/types';

type Props = { onComplete: (result: TestResult) => void };

const WORD_BANK = ['tree','river','stone','cloud','music','light','paper','glass','apple','mountain','door','smile'];

export default function WordRecallTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<'study' | 'recall'>('study');
  const [words, setWords] = useState<string[]>(() => pickWords(8));
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    if (phase !== 'study') return;
    const id = setInterval(() => setTimer(t => (t <= 1 ? 0 : t - 1)), 1000);
    const to = setTimeout(() => setPhase('recall'), 10000);
    return () => { clearInterval(id); clearTimeout(to); };
  }, [phase]);

  const submit = () => {
    const recalled = input
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean);
    const unique = Array.from(new Set(recalled));
    const correct = unique.filter(w => words.includes(w)).length;
    const percent = Math.round((correct / words.length) * 100);
    const result: TestResult = {
      testType: 'word_recall',
      score: correct,
      details: { percent },
      completedAt: new Date(),
    };
    onComplete(result);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.title}>Word Recall</ThemedText>
        {phase === 'study' ? (
          <>
            <ThemedText style={styles.meta}>Memorize these words ({timer}s)</ThemedText>
            <ThemedText style={styles.words}>{words.join('  ')}</ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.meta}>Type as many as you remember</ThemedText>
            <TextInput
              autoFocus
              multiline
              value={input}
              onChangeText={setInput}
              placeholder="Enter words separated by spaces"
              placeholderTextColor="#888"
              style={styles.input}
            />
            <Pressable onPress={submit} style={styles.btn}><ThemedText style={styles.btnText}>Submit</ThemedText></Pressable>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

function pickWords(n: number) {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 12, marginTop: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { marginTop: 8, opacity: 0.8 },
  words: { marginTop: 16, fontSize: 20, lineHeight: 30 },
  input: { marginTop: 16, minHeight: 100, padding: 12, backgroundColor: '#1e1f22', borderRadius: 8, color: '#fff' },
  btn: { marginTop: 12, backgroundColor: '#2d6cdf', paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
});
