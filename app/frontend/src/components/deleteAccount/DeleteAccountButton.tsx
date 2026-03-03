import { useState } from "react";
import { Alert, Pressable, Text, ActivityIndicator, View } from "react-native";
import { api } from "../../core/api";

export default function DeleteAccountButton({
  userId,
  onDeleted,
}: {
  userId: number;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const confirmAndDelete = () => {
    Alert.alert(
      "Delete account?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.deleteAccount(userId);
              onDeleted();
            } catch (e: any) {
              Alert.alert("Delete failed", e?.message ?? "Unknown error");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={confirmAndDelete}
      disabled={loading}
      style={{
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {loading ? <ActivityIndicator /> : null}
        <Text style={{ fontWeight: "600" }}>Delete Account</Text>
      </View>
    </Pressable>
  );
}
