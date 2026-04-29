import { StyleSheet } from "react-native";

import { Separator, Text, useScheme, View } from "@/components/Themed";
import { Notification, FriendRequestNotificationData, api } from "@/core/api";
import ForgeButton from "../ForgeButton";

export default function NotificationComponent({
  notification,
  dismiss,
}: {
  notification: Notification;
  dismiss: () => void;
}) {
  const s = useScheme();

  const dismissNotification = async () => {
    await api.dismissNotification(notification.id);
    dismiss();
  };

  const interactions: NotificationInteraction[] = [];
  switch (notification.type) {
    case "friend_request": {
      const data = notification.data as FriendRequestNotificationData;
      interactions.push({
        label: "Accept",
        onPress: () => {
          api.acceptFriendRequest(data.requesterId);
          dismissNotification();
        },
      });
      interactions.push({
        label: "Decline",
        onPress: dismissNotification,
      });
      break;
    }

    case "view_post": {
      interactions.push({
        label: "View Post",
        onPress: () => alert("Viewing post not implemented yet."),
      });
      break;
    }

    default:
      break;
  }

  return (
    <View
      style={[
        styles.card,
        {
          boxShadow: `0px 3px 10px ${s.shadow}`,
        } as any,
      ]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.timestamp}>
          {new Date(notification.timestamp * 1000).toLocaleString()}
        </Text>
        <Text style={styles.title}>{notification.message}</Text>
      </View>

      <Separator style={styles.separator} />

      <View
        style={[
          styles.actionsRow,
          interactions.length > 0
            ? styles.actionsRowWithInteractions
            : styles.actionsRowDismissOnly,
        ]}
      >
        {interactions.length > 0 && (
          <View style={styles.interactions}>
            {interactions.map((interaction, idx) => (
              <ForgeButton
                key={`${interaction.label}-${idx}`}
                text={interaction.label}
                onPress={interaction.onPress}
                compact
                style={styles.actionButton}
              />
            ))}
          </View>
        )}
        <ForgeButton
          text="Dismiss"
          onPress={dismissNotification}
          compact
          style={styles.dismissButton}
        />
      </View>
    </View>
  );
}

type NotificationInteraction = {
  label: string;
  onPress: () => void;
};

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  textBlock: {
    width: "100%",
    alignItems: "flex-start",
  },
  timestamp: {
    marginBottom: 8,
    fontSize: 15,
  },
  title: {
    width: "100%",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    flexShrink: 1,
  },
  separator: {
    width: "100%",
    marginVertical: 18,
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionsRowWithInteractions: {
    justifyContent: "space-between",
  },
  actionsRowDismissOnly: {
    justifyContent: "flex-end",
  },
  interactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 1,
    gap: 8,
  },
  actionButton: {
    marginVertical: 0,
  },
  dismissButton: {
    marginVertical: 0,
    minWidth: 104,
  },
});
