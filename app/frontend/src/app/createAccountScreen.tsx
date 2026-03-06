import React from 'react';
import LoginButton from '../components/ForgeButton';
import LoginTextBox from '../components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from '@/core/auth';
import { setToken } from '@/core/api';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Platform.OS === 'web'
        ? 'http://localhost:8000'
        : expoHost
            ? `http://${expoHost}:8000`
            : 'http://localhost:8000');

const CreateAccountScreen = () => {
    const router = useRouter();
    const { setLoggedIn, setCurrentUser } = useAuth();
    const [email, setEmail] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const createAccount = async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/create_account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    username: username,
                    password: password
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
                console.log(data.access_token);
                console.log(data.refresh_token);
                setToken(data.access_token ?? null);
                setCurrentUser({
                    email: email,
                    username: username,
                });
                setLoggedIn(true);
                router.push('/(tabs)')
            }
        } catch (error) {
            console.log('Full error:', error);
            alert(`Server did not connect properly. API: ${BASE_URL}`);
        }
    }
    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <LoginTextBox
                label="Email"
                value={email}
                onChangeText={setEmail}
                isVisible={true}
            />
            <LoginTextBox
                label="Username"
                value={username}
                onChangeText={setUsername}
                isVisible={true}
            />
            <LoginTextBox
                label="Password"
                value={password}
                onChangeText={setPassword}
                maxLength={20}
                isVisible={false}
            />
            <LoginButton onPress={createAccount} text="Create Account"/>
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

export default CreateAccountScreen;
