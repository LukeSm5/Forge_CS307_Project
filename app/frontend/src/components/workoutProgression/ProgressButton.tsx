import { useState } from 'react';
import { StyleSheet } from "react-native";
import ProgressionInterface from "@/components/workoutProgression/ProgressionInterface";
import ForgeButton from '../ForgeButton';


export default function ProgressionButton({ exerciseId }: { exerciseId: string }) {
    const [isOpen, setOpen] = useState(false);

    const progressionInterface = <ProgressionInterface exerciseId={exerciseId} visible={isOpen} setVisible={setOpen}/>

    return (<>
        <ForgeButton text="Progression" onPress={() => setOpen(true)}/>

        {progressionInterface}
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
