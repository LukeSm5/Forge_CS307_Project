import { useEffect, useState } from 'react';
import { StyleSheet } from "react-native";
import ForgeButton from '../ForgeButton';
import { api } from '@/core/api';


export default function ReactionButton({ reactions, reactPost, unreactPost, reaction }: { reaction: string; reactions: { user_id: number, username: string, reaction: string }[]; reactPost: (arg0: string) => void; unreactPost: () => void; }) {
    const [isReacted, setIsReacted] = useState(false);
    
    const outerReaction = reaction;
    useEffect(() => {
        api.me().then((profile) => {
            if (!profile) return;
            setIsReacted(reactions.some(reaction => reaction.user_id === profile.profile_id && reaction.reaction === outerReaction));
        });
    }, [reactions]);

    return (
        <ForgeButton 
            text={`${outerReaction} (${reactions.filter(r => r.reaction === outerReaction).length})`} 
            onPress={() => {
                if (isReacted) {
                    unreactPost();
                    setIsReacted(false);
                } else {
                    reactPost(outerReaction);
                    setIsReacted(true);
                }
            }}
            style={isReacted ? styles.reacted : undefined}
        />
    );
}

const styles = {
    // reacted should lift up
    reacted: {
        transform: [{ translateY: -2 }],
    }
}
