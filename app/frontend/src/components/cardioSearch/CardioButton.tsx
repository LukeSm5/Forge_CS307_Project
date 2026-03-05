import { useState } from 'react';
import { StyleSheet } from "react-native";
import CardioSearchInterface from "@/components/cardioSearch/CardioSearchInterface";
import ForgeButton from '../ForgeButton';


export default function CardioButton() {
    const [isOpen, setOpen] = useState(false);

    const cardioInterface = <CardioSearchInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <ForgeButton text="Search Cardio Machines" onPress={() => setOpen(true)}/>

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
