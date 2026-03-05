import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { useState } from 'react';

import { Text, View } from '@/components/Themed';

export default function Diet() {

  const [restaurant, setRestaurant] = useState('');
  const [meals, setMeals] = useState([]);

  const searchMeals = async () => {
    const response = await fetch(`http://localhost:8000/meals/${restaurant}`);
    const data = await response.json();
    setMeals(data);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Find Diet Meals</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter restaurant"
        value={restaurant}
        onChangeText={setRestaurant}
      />

      <Button title="Search" onPress={searchMeals} />

      <FlatList
        data={meals}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text>{item.name} - {item.calories} cal</Text>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  input: {
    borderWidth: 1,
    width: '80%',
    padding: 10,
    marginVertical: 10,
  },
});