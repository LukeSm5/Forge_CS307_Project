import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';
import CommentResult from '@/components/social/comments/CommentResult';
import React, { useState } from 'react';
import ForgeButton from '@/components/ForgeButton';
import { Modal } from 'react-native';

export default function CommentsInterface({ visible, setVisible, postComment, comments }: { visible: boolean, setVisible: (visible: boolean) => void, postComment: (text: string) => void, comments: { user_id: number; username: string; text: string; timestamp: number }[] }) {
    const [ commentBox, setCommentBox ] = useState("");

    const s = useScheme();

    let searchComponent: React.JSX.Element;
    if (comments.length > 0) {
        // most recent comments at top
        searchComponent = (<><ScrollView style={{ ...styles.searchResults, 
        boxShadow: `inset 3px 3px 10px ${s.shadow}`, }}>
            {comments.sort((a, b) => b.timestamp - a.timestamp).map((item: { user_id: number; username: string; text: string; timestamp: number }, idx: number) => <CommentResult key={idx} username={item.username} comment={item.text} timestamp={item.timestamp} />)}
        </ScrollView></>);
    } else {
        searchComponent = (<><ScrollView style={{ ...styles.searchResults, 
        boxShadow: `inset 3px 3px 10px ${s.shadow}`, }}>
                <Text style={styles.title}>Be the first to comment!</Text>
        </ScrollView></>);
    }

    if (!visible)
        return (<></>);

    return (<Modal style={{ backgroundColor: s.backdrop }}>
        <View style={styles.container}>
            <View style={styles.popup}>
                <Text style={styles.title}>Comments</Text>
                <Separator />
                <View style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: 'center',
                    width: '90%',
                }}>
                    <TextInput
                        style={{ fontSize: 16, height: 60, borderColor: 'gray', borderWidth: 1, width: '60%', padding: 10, borderRadius: '5px', color: s.text, }}
                        maxLength={150}
                        onChangeText={setCommentBox}
                        value={commentBox}
                    />
                    <ForgeButton text="Post Comment" onPress={() => {
                        postComment(commentBox);
                        setCommentBox("");
                    }} />
                </View>

                <Separator />
                {searchComponent}


                <ForgeButton text="Close Comments" onPress={() => setVisible(false)}/>
            </View>
        </View>
    </Modal>);
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    popup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        marginVertical: '3%',
        borderRadius: '15px',
        padding: '2%',
        zIndex: 100,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    searchResults: {
        width: '80%',
        height: '45%',
        borderRadius: 10,
        marginBottom: 10,
        padding: 10
    },
    questionContainer: {
        alignItems: 'center',
        marginHorizontal: 50,
    },
    questionText: {
        fontSize: 17,
        lineHeight: 24,
        textAlign: 'center',
    },
});
