import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import CardioSearchInterface from "@/components/cardioSearch/CardioSearchInterface";


export default function CardioButton() {
    const [isOpen, setOpen] = useState(false);

    const cardioInterface = <CardioSearchInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
            <Text style={styles.buttonText}>{"Search Cardio Machines"}</Text>
        </TouchableOpacity>

        {cardioInterface}
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
