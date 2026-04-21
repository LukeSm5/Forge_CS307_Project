import { StyleSheet } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Separator, Text, View } from "@/components/Themed";
import CardioButton from "@/components/cardioSearch/CardioButton";
import ProgressionButton from "@/components/workoutProgression/ProgressButton";
import GymMapButton from "@/components/gymMap/GymMapButton";
import AltMachButton from "@/components/machineAlternatives/AltMachButton";
import ExerciseButton from "@/components/exerciseHelp/ExerciseButton";
import NotificationList from "@/components/notifications/NotificationList";
import { api } from "@/core/api";
import { useEffect, useState } from "react";

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <Separator />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
      <GymMapButton />
      <NotificationList style={{ height: 200 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
