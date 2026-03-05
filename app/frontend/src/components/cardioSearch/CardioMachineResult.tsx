import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function CardioMachineResult({ name, desc }: { name: string, desc: string }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{name}</Text>
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <Text>{desc}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        boxShadow: '3px 3px 10px #0007',
        margin: '3%',
        padding: '3%',
        width: '95%',
        borderRadius: '10px'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 10,
        height: 1,
        width: '80%',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
