import React from 'react';
import { TextInput, StyleSheet, Text, View } from 'react-native';

interface PasswordInputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    maxLength?: number;
    isVisible?: boolean;
    onToggleVisibility?: () => void;
}

const ResetPasswordTextBox = ({label, value, onChangeText, placeholder, maxLength, isVisible, onToggleVisibility}: PasswordInputProps
) => {
    return (<View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            maxLength={maxLength}
            secureTextEntry={!isVisible}
        />
    </View>);
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    label: {
        marginBottom: 5,
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    }
});

export default ResetPasswordTextBox;