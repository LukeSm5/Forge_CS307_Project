import React from 'react';
import ForgeButton from '@/components/ForgeButton';
import ForgeTextBox from '@/components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Functional server URL configuration based on environment
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Platform.OS === 'web'
        ? 'http://localhost:8000'
        : expoHost
            ? `http://${expoHost}:8000`
            : 'http://localhost:8000');
    
// ResetPasswordScreen component
const ResetPasswordScreen = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    // Function to handle resetting the password
    const resetPassword = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            alert('Please enter your email.');
            return;
        }

        // Send a POST request to the backend to facilitate logic
        try {            
            const response = await fetch(`${BASE_URL}/auth/reset_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_password: newPassword,
                    user_email: normalizedEmail
                })
            });
            const raw = await response.text();
            let data: any = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                data = {};
            }
            if (!response.ok) {
                alert(`Error: ${data?.detail ?? raw ?? 'Request failed'}`);
            } else {
                alert('Password reset successful. Please log in with your new password.');
                router.back();
            }
        } catch (error) {
            alert(`Server did not connect properly. API: ${BASE_URL}`)
        }
    }
    // Function to verify that both passwords match
    const verifyMatchingPasswords = () => {
        let matching = false;
        if (newPassword === confirmPassword) {
            matching = true;
        } else {
            alert('Passwords do not match. Please try again.');
        }
        return matching;
    }
    // Function to reset the password if the new password matches
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
                isVisible={true}
            />
            <ForgeTextBox
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                maxLength={20}
                isVisible={true}
            />
            <ForgeButton onPress={handleResetPassword} text="Reset Password"/>
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
