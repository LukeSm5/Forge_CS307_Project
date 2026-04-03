import { useState } from 'react';
import { StyleSheet } from "react-native";
import AltMachInterface from "@/components/machineAlternatives/AltMachInterface";
import ForgeButton from '../ForgeButton';


export default function AltMachButton({ exercise }: { exercise: string }) {
    const [isOpen, setOpen] = useState(false);

    const machInterface = <AltMachInterface visible={isOpen} setVisible={setOpen} exercise={exercise}/>

    return (<>
        <ForgeButton text="Alternatives" onPress={() => setOpen(true)}/>

        {machInterface}
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
