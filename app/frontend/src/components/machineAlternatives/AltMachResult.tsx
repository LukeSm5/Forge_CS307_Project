import { StyleSheet } from "react-native";

import { Text, View, useScheme } from "@/components/Themed";

export default function AltMachResult({
  name,
  desc,
}: {
  name: string;
  desc: string;
}) {
  const s = useScheme();

  return (
    <View
      style={[styles.container, { backgroundColor: s.secondaryBackground }]}
    >
      <Text style={styles.title}>{name}</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <Text style={styles.description}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    padding: 16,
    width: "100%",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: "100%",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});
