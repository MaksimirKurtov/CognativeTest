import { View, Text, StyleSheet } from 'react-native';

export default function SessionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Session</Text>
      <Text style={styles.subtitle}>Start a new cognitive testing session</Text>
    </View>
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
    color: '#666',
    textAlign: 'center',
  },
});
