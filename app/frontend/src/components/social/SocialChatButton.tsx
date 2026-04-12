import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/Themed";

import { SocialPalette, SocialPanel } from "./socialTypes";

type SocialChatButtonProps = {
  activePanel: SocialPanel;
  colors: SocialPalette;
  onPress: () => void;
};

export default function SocialChatButton({
  activePanel,
  colors,
  onPress,
}: SocialChatButtonProps) {
  const isActive = activePanel === "chats";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isActive
            ? colors.buttonSecondaryBg
            : colors.buttonBg,
          borderColor: isActive ? colors.buttonSecondaryBg : colors.buttonBg,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="chatbubble-ellipses"
        size={20}
        color={colors.buttonText}
      />
      <Text style={[styles.text, { color: colors.buttonText }]}>Chats</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 16,
  },
  text: {
    fontSize: 17,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
  },
});
