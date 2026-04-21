import { View, Text, } from "@/components/Themed";
import { styles } from "@/app/settings.Style";
import { TextInput } from "react-native";
import { useAppColorScheme } from "@/core/accessibility";
import { Schemes } from "@/constants/Colors";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  const scheme = useAppColorScheme() ?? "light";
  const isDark = scheme === "dark";

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            color: Schemes[scheme].text,
            borderColor: isDark ? "#6b7280" : "rgba(0,0,0,0.25)",
            backgroundColor: isDark ? "#111827" : "#ffffff",
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor={isDark ? "#9ca3af" : "rgba(0,0,0,0.35)"}
        selectionColor="#2f80ed"
      />
    </View>
  );
}