import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';
import CardioMachineResult from '@/components/cardioSearch/CardioMachineResult';
import React, { useState } from 'react';
import { api, SearchCardioMachineResponse } from '@/core/api';
import ForgeButton from '../ForgeButton';
import { Modal } from 'react-native';

export default function CardioSearchInterface({ visible, setVisible }: { visible: boolean, setVisible: (visible: boolean) => void }) {
    const [ results, setResults ] = useState<SearchCardioMachineResponse[]>([]);

    const [ searchTerm, setSearchTerm ] = useState("");

    const s = useScheme();

    let searchComponent: React.JSX.Element;
    if (results.length > 0) {
        searchComponent = (<><ScrollView style={{ ...styles.searchResults, 
        boxShadow: `inset 3px 3px 10px ${s.shadow}`, }}>
            {results.map((item: SearchCardioMachineResponse, idx: number) => <CardioMachineResult key={idx} name={item.name} desc={item.desc} />)}
        </ScrollView></>);
    } else {
        searchComponent = (<><ScrollView style={{ ...styles.searchResults, 
        boxShadow: `inset 3px 3px 10px ${s.shadow}`, }}>
                <Text style={styles.title}>No search results.</Text>
        </ScrollView></>);
    }

    async function searchPrompt() {
        const res = await api.searchCardioMachine({ desc: searchTerm });
        setResults(res);
    }

    if (!visible)
        return (<></>);

    return (<Modal style={{ backgroundColor: s.backdrop }}>
        <View style={styles.container}>
            <View style={styles.popup}>
                <Text style={styles.title}>Cardio Machine Search</Text>
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
                        onChangeText={setSearchTerm}
                    />
                    <ForgeButton text="Search" onPress={searchPrompt} />
                </View>

                <Separator />
                <Text style={styles.title}>Search Results</Text>
                <Separator />
                {searchComponent}


                <ForgeButton text="Close Cardio Machine Search" onPress={() => setVisible(false)}/>
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
