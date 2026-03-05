import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import CardioButton from '@/components/cardioSearch/CardioButton';
import CardioMachineResult from '@/components/cardioSearch/CardioMachineResult';
import React, { useState } from 'react';
import { api, SearchCardioMachineResponse } from '@/core/api';

export default function CardioSearchInterface({ visible, setVisible }: { visible: boolean, setVisible: (visible: boolean) => void }) {
    if (!visible)
        return (<></>);

    const [ results, setResults ] = useState<SearchCardioMachineResponse[]>([]);

    const [ searchTerm, setSearchTerm ] = useState("");

    let searchComponent: React.JSX.Element;
    if (results.length > 0) {
        searchComponent = (<><View style={styles.searchResults}>
            {results.map((item: SearchCardioMachineResponse, idx: number) => <CardioMachineResult key={idx} name={item.name} desc={item.desc} />)}
        </View></>);
    } else {
        searchComponent = (<><View style={styles.searchResults}>
                <Text style={styles.title}>No search results.</Text>
        </View></>);
    }

    async function searchPrompt() {
        const res = await api.searchCardioMachine({ desc: searchTerm });
        setResults(res);
    }

    return (
        <View style={styles.container} lightColor="#0007" darkColor="#fff7">
            <View style={styles.popup}>
                <Text style={styles.title}>Cardio Machine Search</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                <View style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: 'center',
                    width: '90%',
                }}>
                    <TextInput
                        style={{ fontSize: 16, height: 60, borderColor: 'gray', borderWidth: 1, width: '60%', padding: 10, borderRadius: '5px' }}
                        maxLength={150}
                        onChangeText={setSearchTerm}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={searchPrompt}>
                        <Text style={styles.buttonText}>{"Search"}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                <Text style={styles.title}>Search Results</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                {searchComponent}

                <TouchableOpacity style={styles.button} onPress={() => setVisible(false)}>
                    <Text style={styles.buttonText}>{"Close Cardio Machine Search"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    popup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        marginVertical: '3%',
        borderRadius: '15px',
        overflowX: 'hidden',
        overflowY: 'scroll',
        padding: '2%'
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
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 10,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '30%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchResults: {
        width: '80%',
        height: '45%',
        overflowX: 'hidden',
        overflowY: 'scroll',
        boxShadow: 'inset 3px 3px 10px #0007',
        borderRadius: '10px',
        marginBottom: 10,
        padding: '2%'
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
