import NotificationList from "@/components/notifications/NotificationList";
import { View } from "@/components/Themed";
import { StyleSheet } from "react-native";

export default function Notifications() {
  return (
    <View style={styles.container}>
      <NotificationList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
});
