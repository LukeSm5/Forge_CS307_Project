import { StyleSheet } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';

export default function CardioMachineResult({ name, desc }: { name: string, desc: string }) {
    const s = useScheme();
    return (
        <View style={{ ...styles.container, boxShadow: `3px 3px 10px ${s.shadow}`, }}>
            <Text style={styles.title}>{name}</Text>
            <Separator />
            <Text>{desc}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
});
