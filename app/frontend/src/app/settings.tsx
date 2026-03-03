import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Slider from "@react-native-community/slider";

import { Text } from "@/components/Themed";
import { useAccessibility, ColorMode } from "@/core/accessibility";

function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.modeBtn, selected && styles.modeBtnSelected]}>
      <Text style={[styles.modeBtnText, selected && styles.modeBtnTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colorMode, setColorMode, textScale, setTextScale } = useAccessibility();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accessibility</Text>

      <Text style={styles.sectionTitle}>Theme</Text>
      <View style={styles.modeRow}>
        <ModeButton
          label="System"
          selected={colorMode === "system"}
          onPress={() => setColorMode("system")}
        />
        <ModeButton
          label="Light"
          selected={colorMode === "light"}
          onPress={() => setColorMode("light")}
        />
        <ModeButton
          label="Dark"
          selected={colorMode === "dark"}
          onPress={() => setColorMode("dark")}
        />
      </View>

      <Text style={styles.sectionTitle}>Text Size</Text>
      <Text style={styles.helper}>
        Adjust the slider. This will scale text across the app.
      </Text>

      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={1.0}
        maximumValue={1.4}
        step={0.05}
        value={textScale}
        onValueChange={(v) => setTextScale(v)}
        minimumTrackTintColor="#2f80ed"
      />

      <View style={styles.previewCard}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Preview</Text>
        <Text style={{ marginTop: 8 }}>
          This is how your text will look with the current setting.
        </Text>
      </View>

      <Text style={styles.footerNote}>
        Settings are saved automatically and will persist after restarting the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  helper: { opacity: 0.7 },

  modeRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.25)",
  },
  modeBtnSelected: {
    backgroundColor: "#2f80ed",
    borderColor: "#2f80ed",
  },
  modeBtnText: { fontWeight: "700" },
  modeBtnTextSelected: { color: "white" },

  previewCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.2)",
  },

  footerNote: { marginTop: 18, opacity: 0.65 },
});