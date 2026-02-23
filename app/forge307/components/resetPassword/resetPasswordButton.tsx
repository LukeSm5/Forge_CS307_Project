import React from 'react';
import { TouchableOpacity, Text, StyleSheet} from 'react-native';
import { useRouter } from 'expo-router';

// Reset Password Button to navigate to the Reset Password Screen
const ResetPasswordButton = () => {
    const router = useRouter();

    return (
        <TouchableOpacity onPress={() => router.push('/resetPasswordScreen')}>
            <Text>Reset Password</Text>
        </TouchableOpacity>
    );
}

// Button styling
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    text: {
        color: '#000000',
        fontSize: 16,
    },
});

export default ResetPasswordButton;