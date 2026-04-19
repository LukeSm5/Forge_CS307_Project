import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';
import { Schemes } from '@/constants/Colors';
import { useAppColorScheme } from '@/core/accessibility';
import { useScheme } from './Themed';

// Attributes of reset password text boxes
interface PasswordInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  style ?: object;
}

// Setting up the reset password text boxes with the given attributes
const ForgeTextBox = ({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  isVisible,
  style,
}: PasswordInputProps) => {
  const s = useScheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: s.text },
          ]}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          {
            color: s.text,
            borderColor: s.neutralColor,
            backgroundColor: s.background,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={s.secondaryText}
        maxLength={maxLength}
        secureTextEntry={label === 'Password' ? !isVisible : false}
        selectionColor={s.buttonBg}
      />
    </View>
  );
};

// Styling for the reset password text boxes
const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
    maxWidth: 320,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
  },
});

export default ForgeTextBox;