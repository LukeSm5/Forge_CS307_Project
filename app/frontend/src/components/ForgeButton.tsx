import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useScheme } from './Themed';

type ForgeButtonProps = {
  text: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  color?: string;
  textColor?: string;
};

export default function ForgeButton({
  text,
  onPress,
  disabled = false,
  compact = false,
  style,
  color,
  textColor,
}: ForgeButtonProps) {
  const s = useScheme();
  if (!color)
        color = s.buttonBg;
  if (!textColor)
      textColor = s.buttonText;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.compactButton,
        { backgroundColor: color },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={[styles.buttonText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.65,
  },
});
