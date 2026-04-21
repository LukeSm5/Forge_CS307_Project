import { StyleSheet } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';
import { Notification, FriendRequestNotificationData, ViewPostNotificationData, api } from '@/core/api';
import ForgeButton from '../ForgeButton';

export default function NotificationComponent({ notification, dismiss }: { notification: Notification, dismiss: () => void }) {
    const s = useScheme();

    const dismissNotification = async () => {
        await api.dismissNotification(notification.id);
        dismiss();
    };

    const interactions: NotificationInteraction[] = [];
    switch (notification.type) {
        case 'friend_request': {
            const data = notification.data as FriendRequestNotificationData;
            interactions.push({
                label: 'Accept',
                onPress: () => {
                    api.acceptFriendRequest(data.requesterId);
                    dismissNotification();
                },
            });
            interactions.push({
                label: 'Decline',
                onPress: dismissNotification,
            });
            break;
        }

        case 'view_post': {
            const data = notification.data as ViewPostNotificationData;
            interactions.push({
                label: 'View Post',
                onPress: () => alert('Viewing post not implemented yet.')
            });
            break;
        }

        default:
            break;
    }

    let interactionsComponent = <></>;
    if (interactions.length > 0) {
        interactionsComponent = (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 10 }}>
                {interactions.map((interaction, idx) => (
                    <ForgeButton key={idx} text={interaction.label} onPress={interaction.onPress} />
                ))}
            </View>
        );
    }

    return (
        <View style={{ ...styles.container, boxShadow: `3px 3px 10px ${s.shadow}`, }}>
            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                <Text style={{ marginBottom: 10 }}>{new Date(notification.timestamp * 1000).toLocaleString()}</Text>
                <Text style={styles.title}>{notification.message}</Text>
            </View>
            <Separator />
            <View style={{ flexDirection: 'row', justifyContent: interactions.length > 0 ? 'space-between' : 'flex-end', alignItems: 'center' }}>
                {interactionsComponent}
                <ForgeButton style={{  }} text="Dismiss" onPress={dismissNotification} />
            </View>
        </View>
    );
}

type NotificationInteraction = {
    label: string;
    onPress: () => void;
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
});
