import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import GymMapInterface from "@/components/gymMap/GymMapInterface";


export default function GymMapButton() {
    const [isOpen, setOpen] = useState(false);

    const gymMapInterface = <GymMapInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
            <Text style={styles.buttonText}>{"Search Nearby Gyms"}</Text>
        </TouchableOpacity>

        {gymMapInterface}
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
