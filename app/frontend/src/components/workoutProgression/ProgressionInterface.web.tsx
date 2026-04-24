import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Separator, Text, useScheme, View } from "@/components/Themed";
import React, { useState, useEffect } from "react";
import { api, WeightProgression } from "@/core/api";
import ForgeButton from "../ForgeButton";
import { Modal } from "react-native";

export default function ProgressionInterface({
  exerciseId,
  visible,
  setVisible,
  userId
}: {
  exerciseId: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  userId?: number | null;
}) {
  const [progression, setProgression] = useState<WeightProgression[]>();

  useEffect(() => {
    if (!visible || progression) return;

    api
      .promptWeightProgression(exerciseId, userId || null)
      .then(p => {
        setProgression(p);
        getLineData(p);
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load progression data.";
        alert(message);
        setVisible(false);
      });
  }, [exerciseId, visible, progression, setVisible]);

  const [lineData, setLineData] = useState<{
    x: number;
    weight: number;
    label: string;
    segment: string
  }[]>([]);

  function getLineData(p: WeightProgression[]) {
    const nLineData = [];
    const [present, future] = p;

    for (
      let i = Math.max(0, present.time.length - 5);
      i < present.time.length;
      i++
    )
      nLineData.push({
        x: present.time[i],
        weight: present.weight[i],
        label: `${present.weight[i]}lbs`,
        segment: "present",
      });

    for (let i = 0; i < Math.min(future.time.length, 3); i++)
      nLineData.push({
        x: future.time[i],
        weight: future.weight[i],
        label: `${future.weight[i]}lbs?`,
        segment: "future",
      });

    setLineData(nLineData);
  }

  const s = useScheme();

  if (!visible || !progression) return <></>;

  return (
    <Modal style={{ backgroundColor: s.backdrop }}>
      <View style={styles.container}>
        <View style={styles.popup}>
          <Text style={styles.title}>Weight Progression Chart</Text>
          <Separator />
          <View style={{ width: "100%", alignItems: "center" }}>
            {progression && (
              <View
                style={{
                  marginLeft: "auto",
                  marginRight: "auto",
                  overflow: "visible",
                }}
              >
                <LineChart data={lineData} width={320} height={240}>
                  <CartesianGrid stroke={s.neutralColor} />

                  <XAxis
                    dataKey="x"
                    tickFormatter={(x) =>
                      new Date(x * 1000).toLocaleDateString()
                    }
                    stroke={s.neutralColor}
                  />
                  <YAxis hide />

                  <Tooltip
                    formatter={(value: any, name, props: any) =>
                      props.payload.label
                    }
                  />

                  {/* Present line */}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={s.buttonBg}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                    connectNulls
                    data={lineData.map((d) =>
                      d.segment === "present" ? d : { ...d, weight: null },
                    )}
                  />

                  {/* Future line */}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={s.buttonSecondaryBg}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                    connectNulls
                    data={lineData.map((d) =>
                      d.segment === "future" ? d : { ...d, weight: null },
                    )}
                  />
                </LineChart>
              </View>
            )}
          </View>

          <ForgeButton
            text="Close Progression Chart"
            onPress={() => setVisible(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  popup: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    marginVertical: "3%",
    borderRadius: "15px",
    padding: "2%",
    zIndex: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  questionContainer: {
    alignItems: "center",
    marginHorizontal: 50,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
});
