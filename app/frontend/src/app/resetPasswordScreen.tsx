import React from 'react';
import ForgeButton from '@/components/ForgeButton';
import ForgeTextBox from '@/components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Reset Password Screen to navigate to when the user clicks the Reset Password Button
const BASE_URL = __DEV__
    ? Platform.OS === 'web'
        ? 'http://localhost:8000'
        : `http://${Constants.expoConfig?.hostUri?.split(':')[0]}:8000`
    : 'https://example.com';
    
// NOTE: Not tested, may or may not work properly
const ResetPasswordScreen = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const resetPassword = async () => {
        try {            
            const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_password: newPassword,
                    user_email: email
                })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(`Error: ${data.detail}`);
            }
        } catch (error) {
            alert('Server did not connect properly.')
        }
    }
    const verifyMatchingPasswords = () => {
        let matching = false;
        if (newPassword === confirmPassword) {
            // Proceed with password reset logic
            alert('Passwords match! Proceeding with reset.');
            matching = true;
        } else {
            alert('Passwords do not match. Please try again.');
        }
        return matching;
    }

    const handleResetPassword = () => {
        if (verifyMatchingPasswords()) {
            resetPassword();
        }
    }
    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            <ForgeTextBox
                label="Email"
                value={email}
                onChangeText={setEmail}
                isVisible={true}
            />
            <ForgeTextBox
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                maxLength={20}
                isVisible={false}
            />
            <ForgeTextBox
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                maxLength={20}
                isVisible={false}
            />
            <ForgeButton onPress={() => { router.back() }} text="Reset Password"/>
            <ForgeButton onPress={() => { router.back() }} text="Cancel"/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 30,
        fontWeight: 'bold',
    }
});

export default ResetPasswordScreen;