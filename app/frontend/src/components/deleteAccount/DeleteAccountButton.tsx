import { useState } from "react";
import {
  Alert,
  Pressable,
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";
import { Text, useScheme } from "@/components/Themed";
import { api } from "../../core/api";

export default function DeleteAccountButton({
  userId,
  onDeleted,
}: {
  userId: number;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const scheme = useScheme();
  const isDark = scheme.background === "#000";

  const confirmAndDelete = () => {
    Alert.alert("Delete account?", "This cannot be undone.", [
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
    ]);
  };

  return (
    <Pressable
      onPress={confirmAndDelete}
      disabled={loading}
      style={[
        styles.button,
        {
          opacity: loading ? 0.6 : 1,
          backgroundColor: isDark
            ? "rgba(220, 38, 38, 0.16)"
            : scheme.background,
          borderColor: isDark ? scheme.dangerColor : "rgba(0,0,0,0.8)",
        },
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={isDark ? "#fecaca" : scheme.dangerColor} />
        ) : null}
        <Text
          style={[
            styles.text,
            {
              color: isDark ? "#fecaca" : scheme.text,
            },
          ]}
        >
          Delete Account
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontWeight: "700",
    fontSize: 15,
  },
});
