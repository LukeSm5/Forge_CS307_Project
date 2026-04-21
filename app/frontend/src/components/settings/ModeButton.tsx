import { Pressable } from "react-native";
import { styles } from "../../app/settings.Style"
import { Text } from "@/components/Themed"

export function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeBtn, selected && styles.modeBtnSelected]}
    >
      <Text
        style={[styles.modeBtnText, selected && styles.modeBtnTextSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}