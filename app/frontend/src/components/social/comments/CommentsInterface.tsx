import React, { useMemo, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import { Separator, Text, useScheme, View } from "@/components/Themed";
import CommentResult from "@/components/social/comments/CommentResult";
import ForgeButton from "@/components/ForgeButton";

export default function CommentsInterface({
  visible,
  setVisible,
  postComment,
  comments,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  postComment: (text: string) => void;
  comments: {
    user_id: number;
    username: string;
    text: string;
    timestamp: number;
  }[];
}) {
  const [commentBox, setCommentBox] = useState("");
  const s = useScheme();

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => b.timestamp - a.timestamp),
    [comments],
  );

  if (!visible) return <></>;

  return (
    <Modal transparent animationType="slide">
      <SafeAreaView style={[styles.container, { backgroundColor: s.backdrop }]}>
        <View
          style={[
            styles.popup,
            { backgroundColor: s.background ?? s.backdrop },
          ]}
        >
          <Text style={styles.title}>Comments</Text>
          <Separator />

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: "gray",
                  color: s.text,
                  backgroundColor: s.cardBg ?? s.background,
                },
              ]}
              placeholder="Write a comment"
              placeholderTextColor={s.text + "88"}
              maxLength={150}
              multiline
              onChangeText={setCommentBox}
              value={commentBox}
            />
            <View style={styles.postButtonWrap}>
              <ForgeButton
                text="Post Comment"
                onPress={() => {
                  const trimmed = commentBox.trim();
                  if (!trimmed) return;
                  postComment(trimmed);
                  setCommentBox("");
                }}
              />
            </View>
          </View>

          <Separator />

          <View
            style={[
              styles.commentsContainer,
              { boxShadow: `inset 3px 3px 10px ${s.shadow}` },
            ]}
          >
            <ScrollView contentContainerStyle={styles.commentsContent}>
              {sortedComments.length > 0 ? (
                sortedComments.map((item, idx) => (
                  <CommentResult
                    key={`${item.user_id}-${item.timestamp}-${idx}`}
                    username={item.username}
                    comment={item.text}
                    timestamp={item.timestamp}
                  />
                ))
              ) : (
                <Text style={styles.emptyStateText}>
                  Be the first to comment!
                </Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.closeButtonWrap}>
            <ForgeButton
              text="Close Comments"
              onPress={() => setVisible(false)}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  popup: {
    flex: 1,
    width: "95%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 60,
    maxHeight: 90,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  postButtonWrap: {
    width: 170,
  },
  commentsContainer: {
    width: "100%",
    flex: 1,
    minHeight: 0,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 12,
  },
  commentsContent: {
    paddingBottom: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
  },
  closeButtonWrap: {
    width: "100%",
  },
});
