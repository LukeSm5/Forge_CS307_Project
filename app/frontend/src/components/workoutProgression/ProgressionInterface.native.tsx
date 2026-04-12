import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LineChart, lineDataItem } from "react-native-gifted-charts";

import { Separator, Text, useScheme, View } from '@/components/Themed';
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

    const s = useScheme();
    return (<Modal style={{ backgroundColor: s.backdrop }}>
        <View style={styles.container}>
            <View style={styles.popup}>
                <Text style={styles.title}>Weight Progression Chart</Text>
                <Separator />
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
                            {startIndex: 0, endIndex: progression[0].time.length - 1, color: s.buttonBg},
                            {startIndex: progression[0].time.length - 1, endIndex: progression[0].time.length + progression[1].time.length - 1, color: s.buttonSecondaryBg},
                        ]}
                        dataPointsColor={'black'}
                        textColor1={s.neutralColor}
                        textShiftY={16}
                        textShiftX={-10}
                        textFontSize={11}
                        curved
                        spacing={25}
                        thickness={3}
                        hideYAxisText
                        yAxisColor={s.neutralColor}
                        showVerticalLines
                        verticalLinesColor={s.shadow}
                        xAxisColor={s.neutralColor}
                        color={s.text}
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
