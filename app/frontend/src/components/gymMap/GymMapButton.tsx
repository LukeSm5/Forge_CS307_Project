import { useState } from 'react';
import { StyleSheet } from "react-native";
import GymMapInterface from "@/components/gymMap/GymMapInterface";
import ForgeButton from '../ForgeButton';


export default function GymMapButton() {
    const [isOpen, setOpen] = useState(false);

    const gymMapInterface = <GymMapInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <ForgeButton text="Search Nearby Gyms" onPress={() => setOpen(true)}/>

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
