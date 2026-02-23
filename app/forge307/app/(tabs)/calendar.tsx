import React, { useMemo, useState } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Text } from "../../components/Themed";

type CalendarItem = {
  id: string;
  title: string;
  time?: string;
};

const DEMO_DATA: Record<string, CalendarItem[]> = {
  "2026-02-22": [
    { id: "1", title: "Push workout", time: "6:00 PM" },
  ],
  "2026-02-23": [{ id: "3", title: "Legs workout", time: "5:30 PM" }],
};

export default function CalendarScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const itemsForDay = DEMO_DATA[selectedDate] ?? [];

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(DEMO_DATA).forEach((d) => {
      marks[d] = { marked: true };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: "#2f80ed",
    };

    return marks;
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendar</Text>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        enableSwipeMonths
      />

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Scheduled for {selectedDate}</Text>
      </View>

      <FlatList
        data={itemsForDay}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts or meals scheduled.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!item.time && <Text style={styles.cardTime}>{item.time}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },

  listHeader: { marginTop: 12, marginBottom: 8 },
  listHeaderText: { fontSize: 16, fontWeight: "600" },

  emptyText: { marginTop: 10, opacity: 0.7 },

  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.15)",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardTime: { marginTop: 4, opacity: 0.7 },
});
