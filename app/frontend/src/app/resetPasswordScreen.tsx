import React from 'react';
import { StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';

import LoginButton from '../components/ForgeButton';
import LoginTextBox from '../components/ForgeTextBox';
import { Text, View } from '@/components/Themed';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'web'
    ? 'http://localhost:8000'
    : expoHost
      ? `http://${expoHost}:8000`
      : 'http://localhost:8000');

const ResetPasswordScreen = () => {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          new_password: newPassword,
        }),
      });

      const raw = await response.text();
      let data: any = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        Alert.alert('Error', data?.detail ?? raw ?? 'Reset password failed.');
        return;
      }

      Alert.alert('Success', 'Password reset successfully.', [
        {
          text: 'OK',
          onPress: () => router.push('/loginScreen'),
        },
      ]);
    } catch (error) {
      Alert.alert('Connection Error', `Could not connect to server at ${BASE_URL}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <LoginTextBox
        label="Email"
        value={email}
        onChangeText={setEmail}
        isVisible={true}
      />

      <LoginTextBox
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        maxLength={20}
        isVisible={true}
      />

      <LoginTextBox
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        maxLength={20}
        isVisible={true}
      />

      <LoginButton onPress={handleResetPassword} text="Reset Password" />
      <LoginButton onPress={() => router.push('/loginScreen')} text="Cancel" />
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
  },
});

export default ResetPasswordScreen;