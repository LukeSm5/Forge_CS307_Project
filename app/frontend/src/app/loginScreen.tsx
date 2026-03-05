import React from 'react';
import LoginButton from '../components/ForgeButton';
import LoginTextBox from '../components/ForgeTextBox';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router/build/exports';

const LoginScreen = () => {
    const router = useRouter();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleLogin = () => {
        // Implement login logic here
    }
    return (
        <View style = {styles.container}>
            <Text style={styles.title}>Login</Text>
            <LoginTextBox
                label="Username"
                value={username}
                onChangeText={setUsername}
                maxLength={20}
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