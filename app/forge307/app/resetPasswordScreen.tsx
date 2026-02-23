import React from 'react';
import ResetPasswordButton from '@/components/resetPassword/ResetPasswordButton';
import ResetPasswordTextBox from '@/components/resetPassword/ResetPasswordTextBox';
import { StyleSheet } from 'react-native';

// Reset Password Screen to navigate to when the user clicks the Reset Password Button
const ResetPasswordScreen = () => {
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const resetPassword = async () => {

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
        }
    }
};

const styles = StyleSheet.create({

});
export default ResetPasswordScreen;