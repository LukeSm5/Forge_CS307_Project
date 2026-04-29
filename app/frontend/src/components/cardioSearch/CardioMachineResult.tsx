import { StyleSheet } from "react-native";
import { Separator, Text, useScheme, View } from "@/components/Themed";

export default function CardioMachineResult({
  name,
  desc,
}: {
  name: string;
  desc: string;
}) {
  const s = useScheme();
  return (
    <View
      style={{ ...styles.container, boxShadow: `3px 3px 10px ${s.shadow}` }}
    >
      <Text style={styles.title}>{name}</Text>
      <Separator />
      <Text style={styles.description}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignSelf: "center",
    padding: 12,
    width: "98%",
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: "80%",
  },
});
