import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { WorkoutFeedPost, api, PostInfo } from "@/core/api";

import { SocialPalette } from "./socialTypes";
import LikeButton from "./LikeButton";
import ReactionButton from "./ReactionButton";
import CommentsButton from "./comments/CommentsButton";

type WorkoutFeedCardProps = {
  post: WorkoutFeedPost;
  colors: SocialPalette;
};

function formatSessionDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

export default function WorkoutFeedCard({
  post,
  colors,
}: WorkoutFeedCardProps) {
  const visibleExercises = useMemo(
    () => post.exercises.slice(0, 3),
    [post.exercises],
  );
  const remainingCount = Math.max(
    post.exercises.length - visibleExercises.length,
    0,
  );
  const title = post.split_name?.trim() || post.workout_name;
  const durationLabel = formatDuration(post.duration);

  const [ postInfo, setPostInfo ] = useState<PostInfo | null>(null);
  
  const [ key, setKey ] = useState(0);
  const refresh = () => setKey(k => k + 1);

  useEffect(() => {
    api.getPostInfo(post.post_id, true).then(setPostInfo);
  }, [ key ])

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: colors.buttonBg }]}>
          <Text style={[styles.avatarText, { color: colors.buttonText }]}>
            @{post.username.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerTextWrap}>
          <Text style={[styles.username, { color: colors.text }]}>
            @{post.username}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {post.gym_location || "Same gym"} • {formatSessionDate(post.date)}
            {durationLabel ? ` • ${durationLabel}` : ""}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {post.split_name ? (
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {post.workout_name}
        </Text>
      ) : null}

      <View style={styles.exerciseList}>
        {visibleExercises.map((exercise) => (
          <View
            key={`${post.session_id}-${exercise.exercise_id}-${exercise.machine_id ?? "none"}`}
            style={styles.exerciseRow}
          >
            <View
              style={[styles.exerciseDot, { backgroundColor: colors.tint }]}
            />
            <View style={styles.exerciseTextWrap}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>
                {exercise.exercise_name}
              </Text>
              <Text style={[styles.exerciseMeta, { color: colors.muted }]}>
                {exercise.sets} x {exercise.reps}
                {exercise.weight != null ? ` @ ${exercise.weight} lbs` : ""}
                {exercise.machine_name ? ` • ${exercise.machine_name}` : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {remainingCount > 0 ? (
        <View style={styles.moreRow}>
          <Ionicons name="ellipsis-horizontal" size={14} color={colors.muted} />
          <Text style={[styles.moreText, { color: colors.muted }]}>
            and {remainingCount} more exercise{remainingCount === 1 ? "" : "s"}
          </Text>
        </View>
      ) : null}

      {postInfo ? (<View style={{ marginTop: 10, flexDirection: "row", gap: 12 }}>
        <LikeButton 
          likes={postInfo.likes}
          likePost={() => {
            api.likePost(post.post_id, false)
              .then(refresh);
          }}
          unlikePost={() => {
            api.unlikePost(post.post_id, false)
            .then(refresh);
          }}
        />

        {['🔥', '💪', '🙌'].map(reaction => (
          <ReactionButton 
            key={reaction}
            reaction={reaction}
            reactions={postInfo.reactions}
            reactPost={(reaction: string) => {
              api.reactToPost(post.post_id, false, reaction)
                .then(refresh);
            }}
            unreactPost={() => {
              api.unreactToPost(post.post_id, false)
              .then(refresh);
            }}
          />
        ))}

        <CommentsButton comments={postInfo.comments} postComment={(text) => {
          api.commentOnPost(post.post_id, false, text)
            .then(refresh);
        }} />
        
      </View>) : <Text style={{ color: colors.muted, marginTop: 10 }}>Loading...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerTextWrap: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    marginTop: -6,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  exerciseTextWrap: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  exerciseMeta: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
