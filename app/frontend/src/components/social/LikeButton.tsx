import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import ForgeButton from "../ForgeButton";
import { api } from "@/core/api";

export default function LikeButton({
  likes,
  likePost,
  unlikePost,
}: {
  likes: { user_id: number; username: string }[];
  likePost: () => void;
  unlikePost: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    api.me().then((profile) => {
      if (!profile) return;
      setIsLiked(likes.some((like) => like.user_id === profile.profile_id));
    });
  }, [likes]);

  return (
    <ForgeButton
      compact
      text={`${isLiked ? "Unlike" : "Like"} (${likes.length})`}
      onPress={() => {
        if (isLiked) {
          unlikePost();
          setIsLiked(false);
        } else {
          likePost();
          setIsLiked(true);
        }
      }}
    />
  );
}
