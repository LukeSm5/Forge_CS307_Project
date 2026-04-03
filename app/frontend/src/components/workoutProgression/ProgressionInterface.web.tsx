import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import { api, WeightProgression } from '@/core/api';
import ForgeButton from '../ForgeButton';

export default function ProgressionInterface({ exerciseId, visible, setVisible }: { exerciseId: string, visible: boolean, setVisible: (visible: boolean) => void }) {
    const [ progression, setProgression ] = useState<WeightProgression[]>();

    useEffect(() => {
        api.promptWeightProgression(exerciseId)
            .then(setProgression)
            .catch(alert);
    }, []);

    function getLineData() {
        const lineData = [];
        const [ present, future ] = progression;

        for (let i = Math.max(0, present.time.length - 5); i < present.time.length; i++)
            lineData.push({
                x: present.time[i],
                weight: present.weight[i],
                label: `${present.weight[i]}lbs`,
                segment: "present",
            });
        
        for (let i = 0; i < Math.min(future.time.length, 3); i++)
            lineData.push({
                x: future.time[i],
                weight: future.weight[i],
                label: `${future.weight[i]}lbs?`,
                segment: "future",
            })

        return lineData;
    }

    if (!visible || !progression)
        return (<></>);

    const data = getLineData();
    console.log(data);

    return (
        <View style={styles.container} lightColor="#0007" darkColor="#fff7">
            <View style={styles.popup}>
                <Text style={styles.title}>Weight Progression Chart</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                <View style={{width: '100%', alignItems: 'center'}}>
                {progression && (<View style={{
                    marginLeft: 'auto', marginRight: 'auto',
                    overflow: 'visible'
                }}>
                        <LineChart data={data} width={320} height={240}>
                            <CartesianGrid stroke="rgba(100,100,100,0.5)" />

                            <XAxis dataKey="x"
  tickFormatter={(x) => new Date(x * 1000).toLocaleDateString()} stroke="#606060" />
                            <YAxis hide />

                            <Tooltip
                                formatter={(value: any, name, props: any) => props.payload.label}
                            />

                            {/* Present line */}
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#13e471"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                isAnimationActive={false}
                                connectNulls
                                data={data.map(d => d.segment === "present" ? d : { ...d, weight: null })}
                            />

                            {/* Future line */}
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#df1c1c"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                isAnimationActive={false}
                                connectNulls
                                data={data.map(d => d.segment === "future" ? d : { ...d, weight: null })}
                            />
                        </LineChart>
                </View>)}
                </View>

                <ForgeButton text="Close Progression Chart" onPress={() => setVisible(false)}/>
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
