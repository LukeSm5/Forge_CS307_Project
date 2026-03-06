import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function SocialTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social</Text>
      <Text style={styles.subtitle}>Social features will be added in upcoming stages.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});
