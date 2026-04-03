import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LineChart, lineDataItem } from "react-native-gifted-charts";

import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { api, WeightProgression } from '@/core/api';
import ForgeButton from '../ForgeButton';
import { Modal } from 'react-native';

export default function ProgressionInterface({ exerciseId, visible, setVisible }: { exerciseId: string, visible: boolean, setVisible: (visible: boolean) => void }) {
    const [ progression, setProgression ] = useState<WeightProgression[]>();

    useEffect(() => {
        api.promptWeightProgression(exerciseId)
            .then(setProgression)
            .catch(alert);
    }, []);

    function getLineData(): lineDataItem[] {
        const lineData: lineDataItem[] = [];
        console.log(progression)
        const [ present, future ] = progression;

        for (let i = Math.max(0, present.time.length - 5); i < present.time.length; i++)
            lineData.push({
                value: present.weight[i],
                dataPointText: `${present.weight[i]}lbs`
            });
        
        for (let i = 0; i < Math.min(future.time.length, 3); i++)
            lineData.push({
                value: future.weight[i],
                dataPointText: `${future.weight[i]}lbs?`
            })

        return lineData;
    }

    if (!visible || !progression)
        return (<></>);

    return (<Modal>
        <View style={styles.container} lightColor="#0007" darkColor="#fff7">
            <View style={styles.popup}>
                <Text style={styles.title}>Weight Progression Chart</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                <View style={{width: '90%'}}>
                {progression && (<View style={{
                    marginLeft: 'auto', marginRight: 'auto',
                    overflow: 'visible'
                }}>
                    <LineChart
                        disableScroll
                        initialSpacing={20}
                        endSpacing={10}
                        data={getLineData()}
                        lineSegments={[
                            {startIndex: 0, endIndex: progression[0].time.length - 1, color: "#13e471ff"},
                            {startIndex: progression[0].time.length - 1, endIndex: progression[0].time.length + progression[1].time.length - 1, color: "#df1c1cff"},
                        ]}
                        dataPointsColor={'black'}
                        textColor1="#555"
                        textShiftY={16}
                        textShiftX={-10}
                        textFontSize={11}
                        curved
                        spacing={25}
                        thickness={3}
                        hideYAxisText
                        yAxisColor="#838383ff"
                        showVerticalLines
                        verticalLinesColor="rgba(100, 100, 100, 0.5)"
                        xAxisColor="#606060ff"
                        color="#010101ff"
                    />
                </View>)}
                </View>

                <ForgeButton text="Close Progression Chart" onPress={() => setVisible(false)}/>
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
        width: '90%',
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
        width: '90%',
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
