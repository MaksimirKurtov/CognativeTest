import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentPadding?: number;
};

export function Screen({ children, scroll = true, contentPadding = 20 }: Props) {
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : ThemedView;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Container
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={scroll ? { padding: contentPadding, paddingBottom: contentPadding + insets.bottom + 24 } : undefined}
          style={!scroll ? { flex: 1, padding: contentPadding, paddingBottom: contentPadding + insets.bottom + 24 } : undefined}
        >
          {children}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
