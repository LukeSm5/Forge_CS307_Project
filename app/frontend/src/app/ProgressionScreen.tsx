import { View, Text,} from '@/components/Themed';
import ProgressionButton from '@/components/workoutProgression/ProgressButton';
import { api } from '@/core/api';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

export default function ProgressionScreen() {
  const [ exercises, setExercises ] = useState<string[] | null>(null);
  const [ profile, setProfile ] = useState<{ age: number, weight: number, height: number, gender: string, health_goals: string } | null>(null);
  const  {userId } = useLocalSearchParams();
  const numericUserId = Number(userId);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    api.checkBlock(numericUserId).then((status => {
        if (status.i_blocked_them || status.they_blocked_me) {
          setBlocked(true);
        } else {
          setBlocked(false);
          api.getExercises().then((ex: Record<string, number>) => setExercises(Object.keys(ex)));
          api.profileData(numericUserId).then((prof) => setProfile(prof));}
    }))
  }, []);
  if (blocked) {
    return (
        <View style={styles.container}>
        <Text>This profile is unavailable</Text>
        </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progression</Text>
      { profile && (
        <>
          <Text>Age: {profile.age}</Text>
          <Text>Weight: {profile.weight} lbs</Text>
          <Text>Height: {profile.height} inches</Text>
          <Text>Gender: {profile.gender}</Text>
        </>
      )}
      <ScrollView style={{width: '80%'}}>
        { exercises === null ? <Text>Exercises loading!</Text> : exercises.map((exerciseId, idx) => (
          <View style={{flexDirection: 'row', flex: 1, marginBottom: 20, padding: 15, alignItems: 'center', justifyContent: 'space-between'}} key={idx}>
            <Text>{exerciseId.toUpperCase()}</Text>
            <ProgressionButton exerciseId={exerciseId} userId={numericUserId} />
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