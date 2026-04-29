import { useState } from 'react';
import GymMapInterface from "@/components/gymMap/GymMapInterface";
import ForgeButton from '../ForgeButton';


export default function GymMapButton() {
    const [isOpen, setOpen] = useState(false);

    const gymMapInterface = <GymMapInterface visible={isOpen} setVisible={setOpen}/>

    return (<>
        <ForgeButton 
        text="Search Nearby Gyms" 
        onPress={() => setOpen(true)}
        style = {{width: 196, height:40}}/>

        {gymMapInterface}
    </>);
}
