import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Text, useScheme, View } from '@/components/Themed';
import AltMachResult from '@/components/cardioSearch/CardioMachineResult';
import React, { useEffect, useState } from 'react';
import { api, AltMachResponse } from '@/core/api';
import ForgeButton from '../ForgeButton';
import { Modal } from 'react-native';

export default function AltMachInterface({ visible, setVisible, exercise }: { visible: boolean, setVisible: (visible: boolean) => void, exercise: string }) {
    const [ results, setResults ] = useState<AltMachResponse[]>([]);

    let searchComponent: React.JSX.Element;
    if (results.length > 0) {
        searchComponent = (<><View style={styles.searchResults}>
            {results.map((item: AltMachResponse, idx: number) => <AltMachResult key={idx} name={item.name} desc={item.desc} />)}
        </View></>);
    } else {
        searchComponent = (<><View style={styles.searchResults}>
                <Text style={styles.title}>Loading results...</Text>
        </View></>);
    }

    useEffect(() => {
        api.machineAlternative({ exercise }).then(setResults).catch(alert);
    }, [exercise]);

    if (!visible)
        return (<></>);

    const s = useScheme();
    return (<Modal style={{ backgroundColor: s.backdrop }}>
        <View style={styles.container}>
            <View style={styles.popup}>
                <Text style={styles.title}>Exercise Alternatives</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                {searchComponent}
                <ForgeButton text="Close Exercise Alternatives" onPress={() => setVisible(false)}/>
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
        overflowX: 'hidden',
        overflowY: 'scroll',
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
