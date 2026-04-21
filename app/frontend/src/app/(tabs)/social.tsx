import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import ForgeButton from "@/components/ForgeButton";
import { Text, useScheme } from "@/components/Themed";
import SocialActionButtons from "@/components/social/SocialActionButtons";
import SocialChatButton from "@/components/social/SocialChatButton";
import SocialPreviewCard from "@/components/social/SocialPreviewCard";
import WorkoutFeedCard from "@/components/social/WorkoutFeedCard";
import { SocialPanel } from "@/components/social/socialTypes";
import {
  SharedMeal,
  subscribeToSharedMeals,
  removeSharedMeal,
  refreshFeed,
} from "@/core/sharedMealsStore";
import { api, SavedMealPost, WorkoutFeedPost } from "@/core/api";

type ProfileSearchResult = {
  id: number | string;
  username: string;
  gymLocation?: string | null;
  bio?: string | null;
  workoutStreakWeeks?: number;
};

type FriendshipAction = "send" | "remove" | "cancel" | "accept";

type FriendModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  action: FriendshipAction | null;
};

type ProfileDetailModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  error: string;
};

type ReportModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  description: string;
  blockAfter: boolean; // checkbox option to also block after reporting
};

type FlagStep = "choose" | "block_confirm" | "report";

type FlagModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  step: FlagStep | null;
  isBlocked: boolean; // whether me -> them block already exists
  description: string;
};

