import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Text } from "@/components/Themed";
import { api, Notification } from "@/core/api";
import NotificationComponent from "./NotificationComponent";

export default function NotificationList({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const [key, setKey] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = () => setKey((prev) => prev + 1);

  const loadNotifications = useCallback(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [key, loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const sortedNotifications = [...(notifications ?? [])].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  return (
    <ScrollView
      style={[styles.list, style]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sortedNotifications.length > 0 ? (
        sortedNotifications.map((notification: Notification) => (
          <NotificationComponent
            key={notification.id}
            notification={notification}
            dismiss={refresh}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No notifications!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: "100%",
  },
  content: {
    width: "100%",
    paddingBottom: 24,
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
