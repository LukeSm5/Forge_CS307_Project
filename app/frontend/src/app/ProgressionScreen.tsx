import { View, Text,} from '@/components/Themed';
import { StyleSheet } from 'react-native';

export default function ProgressionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progression will be implemented shortly (Jack can do his graph).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  }
});