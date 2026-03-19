import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TestResult } from '@/types';

type Props = { onComplete: (result: TestResult) => void };

function generateDigits(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
}

export default function DigitSpanTest({ onComplete }: Props) {
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [length, setLength] = useState(3);
  const [sequence, setSequence] = useState(generateDigits(3));
  const [input, setInput] = useState('');
  const [best, setBest] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase('input'), Math.min(4000, 1000 + length * 500));
    return () => clearTimeout(t);
  }, [sequence]);

  const submit = () => {
    if (input.trim() === sequence) {
      const nextLen = length + 1;
      setBest(Math.max(best, length));
      setCorrectRounds(c => c + 1);
      setLength(nextLen);
      setSequence(generateDigits(nextLen));
      setInput('');
      setPhase('show');
    } else {
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 2) {
        const result: TestResult = {
          testType: 'digit_span',
          score: best,
          details: { longestSpan: best, totalCorrectRounds: correctRounds },
          completedAt: new Date(),
        };
        onComplete(result);
      } else {
        // retry same length with new sequence
        setSequence(generateDigits(length));
        setInput('');
        setPhase('show');
      }
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView style={styles.card} lightColor="#f1f3f5" darkColor="#1e1f22">
        <ThemedText style={styles.title}>Digit Span</ThemedText>
        <ThemedText style={styles.meta}>Length: {length} | Best: {best} | Mistakes: {mistakes}/2</ThemedText>
        {phase === 'show' ? (
          <ThemedText style={styles.sequence}>{sequence}</ThemedText>
        ) : (
          <View>
            <TextInput
              autoFocus
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder="Enter sequence"
              placeholderTextColor="#888"
              style={styles.input}
            />
            <Pressable onPress={submit} style={styles.btn}><ThemedText style={styles.btnText}>Submit</ThemedText></Pressable>
          </View>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 12, marginTop: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { marginTop: 8, opacity: 0.8 },
  sequence: { marginTop: 24, fontSize: 32, letterSpacing: 4, textAlign: 'center' },
  input: { marginTop: 16, padding: 12, backgroundColor: '#1e1f22', borderRadius: 8, color: '#fff', minWidth: 220 },
  btn: { marginTop: 12, backgroundColor: '#2d6cdf', paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
});
