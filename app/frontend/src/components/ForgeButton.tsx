import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ForgeButtonThemeName, forgeButtonThemes } from '@/constants/themes';

type ForgeButtonProps = {
  text: string;
  onPress?: (event: GestureResponderEvent) => void;
  theme?: ForgeButtonThemeName;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
};

export default function ForgeButton({
  text,
  onPress,
  theme = 'primary',
  disabled = false,
  compact = false,
  style,
}: ForgeButtonProps) {
  const selectedTheme = forgeButtonThemes[theme];
  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.compactButton,
        { backgroundColor: selectedTheme.backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={[styles.buttonText, { color: selectedTheme.textColor }]}>{text}</Text>
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.65,
  },
});
