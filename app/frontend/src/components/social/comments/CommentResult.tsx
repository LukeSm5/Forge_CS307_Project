import { StyleSheet } from "react-native";

import { Separator, Text, useScheme, View } from "@/components/Themed";

export default function CommentResult({
  username,
  comment,
  timestamp,
}: {
  username: string;
  comment: string;
  timestamp: number;
}) {
  const s = useScheme();
  return (
    <View
      style={{ ...styles.container, boxShadow: `3px 3px 10px ${s.shadow}` }}
    >
      <Text style={styles.timestamp}>
        {new Date(timestamp * 1000).toLocaleString()}
      </Text>
      <Text style={styles.title}>@{username}</Text>
      <Separator />
      <Text style={styles.commentText}>{comment}</Text>
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
  timestamp: {
    marginBottom: 10,
    fontSize: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  commentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: "80%",
  },
});
