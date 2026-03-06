import React from 'react';
import LoginButton from '../components/ForgeButton';
import LoginTextBox from '../components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BASE_URL = __DEV__
    ? Platform.OS === 'web'
        ? 'http://localhost:8000'
        : `http://${Constants.expoConfig?.hostUri?.split(':')[0]}:8000`
    : 'https://example.com';

const CreateAccountScreen = () => {
    const router = useRouter();
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
            const data = await response.json();
            if (!response.ok) {
                alert(`Error: ${data.detail}`);
            } else {
                console.log(data.access_token);
                console.log(data.refresh_token);
                router.push('/(tabs)')
            }
        } catch (error) {
            console.log('Full error:', error);
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
            <LoginButton onPress={() => router.push('/(tabs)')} text="Create Account"/>
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