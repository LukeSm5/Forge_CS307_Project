import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, useScheme } from "@/components/Themed";

type SocialChatsOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

export default function SocialChatsOverlay({
  visible,
  onClose,
}: SocialChatsOverlayProps) {
  const scheme = useScheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.backdrop,
          { backgroundColor: scheme.backdrop ?? "rgba(0,0,0,0.45)" },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: scheme.background,
              borderColor: scheme.neutralColor,
              shadowColor: scheme.shadow,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: scheme.buttonBg }]}>
                MESSAGES
              </Text>
              <Text style={[styles.title, { color: scheme.text }]}>Chats</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chats"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: scheme.secondaryBackground,
                  borderColor: scheme.neutralColor,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={24} color={scheme.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.placeholderBox,
              {
                backgroundColor: scheme.secondaryBackground,
                borderColor: scheme.neutralColor,
              },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={42}
              color={scheme.buttonBg}
            />
            <Text style={[styles.placeholderTitle, { color: scheme.text }]}>
              Chat list goes here
            </Text>
            <Text
              style={[styles.placeholderText, { color: scheme.secondaryText }]}
            >
              No chats currently
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
