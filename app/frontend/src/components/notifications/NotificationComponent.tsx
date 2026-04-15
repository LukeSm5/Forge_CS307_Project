import { StyleSheet } from 'react-native';

import { Text, useScheme, View } from '@/components/Themed';
import { Notification } from '@/core/api';

export default function NotificationComponent({ notification }: { notification: Notification }) {
    const s = useScheme();
    return (
        <View style={{ ...styles.container, boxShadow: `3px 3px 10px ${s.shadow}`, }}>
            <Text style={styles.title}>{notification.message}</Text>
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
