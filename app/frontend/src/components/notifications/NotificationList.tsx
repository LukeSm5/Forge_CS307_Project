import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import { Separator, Text, useScheme, View } from "@/components/Themed";
import CardioMachineResult from "@/components/cardioSearch/CardioMachineResult";
import React, { useEffect, useState } from "react";
import { api, Notification, SearchCardioMachineResponse } from "@/core/api";
import ForgeButton from "../ForgeButton";
import { Modal } from "react-native";
import NotificationComponent from "./NotificationComponent";
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationList({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const s = useScheme();

  const [key, setKey] = useState(0);
  const refresh = () => setKey(prev => prev + 1);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, [key]);

  useFocusEffect(() => {
    api.getNotifications().then(setNotifications);
  });

  return (
    <>
      <ScrollView
        style={[
          styles.searchResults,
          { boxShadow: `inset 3px 3px 10px ${s.shadow}` },
          style,
        ]}
      >
        {[...(notifications ?? [])]
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((notification: Notification, idx: number) => (
            <NotificationComponent key={idx} notification={notification} dismiss={refresh} />
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  popup: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "75%",
    marginVertical: "3%",
    borderRadius: "15px",
    padding: "2%",
    zIndex: 100,
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
  searchResults: {
    width: "80%",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  questionContainer: {
    alignItems: "center",
    marginHorizontal: 50,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
});
