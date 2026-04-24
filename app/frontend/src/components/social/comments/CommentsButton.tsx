import { useState } from "react";
import { StyleSheet } from "react-native";
import CommentsInterface from "@/components/social/comments/CommentsInterface";
import ForgeButton from "@/components/ForgeButton";
import { useScheme } from "@/components/Themed";

export default function CommentsButton({
  comments,
  postComment,
}: {
  comments: {
    user_id: number;
    username: string;
    text: string;
    timestamp: number;
  }[];
  postComment: (text: string) => void;
}) {
  const [isOpen, setOpen] = useState(false);

  const commentsInterface = (
    <CommentsInterface
      visible={isOpen}
      setVisible={setOpen}
      postComment={postComment}
      comments={comments}
    />
  );

  return (
    <>
      <ForgeButton
        compact
        text={`Comments (${comments.length})`}
        onPress={() => setOpen(true)}
      />

      {commentsInterface}
    </>
  );
}
