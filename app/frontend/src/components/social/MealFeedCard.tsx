import { removeSharedMeal, SharedMeal } from "@/core/sharedMealsStore";
import { View, Text, useScheme } from "@/components/Themed";
import { ActivityIndicator, Alert, Pressable, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { api, PostInfo } from "@/core/api";
import LikeButton from "./LikeButton";
import ReactionButton from "./ReactionButton";
import CommentsButton from "./comments/CommentsButton";

export default function MealFeedCard({ meal }: { meal: SharedMeal }) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleRemoveSharedMeal = async (shareId: string) => {
        try {
            await removeSharedMeal(shareId);
        } catch (e) {
            console.error(e);
        }
    };

    const [ postInfo, setPostInfo ] = useState<PostInfo | null>(null);

    const [ key, setKey ] = useState(0);
    const refresh = () => setKey(k => k + 1);

    useEffect(() => {
        if (meal.postId !== undefined)
            api.getPostInfo(meal.postId, true).then(setPostInfo);
    }, [ key ])

    const scheme = useScheme();
    const colors = {
        screenBg: scheme.secondaryBackground,
        cardBg: scheme.background,
        text: scheme.text,
        muted: scheme.secondaryText,
        border: scheme.neutralColor,
        soft: scheme.secondaryBackground,
        inputBg: scheme.background,
        inputBorder: scheme.neutralColor,
        placeholder: scheme.secondaryText,
        orange: scheme.buttonBg,
        orangeGlow: scheme.buttonBg,
        red: scheme.dangerColor,
        friendBg: scheme.secondaryBackground,
        friendBorder: scheme.tint,
        flagBg: scheme.secondaryBackground,
        flagBorder: scheme.dangerColor,
        modalBackdrop: scheme.backdrop,
        modalCardBg: scheme.background,
        modalSecondaryBg: scheme.secondaryBackground,
        buttonBg: scheme.buttonBg,
        buttonSecondaryBg: scheme.buttonSecondaryBg,
        buttonText: scheme.buttonText,
    };

    const handleDownloadMeal = async (meal: SharedMeal) => {
        if (!meal.postId) return;
            setDownloadingId(meal.shareId);
        try {
            await api.saveMealFromFeed(meal.postId);
            Alert.alert(
            "Saved!",
            `"${meal.name}" has been added to your meal library.`,
            );
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not save meal. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (<>
        <View
            key={meal.shareId}
            style={[
            styles.profileRow,
            {
                backgroundColor: colors.soft,
                borderColor: colors.border,
            },
            ]}
        >
            <View style={styles.profileMain}>
            {/* Meal name + poster */}
            <Text style={[styles.usernameText, { color: colors.text }]}>
                {meal.name}
            </Text>
            {meal.username ? (
                <Text
                style={[styles.locationText, { color: colors.orange }]}
                >
                @{meal.username}
                </Text>
            ) : null}

            {/* Source subtitle */}
            {meal.source === "restaurant" && meal.restaurant ? (
                <Text style={[styles.bioText, { color: colors.muted }]}>
                {meal.restaurant}
                {meal.category ? ` · ${meal.category}` : ""}
                {meal.mealType
                    ? ` · ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`
                    : ""}
                </Text>
            ) : null}
            {meal.source === "tagged" && (meal.cuisine || meal.goal) ? (
                <Text style={[styles.bioText, { color: colors.muted }]}>
                {[meal.cuisine, meal.goal, meal.complexity]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
            ) : null}

            {/* Macro chips */}
            <View
                style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 6,
                }}
            >
                {meal.calories != null ? (
                <View
                    style={[
                    styles.macroPill,
                    {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                    },
                    ]}
                >
                    <Text
                    style={[
                        styles.macroPillText,
                        { color: colors.orange },
                    ]}
                    >
                    {meal.calories} kcal
                    </Text>
                </View>
                ) : null}
                {meal.protein != null ? (
                <View
                    style={[
                    styles.macroPill,
                    {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                    },
                    ]}
                >
                    <Text
                    style={[styles.macroPillText, { color: "#60a5fa" }]}
                    >
                    {meal.protein}g protein
                    </Text>
                </View>
                ) : null}
                {meal.carbs != null ? (
                <View
                    style={[
                    styles.macroPill,
                    {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                    },
                    ]}
                >
                    <Text
                    style={[styles.macroPillText, { color: "#a78bfa" }]}
                    >
                    {meal.carbs}g carbs
                    </Text>
                </View>
                ) : null}
                {meal.fat != null ? (
                <View
                    style={[
                    styles.macroPill,
                    {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                    },
                    ]}
                >
                    <Text
                    style={[styles.macroPillText, { color: "#fbbf24" }]}
                    >
                    {meal.fat}g fat
                    </Text>
                </View>
                ) : null}
            </View>

            <Text
                style={[
                styles.bioText,
                { color: colors.muted, marginTop: 6 },
                ]}
            >
                {new Date(meal.sharedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                })}
            </Text>
            </View>

            <View style={styles.actionsCol}>
            {/* Download — save to diet tab meal library */}
            <Pressable
                onPress={() => handleDownloadMeal(meal)}
                disabled={downloadingId === meal.shareId}
                style={({ pressed }) => [
                styles.iconButton,
                {
                    backgroundColor: colors.friendBg,
                    borderColor: colors.friendBorder,
                },
                pressed && styles.pressed,
                downloadingId === meal.shareId && { opacity: 0.5 },
                ]}
            >
                {downloadingId === meal.shareId ? (
                <ActivityIndicator size="small" />
                ) : (
                <Text
                    style={[
                    styles.friendButtonText,
                    { color: colors.orange },
                    ]}
                >
                    ↓
                </Text>
                )}
            </Pressable>

            {/* Remove from feed */}
            <Pressable
                onPress={() => handleRemoveSharedMeal(meal.shareId)}
                style={({ pressed }) => [
                styles.iconButton,
                {
                    backgroundColor: colors.flagBg,
                    borderColor: colors.flagBorder,
                },
                pressed && styles.pressed,
                ]}
            >
                <Text style={[styles.flagButtonText, { color: colors.red }]}>
                ✕
                </Text>
            </Pressable>
            </View>

            {(postInfo) ? (<View style={{ marginTop: 10, flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                    <LikeButton 
                      likes={postInfo.likes}
                      likePost={() => {
                        api.likePost(meal.postId as number, true)
                          .then(refresh);
                      }}
                      unlikePost={() => {
                        api.unlikePost(meal.postId as number, true)
                        .then(refresh);
                      }}
                    />
            
                    {['🔥', '💪', '🙌'].map(reaction => (
                      <ReactionButton 
                        key={reaction}
                        reaction={reaction}
                        reactions={postInfo.reactions}
                        reactPost={(reaction: string) => {
                          api.reactToPost(meal.postId as number, true, reaction)
                            .then(refresh);
                        }}
                        unreactPost={() => {
                          api.unreactToPost(meal.postId as number, true)
                          .then(refresh);
                        }}
                      />
                    ))}
            
                    <CommentsButton comments={postInfo.comments} postComment={(text) => {
                      api.commentOnPost(meal.postId as number, true, text)
                        .then(refresh);
                    }} />
                    
                  </View>) : <Text style={{ color: colors.muted, marginTop: 10 }}>Loading...</Text>}
        </View>
    </>);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    padding: 16,
  },

  headerCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  searchRow: {
    marginTop: 4,
  },

  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  buttonWrap: {
    flex: 1,
  },

  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },

  inlineResults: {
    marginTop: 16,
  },

  centerState: {
    paddingVertical: 28,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  stateText: {
    fontSize: 14,
    textAlign: "center",
  },

  resultsList: {
    gap: 10,
  },

  feedList: {
    gap: 12,
    marginTop: 14,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },

  profileMain: {
    flex: 1,
  },

  usernameText: {
    fontSize: 16,
    fontWeight: "700",
  },

  locationText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  streakBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },

  streakBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  actionsCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  friendButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },

  flagButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.8,
  },

  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },

  modalLoadingWrap: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  modalBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },

  profileDetailHero: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },

  profileDetailStreakNumber: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
  },

  profileDetailStreakLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },

  profileDetailSection: {
    marginTop: 10,
  },

  profileDetailLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  modalDangerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  macroPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  macroPillText: {
    fontSize: 11,
    fontWeight: "600",
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },

  /* ─── Group Goal styles ─── */
  goalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  createGoalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  createGoalBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  goalBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  goalBarFill: {
    height: 6,
    borderRadius: 3,
  },
  goalBarLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  goalMemberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  goalActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  goalActionBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  goalActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  goalFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  goalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  goalInputMulti: {
    height: 72,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  goalTargetRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

