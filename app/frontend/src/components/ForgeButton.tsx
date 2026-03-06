import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ForgeButtonThemeName, forgeButtonThemes } from '@/constants/themes';

type ForgeButtonProps = {
  text: string;
  onPress?: (event: GestureResponderEvent) => void;
  theme?: ForgeButtonThemeName;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  color?: string;
  textColor?: string;
};

export default function ForgeButton({
  text,
  onPress,
  theme = 'primary',
  disabled = false,
  compact = false,
  style,
  color,
  textColor,
}: ForgeButtonProps) {
  const selectedTheme = forgeButtonThemes[theme];
  if (!color)
        color = selectedTheme.backgroundColor;
    if (!textColor)
        textColor = selectedTheme.textColor;

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