export default function ProfilesTab() {
  const scheme = useScheme();
  const tabBarHeight = useBottomTabBarHeight();

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
    orange: scheme.tint,
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

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [friendModal, setFriendModal] = useState<FriendModalState>({
    visible: false,
    loading: false,
    profile: null,
    action: null,
  });
  const [profileDetailModal, setProfileDetailModal] =
    useState<ProfileDetailModalState>({
      visible: false,
      loading: false,
      profile: null,
      error: "",
    });
  const [reportModal, setReportModal] = useState<ReportModalState>({
    visible: false,
    loading: false,
    profile: null,
    description: "",
    blockAfter: false,
  });
  const closeReportModal = () => {
    setReportModal({
      visible: false,
      loading: false,
      profile: null,
      description: "",
      blockAfter: false,
    });
  };
  const [flagModal, setFlagModal] = useState<FlagModalState>({
    visible: false,
    loading: false,
    profile: null,
    step: null,
    isBlocked: false,
    description: "",
  });

  const closeFlagModal = () => {
    setFlagModal({
      visible: false,
      loading: false,
      profile: null,
      step: null,
      isBlocked: false,
      description: "",
    });
  };
  const [sharedMeals, setSharedMeals] = useState<SharedMeal[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [gymWorkouts, setGymWorkouts] = useState<WorkoutFeedPost[]>([]);
  const [gymFeedLoading, setGymFeedLoading] = useState(false);
  const [gymFeedError, setGymFeedError] = useState("");
  const [activeSocialPanel, setActiveSocialPanel] =
    useState<SocialPanel>("friends");

  useEffect(() => {
    return subscribeToSharedMeals(setSharedMeals);
  }, []);

  /* Fetch feed from backend on mount */
  useEffect(() => {
    setFeedLoading(true);
    setFeedError("");
    refreshFeed()
      .catch(() => setFeedError("Could not load feed."))
      .finally(() => setFeedLoading(false));
  }, []);

  const handleRemoveSharedMeal = async (shareId: string) => {
    try {
      await removeSharedMeal(shareId);
    } catch (e) {
      console.error(e);
    }
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

  const loadGymWorkoutFeed = useCallback(async () => {
    try {
      setGymFeedLoading(true);
      setGymFeedError("");
      const rows = await api.getGymWorkoutFeed();
      setGymWorkouts(rows);
    } catch (e) {
      console.error(e);
      setGymFeedError("Could not load gym workouts right now.");
    } finally {
      setGymFeedLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeSocialPanel !== "gym") return undefined;
      void loadGymWorkoutFeed();
      return undefined;
    }, [activeSocialPanel, loadGymWorkoutFeed]),
  );

  useEffect(() => {
    if (activeSocialPanel === "gym") {
      void loadGymWorkoutFeed();
    }
  }, [activeSocialPanel, loadGymWorkoutFeed]);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const handleSearch = async () => {
    if (!trimmedQuery) {
      setError("Enter a username to search.");
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api.searchProfiles(trimmedQuery);

      setResults(
        data.map((p) => ({
          id: p.id,
          username: p.username,
          bio: p.bio,
          gymLocation: p.gym_location,
          workoutStreakWeeks: p.workout_streak_weeks ?? 0,
        })),
      );
    } catch (e) {
      console.error(e);
      setError("Unable to search profiles right now.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setError("");
    setResults([]);
  };

  const closeFriendModal = () => {
    setFriendModal({
      visible: false,
      loading: false,
      profile: null,
      action: null,
    });
  };

  const closeProfileDetailModal = () => {
    setProfileDetailModal({
      visible: false,
      loading: false,
      profile: null,
      error: "",
    });
  };

  const handleOpenProfileDetail = async (profile: ProfileSearchResult) => {
    setProfileDetailModal({
      visible: true,
      loading: true,
      profile,
      error: "",
    });

    try {
      const streak = await api.getProfileStreak(Number(profile.id));
      const updatedProfile = {
        ...profile,
        workoutStreakWeeks: streak.workout_streak_weeks,
      };

      setResults((current) =>
        current.map((item) =>
          item.id === profile.id ? updatedProfile : item,
        ),
      );
      setProfileDetailModal({
        visible: true,
        loading: false,
        profile: updatedProfile,
        error: "",
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unable to load profile streak.";
      setProfileDetailModal({
        visible: true,
        loading: false,
        profile,
        error: message,
      });
    }
  };

  const handleFriendPress = async (profile: ProfileSearchResult) => {
    try {
      setFriendModal({ visible: true, loading: true, profile, action: null });

      const status = await api.checkFriendship(profile.id as number);

      const action: FriendshipAction =
        status === "accepted"
          ? "remove"
          : status === "pending_sent"
            ? "cancel"
            : status === "pending_received"
              ? "accept"
              : "send";

      setFriendModal({ visible: true, loading: false, profile, action });
    } catch (e) {
      console.error(e);
      closeFriendModal();
      setError("Unable to check friendship status right now.");
    }
  };

  const handleConfirmFriendAction = async () => {
    if (!friendModal.profile || !friendModal.action) return;

    try {
      setFriendModal((prev) => ({ ...prev, loading: true }));

      const targetId = friendModal.profile!.id as number;

      switch (friendModal.action) {
        case "send":
          await api.sendFriendRequest(targetId);
          break;
        case "remove":
        case "cancel":
          await api.removeFriend(targetId);
          break;
        case "accept":
          await api.acceptFriendRequest(targetId);
          break;
      }

      closeFriendModal();
    } catch (e) {
      console.error(e);
      setFriendModal((prev) => ({ ...prev, loading: false }));
      setError("Unable to complete that action right now.");
    }
  };

  const handleFlag = async (profile: ProfileSearchResult) => {
    try {
      setFlagModal({
        visible: true,
        loading: true,
        profile,
        step: null,
        isBlocked: false,
        description: "",
      });

      const blockStatus = await api.checkBlock(profile.id as number);

      setFlagModal((prev) => ({
        ...prev,
        loading: false,
        step: "choose",
        isBlocked: blockStatus.i_blocked_them,
      }));
    } catch (e) {
      console.error(e);
      closeFlagModal();
      setError("Unable to load options right now.");
    }
  };

  const handleConfirmBlock = async () => {
    if (!flagModal.profile) return;
    try {
      setFlagModal((prev) => ({ ...prev, loading: true }));

      if (flagModal.isBlocked) {
        await api.unblockUser(flagModal.profile!.id as number);
      } else {
        await api.blockUser(flagModal.profile!.id as number);
      }

      closeFlagModal();
    } catch (e) {
      console.error(e);
      setFlagModal((prev) => ({ ...prev, loading: false }));
      setError("Unable to complete that action right now.");
    }
  };

  const handleSubmitReport = async () => {
    if (!flagModal.profile) return;
    if (!flagModal.description.trim()) {
      setError("Please describe the violation before submitting.");
      return;
    }
    try {
      setFlagModal((prev) => ({ ...prev, loading: true }));
      await api.reportUser(
        flagModal.profile!.id as number,
        flagModal.description.trim(),
      );
      closeFlagModal();
    } catch (e) {
      console.error(e);
      setFlagModal((prev) => ({ ...prev, loading: false }));
      setError("Unable to submit report right now.");
    }
  };

  const modalTitle =
    friendModal.action === "remove"
      ? "Remove Friend?"
      : friendModal.action === "send"
        ? "Send Friend Request?"
        : friendModal.action === "cancel"
          ? "Cancel Request?"
          : friendModal.action === "accept"
            ? "Accept Friend Request?"
            : "";

  const modalBody =
    friendModal.profile && friendModal.action === "remove"
      ? `Remove @${friendModal.profile.username} from your friends list?`
      : friendModal.profile && friendModal.action === "send"
        ? `Send a friend request to @${friendModal.profile.username}?`
        : friendModal.profile && friendModal.action === "cancel"
          ? `Cancel your pending request to @${friendModal.profile.username}?`
          : friendModal.profile && friendModal.action === "accept"
            ? `Accept @${friendModal.profile.username}'s friend request?`
            : "";

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.screenBg }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + 92 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <SocialActionButtons
          activePanel={activeSocialPanel}
          colors={{
            background: colors.cardBg,
            secondaryBackground: colors.soft,
            border: colors.border,
            text: colors.text,
            muted: colors.muted,
            tint: colors.orange,
            buttonBg: colors.buttonBg,
            buttonSecondaryBg: colors.buttonSecondaryBg,
            buttonText: colors.buttonText,
          }}
          onSelectPanel={setActiveSocialPanel}
        />

        {activeSocialPanel === "gym" ? (
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                marginBottom: 16,
              },
            ]}
          >
            <Text style={[styles.eyebrow, { color: colors.orange }]}>
              GYM WORKOUT FEED
            </Text>
            <Text
              style={[
                styles.stateText,
                { color: colors.muted, textAlign: "left" },
              ]}
            >
              Recent workouts logged by people who selected the same gym
              location as you.
            </Text>

            {gymFeedLoading ? (
              <View
                style={[
                  styles.centerState,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    marginTop: 12,
                  },
                ]}
              >
                <ActivityIndicator size="small" />
                <Text style={[styles.stateText, { color: colors.muted }]}>
                  Loading gym posts...
                </Text>
              </View>
            ) : gymFeedError ? (
              <Text style={[styles.errorText, { color: colors.red }]}>
                {gymFeedError}
              </Text>
            ) : gymWorkouts.length === 0 ? (
              <Text
                style={[
                  styles.stateText,
                  { color: colors.muted, marginTop: 12, textAlign: "left" },
                ]}
              >
                No workout posts yet for your gym. Once someone with the same
                selected gym logs a workout, it will show up here.
              </Text>
            ) : (
              <View style={styles.feedList}>
                {gymWorkouts.map((post) => (
                  <WorkoutFeedCard
                    key={post.session_id}
                    post={post}
                    colors={{
                      background: colors.cardBg,
                      secondaryBackground: colors.soft,
                      border: colors.border,
                      text: colors.text,
                      muted: colors.muted,
                      tint: colors.orange,
                      buttonBg: colors.buttonBg,
                      buttonSecondaryBg: colors.buttonSecondaryBg,
                      buttonText: colors.buttonText,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <SocialPreviewCard
            activePanel={activeSocialPanel}
            colors={{
              background: colors.cardBg,
              secondaryBackground: colors.soft,
              border: colors.border,
              text: colors.text,
              muted: colors.muted,
              tint: colors.orange,
              buttonBg: colors.buttonBg,
              buttonSecondaryBg: colors.buttonSecondaryBg,
              buttonText: colors.buttonText,
            }}
          />
        )}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.orange }]}>
            PROFILE SEARCH
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Enter username"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              keyboardAppearance={scheme.keyboard}
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.buttonRow}>
            <View style={styles.buttonWrap}>
              <ForgeButton onPress={handleSearch} text="Search" />
            </View>
            <View style={styles.buttonWrap}>
              <ForgeButton onPress={handleClear} text="Clear" />
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.red }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.inlineResults}>
            {loading ? (
              <View
                style={[
                  styles.centerState,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ActivityIndicator size="small" />
                <Text style={[styles.stateText, { color: colors.muted }]}>
                  Searching profiles...
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {results.map((profile) => (
                  <View
                    key={profile.id}
                    style={[
                      styles.profileRow,
                      {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleOpenProfileDetail(profile)}
                      style={({ pressed }) => [
                        styles.profileMain,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[styles.usernameText, { color: colors.text }]}
                      >
                        @{profile.username}
                      </Text>

                      <Text
                        style={[styles.locationText, { color: colors.orange }]}
                      >
                        {profile.gymLocation || "No gym location provided"}
                      </Text>

                      <View
                        style={[
                          styles.streakBadge,
                          {
                            backgroundColor: colors.friendBg,
                            borderColor: colors.friendBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.streakBadgeText,
                            { color: colors.orange },
                          ]}
                        >
                          Workout streak: {profile.workoutStreakWeeks ?? 0} week
                          {(profile.workoutStreakWeeks ?? 0) === 1 ? "" : "s"}
                        </Text>
                      </View>

                      <Text
                        style={[styles.bioText, { color: colors.muted }]}
                        numberOfLines={2}
                      >
                        {profile.bio || "No bio provided"}
                      </Text>
                    </Pressable>

                    <View style={styles.actionsCol}>
                      <Pressable
                        onPress={() => handleFriendPress(profile)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            backgroundColor: colors.friendBg,
                            borderColor: colors.friendBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.friendButtonText,
                            { color: colors.orange },
                          ]}
                        >
                          👤
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleFlag(profile)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            backgroundColor: colors.flagBg,
                            borderColor: colors.flagBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.flagButtonText, { color: colors.red }]}
                        >
                          ⚑
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        {/* ─── MEAL FEED ─── */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              marginTop: 16,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.orange }]}>
            MEAL FEED
          </Text>

          {feedLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : feedError ? (
            <Text
              style={[styles.errorText, { color: colors.red, marginTop: 8 }]}
            >
              {feedError}
            </Text>
          ) : sharedMeals.length === 0 ? (
            <Text
              style={[styles.stateText, { color: colors.muted, marginTop: 8 }]}
            >
              No meals shared yet. Share a meal from the Diet tab to get
              started.
            </Text>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {sharedMeals.map((meal) => (
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
                      <Text
                        style={[styles.flagButtonText, { color: colors.red }]}
                      >
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SocialChatButton
        activePanel={activeSocialPanel}
        bottomOffset={tabBarHeight}
        colors={{
          background: colors.cardBg,
          secondaryBackground: colors.soft,
          border: colors.border,
          text: colors.text,
          muted: colors.muted,
          tint: colors.orange,
          buttonBg: colors.buttonBg,
          buttonSecondaryBg: colors.buttonSecondaryBg,
          buttonText: colors.buttonText,
        }}
        onPress={() => setActiveSocialPanel("chats")}
      />

      <Modal
        visible={profileDetailModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeProfileDetailModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: colors.modalBackdrop },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.modalCardBg,
                borderColor: colors.border,
              },
            ]}
          >
            {profileDetailModal.loading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Loading profile...
                </Text>
              </View>
            ) : profileDetailModal.profile ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  @{profileDetailModal.profile.username}
                </Text>

                <View
                  style={[
                    styles.profileDetailHero,
                    {
                      backgroundColor: colors.modalSecondaryBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileDetailStreakNumber,
                      { color: colors.orange },
                    ]}
                  >
                    {profileDetailModal.profile.workoutStreakWeeks ?? 0}
                  </Text>
                  <Text
                    style={[
                      styles.profileDetailStreakLabel,
                      { color: colors.muted },
                    ]}
                  >
                    week workout streak
                  </Text>
                </View>

                <View style={styles.profileDetailSection}>
                  <Text
                    style={[styles.profileDetailLabel, { color: colors.orange }]}
                  >
                    Gym
                  </Text>
                  <Text style={[styles.modalBodyText, { color: colors.text }]}>
                    {profileDetailModal.profile.gymLocation ||
                      "No gym location provided"}
                  </Text>
                </View>

                <View style={styles.profileDetailSection}>
                  <Text
                    style={[styles.profileDetailLabel, { color: colors.orange }]}
                  >
                    Bio
                  </Text>
                  <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                    {profileDetailModal.profile.bio || "No bio provided"}
                  </Text>
                </View>

                {profileDetailModal.error ? (
                  <Text style={[styles.errorText, { color: colors.red }]}>
                    {profileDetailModal.error}
                  </Text>
                ) : null}

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={() => {
                      const profile = profileDetailModal.profile;
                      closeProfileDetailModal();
                      if (profile) handleFriendPress(profile);
                    }}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.friendBg,
                        borderColor: colors.friendBorder,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.orange },
                      ]}
                    >
                      Friend
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={closeProfileDetailModal}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.orange,
                        borderColor: colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalPrimaryButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={friendModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeFriendModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: colors.modalBackdrop },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.modalCardBg,
                borderColor: colors.border,
              },
            ]}
          >
            {friendModal.loading || !friendModal.action ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Checking friendship status...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalTitle}
                </Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  {modalBody}
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={closeFriendModal}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.text },
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmFriendAction}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor:
                          friendModal.action === "remove"
                            ? colors.red
                            : colors.orange,
                        borderColor:
                          friendModal.action === "remove"
                            ? colors.red
                            : colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        friendModal.action === "remove"
                          ? styles.modalDangerButtonText
                          : styles.modalPrimaryButtonText
                      }
                    >
                      Yes
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={flagModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeFlagModal}
      >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: colors.modalBackdrop },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.modalCardBg,
                borderColor: colors.border,
              },
            ]}
          >
            {/* ── LOADING ── */}
            {flagModal.loading || !flagModal.step ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Loading...
                </Text>
              </View>
            ) : /* ── STEP 1: CHOOSE ── */
            flagModal.step === "choose" ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  @{flagModal.profile?.username}
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={() =>
                      setFlagModal((prev) => ({
                        ...prev,
                        step: "block_confirm",
                      }))
                    }
                    style={({ pressed }) => [
                      styles.modalButton,
                      { backgroundColor: colors.red, borderColor: colors.red },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalDangerButtonText}>
                      {flagModal.isBlocked ? "Unblock" : "Block"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setFlagModal((prev) => ({ ...prev, step: "report" }))
                    }
                    style={({ pressed }) => [
                      styles.modalButton,
                      { backgroundColor: colors.red, borderColor: colors.red },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalDangerButtonText}>Report</Text>
                  </Pressable>

                  <Pressable
                    onPress={closeFlagModal}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.text },
                      ]}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : /* ── STEP 2: BLOCK CONFIRM ── */
            flagModal.step === "block_confirm" ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {flagModal.isBlocked ? "Unblock User" : "Block User"}
                </Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  {flagModal.isBlocked
                    ? `Unblock @${flagModal.profile?.username}?`
                    : `Block @${flagModal.profile?.username}? This will also remove any existing friendship.`}
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={() =>
                      setFlagModal((prev) => ({ ...prev, step: "choose" }))
                    }
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.text },
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmBlock}
                    style={({ pressed }) => [
                      styles.modalButton,
                      { backgroundColor: colors.red, borderColor: colors.red },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalDangerButtonText}>Yes</Text>
                  </Pressable>
                </View>
              </>
            ) : /* ── STEP 3: REPORT ── */
            flagModal.step === "report" ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Report User
                </Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Describe the violation by @{flagModal.profile?.username}:
                </Text>

                <TextInput
                  value={flagModal.description}
                  onChangeText={(t) =>
                    setFlagModal((prev) => ({ ...prev, description: t }))
                  }
                  placeholder="Describe what happened..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.reportInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                />

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={() =>
                      setFlagModal((prev) => ({ ...prev, step: "choose" }))
                    }
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.text },
                      ]}
                    >
                      Back
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSubmitReport}
                    style={({ pressed }) => [
                      styles.modalButton,
                      { backgroundColor: colors.red, borderColor: colors.red },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalDangerButtonText}>Submit</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
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
});
