import React from 'react';
import { TouchableOpacity, Text, StyleSheet} from 'react-native';
import { useRouter } from 'expo-router';

const WorkoutTrackingButton = ({ onPress, title } : { onPress: () => void, title: string }) => {
    const router = useRouter();

   return (
           <TouchableOpacity onPress={onPress}>
               <Text>{title}</Text>
           </TouchableOpacity>
       );
   }

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    text: {
        color: '#000000',
        fontSize: 16,
    },
});

export default WorkoutTrackingButton;