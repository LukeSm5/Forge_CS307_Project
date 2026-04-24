import { View, Text,} from '@/components/Themed';
import ProgressionButton from '@/components/workoutProgression/ProgressButton';
import { api } from '@/core/api';
import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

export default function ProgressionScreen({ userId }: { userId: number }) {
  const [ exercises, setExercises ] = useState<string[] | null>(null);

  useEffect(() => {
    api.getExercises()
      .then((ex: Record<string, number>) => setExercises(Object.keys(ex)));
  });

  return (
    <View style={styles.container}>
      <ScrollView style={{width: '80%'}}>
        { exercises === null ? <Text>Exercises loading!</Text> : exercises.map((exerciseId, idx) => (
          <View style={{flexDirection: 'row', flex: 1, marginBottom: 20, padding: 15, alignItems: 'center', justifyContent: 'space-between'}} key={idx}>
            <Text>{exerciseId.toUpperCase()}</Text>
            <ProgressionButton exerciseId={exerciseId} userId={userId} />
          </View>
        )) }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  }
});