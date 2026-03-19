import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import ReactionTimeTest from '@/components/tests/reaction-time';
import StroopTest from '@/components/tests/stroop';
import DigitSpanTest from '@/components/tests/digit-span';
import WordRecallTest from '@/components/tests/word-recall';
import SimonSaysTest from '@/components/tests/simon-says';
import type { TestResult } from '@/types';
import { beginSession, completeSession, getUserProfile, initializeDatabase, upsertUserProfile } from '@/lib/storage';

export default function TestRunnerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      let p = await getUserProfile();
      if (!p) p = await upsertUserProfile({});
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const onDone = async (result: TestResult) => {
    const profile = await getUserProfile();
    if (!profile) return;
    const session = await beginSession(profile.id);
    await completeSession(session, [result]);
    router.replace('/(tabs)/results');
  };

  switch (slug) {
    case 'reaction_time':
      return <ReactionTimeTest onComplete={onDone} />;
    case 'stroop':
      return <StroopTest onComplete={onDone} />;
    case 'digit_span':
      return <DigitSpanTest onComplete={onDone} />;
    case 'word_recall':
      return <WordRecallTest onComplete={onDone} />;
    case 'simon_says':
      return <SimonSaysTest onComplete={onDone} />;
    default:
      return (
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Unknown test.</ThemedText>
        </ThemedView>
      );
  }
}

