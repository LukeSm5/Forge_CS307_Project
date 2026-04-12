import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

import { SocialPalette, SocialPanel } from "./socialTypes";

type SocialPreviewCardProps = {
  activePanel: SocialPanel;
  colors: SocialPalette;
};

const PANEL_COPY: Record<
  SocialPanel,
  {
    title: string;
    body: string;
    caption?: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    accentKey: keyof Pick<
      SocialPalette,
      "tint" | "buttonBg" | "buttonSecondaryBg"
    >;
  }
> = {
  friends: {
    title: "Friends feed",
    body: "Under construction",
    icon: "people-circle",
    accentKey: "tint",
  },
  gym: {
    title: "Gym feed",
    body: "Under construction",
    icon: "barbell",
    accentKey: "buttonBg",
  },
  chats: {
    title: "Chats",
    body: "Under construction",
    icon: "chatbubbles",
    accentKey: "buttonSecondaryBg",
  },
};

export default function SocialPreviewCard({
  activePanel,
  colors,
}: SocialPreviewCardProps) {
  const copy = PANEL_COPY[activePanel];
  const accentColor = colors[copy.accentKey];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
          <Ionicons name={copy.icon} size={22} color={colors.buttonText} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>
            {copy.title}
          </Text>
          {copy.caption ? (
            <Text style={[styles.caption, { color: accentColor }]}>
              {copy.caption}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.body, { color: colors.muted }]}>{copy.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  caption: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});
