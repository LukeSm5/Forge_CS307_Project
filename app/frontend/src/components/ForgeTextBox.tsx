import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';
import { Schemes } from '@/constants/Colors';
import { useAppColorScheme } from '@/core/accessibility';

// Attributes of reset password text boxes
interface PasswordInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// Setting up the reset password text boxes with the given attributes
const ForgeTextBox = ({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  isVisible,
}: PasswordInputProps) => {
  const scheme = useAppColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: Schemes[scheme].text },
          ]}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          {
            color: Schemes[scheme].text,
            borderColor: isDark ? '#6b7280' : '#ccc',
            backgroundColor: isDark ? '#111827' : '#ffffff',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        maxLength={maxLength}
        secureTextEntry={label === 'Password' ? !isVisible : false}
        selectionColor="#2f80ed"
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