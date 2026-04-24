import NotificationList from "@/components/notifications/NotificationList";
import { View } from "@/components/Themed";

export default function Notifications() {
  return (<View style={{ flex: 1, padding: 16 }}>
    <NotificationList/>
  </View>)
}