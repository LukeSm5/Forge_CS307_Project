import React from 'react';
import ForgeButton from '@/components/ForgeButton';
import ForgeTextBox from '@/components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';

// Reset Password Screen to navigate to when the user clicks the Reset Password Button

// NOTE: Not tested, may or may not work properly
const ResetPasswordScreen = () => {
    const router = useRouter();
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const resetPassword = async () => {
        try {            
            const response = await fetch('http://localhost:8000/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_password: newPassword,
                    user_id: 1
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