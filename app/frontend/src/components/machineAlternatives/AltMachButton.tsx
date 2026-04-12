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
