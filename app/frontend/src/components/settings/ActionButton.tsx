import { Pressable } from "react-native";
import { styles } from "../../app/profile/settings.Style"
import { Text } from "@/components/Themed"
import { useAppColorScheme } from "@/core/accessibility";

export function ActionButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const scheme = useAppColorScheme() ?? "light";
  const isDark = scheme === "dark";

  const variantStyle =
    variant === "danger"
      ? styles.btnDanger
      : variant === "secondary"
        ? [
            styles.btnSecondary,
            {
              borderColor: isDark ? "#60a5fa" : "rgba(0,0,0,0.3)",
              backgroundColor: isDark ? "rgba(96,165,250,0.10)" : "transparent",
            },
          ]
        : styles.btnPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, variantStyle, disabled && styles.btnDisabled]}
    >
      <Text
        style={[
          styles.btnText,
          variant === "secondary" && {
            color: isDark ? "#93c5fd" : "#2f80ed",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
