import { useState } from 'react';
import { StyleSheet } from "react-native";
import CardioSearchInterface from "@/components/cardioSearch/CardioSearchInterface";
import ForgeButton from '../ForgeButton';
import { useScheme } from '../Themed';


export default function CardioButton() {
    const [isOpen, setOpen] = useState(false);

    const cardioInterface = <CardioSearchInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <ForgeButton text="Search Cardio Machines" onPress={() => setOpen(true)}/>

        {cardioInterface}
    </>);
}
