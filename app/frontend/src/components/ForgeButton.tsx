import { StyleSheet, TouchableOpacity, Text, GestureResponderEvent } from "react-native";

export default function ForgeButton({ text, onPress }: { text: string, onPress?: (event: GestureResponderEvent) => void}) {
    return (<>
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{text}</Text>
        </TouchableOpacity>
    </>);
}

const styles = StyleSheet.create({
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
