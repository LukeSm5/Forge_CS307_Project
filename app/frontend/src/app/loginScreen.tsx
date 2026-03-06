import React from 'react';
import LoginButton from '../components/ForgeButton';
import LoginTextBox from '../components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';

const BASE_URL = __DEV__ 
    ? `http://${Constants.expoConfig?.hostUri?.split(':')[0]}:8000`
    : 'https://example.com';

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(`Error: ${data.detail}`);
            } else {
                console.log(data.access_token);
                console.log(data.refresh_token);
            }
        } catch (error) {
            alert('Server did not connect properly.');
        }
    }
    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Login</Text>
            <LoginTextBox
                label="Email"
                value={email}
                onChangeText={setEmail}
            />
            <LoginTextBox
                label="Password"
                value={password}
                onChangeText={setPassword}
                maxLength={20}
                isVisible={false}
            />
            <LoginButton onPress={handleLogin} text="Login"/>
            <LoginButton onPress={() => router.push('/resetPasswordScreen')} text="Reset Password"/>
        </View>
    );
}
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

export default LoginScreen;