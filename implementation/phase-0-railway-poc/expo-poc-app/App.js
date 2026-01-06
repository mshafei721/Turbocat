import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Railway.app POC</Text>
      <Text style={styles.subtitle}>Expo Metro Bundler Test</Text>
      <Text style={styles.success}>✅ Connection Successful!</Text>
      <Text style={styles.info}>Phase 0: Railway Deployment POC</Text>
      <Text style={styles.date}>Deploy Date: 2026-01-05</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#94a3b8',
    marginBottom: 20,
  },
  success: {
    fontSize: 24,
    color: '#22c55e',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#64748b',
  },
});
