import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import ForgeButton from "@/components/ForgeButton";
import { Text, useScheme } from "@/components/Themed";
import SocialActionButtons from "@/components/social/SocialActionButtons";
import SocialChatButton from "@/components/social/SocialChatButton";
import SocialChatsOverlay from "@/components/social/chats";
import SocialPreviewCard from "@/components/social/SocialPreviewCard";
import WorkoutFeedCard from "@/components/social/WorkoutFeedCard";
import { SocialPanel } from "@/components/social/socialTypes";
import {
  SharedMeal,
  subscribeToSharedMeals,
  removeSharedMeal,
  refreshFeed,
} from "@/core/sharedMealsStore";
import {
  api,
  SavedMealPost,
  WorkoutFeedPost,
  GroupGoal as ApiGroupGoal,
  CreateGroupGoalRequest,
} from "@/core/api";
import MealFeedCard from "@/components/social/MealFeedCard";
import {
  ProfileSearchResult,
  ProfileDetailModalState,
  ReportModalState,
  FlagModalState,
  GoalUnit,
  FriendModalState,
  CreateGoalModalState,
  LogProgressModalState,
  GroupGoal,
  FriendshipAction,
} from "@/components/social/socialTypes";
import { styles } from "@/components/social/socialStyles";
import { useSocialColors } from "@/components/social/useSocialColors";
import FriendModal from "../social/friendModal"
import FlagModal from "../social/flagModal"

export default function ProfilesTab() {
  const scheme = useScheme();
  const tabBarHeight = useBottomTabBarHeight();

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
  const router = useRouter();
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

  /* ─── Group Goals ─── */
  const GOAL_UNITS: GoalUnit[] = [
    "kg",
    "lbs",
    "km",
    "miles",
    "sessions",
    "calories",
    "steps",
    "minutes",
  ];

  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [createGoalModal, setCreateGoalModal] = useState<CreateGoalModalState>({
    visible: false,
    loading: false,
    title: "",
    description: "",
    targetValue: "",
    unit: "sessions",
  });
  const [logProgressModal, setLogProgressModal] =
    useState<LogProgressModalState>({
      visible: false,
      loading: false,
      goal: null,
      amount: "",
    });

  const closeCreateGoalModal = () =>
    setCreateGoalModal({
      visible: false,
      loading: false,
      title: "",
      description: "",
      targetValue: "",
      unit: "sessions",
    });

  const closeLogProgressModal = () =>
    setLogProgressModal({
      visible: false,
      loading: false,
      goal: null,
      amount: "",
    });

  useEffect(() => {
    setGoalsLoading(true);
    api
      .getGroupGoals()
      .then((data) => setGroupGoals(data as unknown as GroupGoal[]))
      .catch((e) => console.error(e))
      .finally(() => setGoalsLoading(false));
  }, []);

  const handleCreateGoal = async () => {
    const { title, description, targetValue, unit } = createGoalModal;
    if (!title.trim()) {
      Alert.alert("Missing info", "Please enter a goal title.");
      return;
    }
    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) {
      Alert.alert("Missing info", "Please enter a valid target value.");
      return;
    }
    setCreateGoalModal((prev) => ({ ...prev, loading: true }));
    try {
      const newGoal = (await api.createGroupGoal({
        title: title.trim(),
        description: description.trim(),
        targetValue: target,
        unit,
      } as CreateGroupGoalRequest)) as unknown as GroupGoal;
      setGroupGoals((prev) => [newGoal, ...prev]);
      closeCreateGoalModal();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not create goal. Please try again.");
      setCreateGoalModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleLogProgress = async () => {
    if (!logProgressModal.goal) return;
    const amount = parseFloat(logProgressModal.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a number greater than 0.");
      return;
    }
    setLogProgressModal((prev) => ({ ...prev, loading: true }));
    try {
      const updated = (await api.logGoalProgress(
        logProgressModal.goal.goalId,
        amount,
      )) as unknown as GroupGoal;
      const wasComplete = !!logProgressModal.goal.completedAt;
      setGroupGoals((prev) =>
        prev.map((g) => (g.goalId === updated.goalId ? updated : g)),
      );
      closeLogProgressModal();
      if (updated.completedAt && !wasComplete) {
        Alert.alert(
          "🎉 Goal Complete!",
          `"${updated.title}" has been completed by the group!`,
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not log progress. Please try again.");
      setLogProgressModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleLeaveGoal = (goal: GroupGoal) => {
    Alert.alert(
      "Leave Goal",
      `Leave "${goal.title}"? Your progress will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await api.leaveGroupGoal(goal.goalId);
              setGroupGoals((prev) =>
                prev.filter((g) => g.goalId !== goal.goalId),
              );
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not leave goal. Please try again.");
            }
          },
        },
      ],
    );
  };

  const goalTotalProgress = (goal: GroupGoal) =>
    goal.members.reduce((sum, m) => sum + m.progress, 0);

  const goalProgressPct = (goal: GroupGoal) =>
    Math.min(goalTotalProgress(goal) / goal.targetValue, 1);

  const [sharedMeals, setSharedMeals] = useState<SharedMeal[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [gymWorkouts, setGymWorkouts] = useState<WorkoutFeedPost[]>([]);
  const [gymFeedLoading, setGymFeedLoading] = useState(false);
  const [gymFeedError, setGymFeedError] = useState("");
  const [friendWorkouts, setFriendWorkouts] = useState<WorkoutFeedPost[]>([]);
  const [friendFeedLoading, setFriendFeedLoading] = useState(false);
  const [friendFeedError, setFriendFeedError] = useState("");
  const [activeSocialPanel, setActiveSocialPanel] =
    useState<SocialPanel>("friends");
  const [chatsOverlayVisible, setChatsOverlayVisible] = useState(false);
  const [chatListRefreshKey, setChatListRefreshKey] = useState(0);
  const colors = useSocialColors();

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

  const loadFriendsWorkoutFeed = useCallback(async () => {
    try {
      setFriendFeedLoading(true);
      setFriendFeedError("");
      const rows = await api.getFriendsWorkoutFeed();
      setFriendWorkouts(rows);
    } catch (e) {
      console.error(e);
      setFriendFeedError("Could not load friends' workouts right now.");
    } finally {
      setFriendFeedLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeSocialPanel === "gym") {
        void loadGymWorkoutFeed();
      } else if (activeSocialPanel === "friends") {
        void loadFriendsWorkoutFeed();
      }
      return undefined;
    }, [activeSocialPanel, loadGymWorkoutFeed, loadFriendsWorkoutFeed]),
  );

  useEffect(() => {
    if (activeSocialPanel === "gym") {
      void loadGymWorkoutFeed();
    } else if (activeSocialPanel === "friends") {
      void loadFriendsWorkoutFeed();
    }
  }, [activeSocialPanel, loadGymWorkoutFeed, loadFriendsWorkoutFeed]);

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
        current.map((item) => (item.id === profile.id ? updatedProfile : item)),
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
          setChatListRefreshKey((prev) => prev + 1);
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
              Recent workout posts from users who selected the same gym location
              as you.
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
                No posted workouts yet for your gym.
              </Text>
            ) : (
              <View style={styles.feedList}>
                {gymWorkouts.map((post) => (
                  <WorkoutFeedCard
                    key={`${post.session_id}-${post.profile_id}`}
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
        ) : activeSocialPanel === "friends" ? (
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
              FRIENDS WORKOUT FEED
            </Text>
            <Text
              style={[
                styles.stateText,
                { color: colors.muted, textAlign: "left" },
              ]}
            >
              Posted workouts from your accepted friends.
            </Text>

            {friendFeedLoading ? (
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
                  Loading friends posts...
                </Text>
              </View>
            ) : friendFeedError ? (
              <Text style={[styles.errorText, { color: colors.red }]}>
                {friendFeedError}
              </Text>
            ) : friendWorkouts.length === 0 ? (
              <Text
                style={[
                  styles.stateText,
                  { color: colors.muted, marginTop: 12, textAlign: "left" },
                ]}
              >
                No posted workouts yet from your accepted friends.
              </Text>
            ) : (
              <View style={styles.feedList}>
                {friendWorkouts.map((post) => (
                  <WorkoutFeedCard
                    key={`${post.session_id}-${post.profile_id}`}
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
                      <Pressable
                        onPress={() => router.push({
                          pathname: "../ProgressionScreen",
                          params: { userId: profile.id }
                        })}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            backgroundColor: colors.friendBg,
                            borderColor: colors.friendBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Image
                          source={require("../../../assets/images/Progression_Picture-removebg-preview.png")}
                          style={{ width: 20, height: 20 }}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ─── GROUP GOALS ─── */}
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
          <View style={styles.goalHeaderRow}>
            <Text
              style={[
                styles.eyebrow,
                { color: colors.orange, marginBottom: 0 },
              ]}
            >
              GROUP GOALS
            </Text>
            <Pressable
              onPress={() =>
                setCreateGoalModal((prev) => ({ ...prev, visible: true }))
              }
              style={({ pressed }) => [
                styles.createGoalBtn,
                { backgroundColor: colors.orange, borderColor: colors.orange },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.createGoalBtnText}>+ Create</Text>
            </Pressable>
          </View>

          {goalsLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : groupGoals.length === 0 ? (
            <Text
              style={[
                styles.stateText,
                { color: colors.muted, marginTop: 10, textAlign: "left" },
              ]}
            >
              No group goals yet. Create one to get started!
            </Text>
          ) : (
            <View style={{ gap: 10, marginTop: 10 }}>
              {groupGoals.map((goal) => {
                const pct = goalProgressPct(goal);
                const total = goalTotalProgress(goal);
                const isExpanded = expandedGoalId === goal.goalId;
                const isComplete = !!goal.completedAt;
                return (
                  <View
                    key={goal.goalId}
                    style={[
                      styles.profileRow,
                      {
                        backgroundColor: colors.soft,
                        borderColor: isComplete ? colors.orange : colors.border,
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 10,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        setExpandedGoalId(isExpanded ? null : goal.goalId)
                      }
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.usernameText, { color: colors.text }]}
                        >
                          {goal.title}
                          {isComplete ? "  ✓" : ""}
                        </Text>
                        <Text style={[styles.bioText, { color: colors.muted }]}>
                          by @{goal.createdBy} · {goal.members.length} member
                          {goal.members.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Text style={[styles.bioText, { color: colors.orange }]}>
                        {isExpanded ? "▲" : "▼"}
                      </Text>
                    </Pressable>

                    <View>
                      <View
                        style={[
                          styles.goalBarTrack,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.goalBarFill,
                            {
                              width: `${Math.round(pct * 100)}%` as any,
                              backgroundColor: colors.orange,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.goalBarLabelRow}>
                        <Text
                          style={[styles.goalBarLabel, { color: colors.muted }]}
                        >
                          {total % 1 === 0 ? total : total.toFixed(1)} /{" "}
                          {goal.targetValue} {goal.unit}
                        </Text>
                        <Text
                          style={[
                            styles.goalBarLabel,
                            { color: colors.orange },
                          ]}
                        >
                          {Math.round(pct * 100)}%
                        </Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <>
                        {goal.description ? (
                          <Text
                            style={[styles.bioText, { color: colors.muted }]}
                          >
                            {goal.description}
                          </Text>
                        ) : null}
                        <View style={{ gap: 6 }}>
                          {goal.members.map((member) => (
                            <View
                              key={member.profileId}
                              style={[
                                styles.goalMemberRow,
                                { borderColor: colors.border },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.locationText,
                                  { color: colors.text, marginTop: 0 },
                                ]}
                              >
                                @{member.username}
                              </Text>
                              <Text
                                style={[
                                  styles.goalBarLabel,
                                  { color: colors.orange },
                                ]}
                              >
                                {member.progress % 1 === 0
                                  ? member.progress
                                  : member.progress.toFixed(1)}{" "}
                                {goal.unit}
                              </Text>
                            </View>
                          ))}
                        </View>
                        {!isComplete && (
                          <View style={styles.goalActionRow}>
                            <Pressable
                              onPress={() =>
                                setLogProgressModal({
                                  visible: true,
                                  loading: false,
                                  goal,
                                  amount: "",
                                })
                              }
                              style={({ pressed }) => [
                                styles.goalActionBtn,
                                {
                                  backgroundColor: colors.friendBg,
                                  borderColor: colors.friendBorder,
                                },
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.goalActionBtnText,
                                  { color: colors.orange },
                                ]}
                              >
                                Log progress
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleLeaveGoal(goal)}
                              style={({ pressed }) => [
                                styles.goalActionBtn,
                                {
                                  backgroundColor: colors.flagBg,
                                  borderColor: colors.flagBorder,
                                },
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.goalActionBtnText,
                                  { color: colors.red },
                                ]}
                              >
                                Leave
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
              {sharedMeals.map((meal, idx) => <MealFeedCard key={idx} meal={meal} />)}
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
        onPress={() => setChatsOverlayVisible(true)}
      />

      <SocialChatsOverlay
        visible={chatsOverlayVisible}
        onClose={() => setChatsOverlayVisible(false)}
        refreshKey={chatListRefreshKey}
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
                    style={[
                      styles.profileDetailLabel,
                      { color: colors.orange },
                    ]}
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
                    style={[
                      styles.profileDetailLabel,
                      { color: colors.orange },
                    ]}
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
      <FriendModal
        state={friendModal}
        onClose={closeFriendModal}
        onConfirm={handleConfirmFriendAction}
      />
      <FlagModal
        state={flagModal}
        onClose={closeFlagModal}
        onGoToBlock={() => setFlagModal((prev) => ({ ...prev, step: "block_confirm"}))}
        onGoToReport={() => setFlagModal((prev) => ({...prev, step: "report"}))}
        onGoToChoose={() => setFlagModal((prev) => ({...prev, step: "choose"}))}
        onConfirmBlock={handleConfirmBlock}
        onSubmitReport={handleSubmitReport}
        onChangeDescription={(t) => setFlagModal((prev) => ({ ...prev, description: t}))}
      />

      {/* ─── CREATE GROUP GOAL MODAL ─── */}
      <Modal
        visible={createGoalModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeCreateGoalModal}
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
            {createGoalModal.loading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Creating goal...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Create Group Goal
                </Text>

                <Text style={[styles.goalFieldLabel, { color: colors.muted }]}>
                  Title
                </Text>
                <TextInput
                  value={createGoalModal.title}
                  onChangeText={(t) =>
                    setCreateGoalModal((prev) => ({ ...prev, title: t }))
                  }
                  placeholder="e.g. Run 50km together"
                  placeholderTextColor={colors.placeholder}
                  keyboardAppearance={scheme.keyboard}
                  style={[
                    styles.goalInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                />

                <Text style={[styles.goalFieldLabel, { color: colors.muted }]}>
                  Description (optional)
                </Text>
                <TextInput
                  value={createGoalModal.description}
                  onChangeText={(t) =>
                    setCreateGoalModal((prev) => ({ ...prev, description: t }))
                  }
                  placeholder="What are you working toward?"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={2}
                  keyboardAppearance={scheme.keyboard}
                  style={[
                    styles.goalInput,
                    styles.goalInputMulti,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                />

                <View style={styles.goalTargetRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.goalFieldLabel, { color: colors.muted }]}
                    >
                      Target
                    </Text>
                    <TextInput
                      value={createGoalModal.targetValue}
                      onChangeText={(t) =>
                        setCreateGoalModal((prev) => ({
                          ...prev,
                          targetValue: t,
                        }))
                      }
                      placeholder="100"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      keyboardAppearance={scheme.keyboard}
                      style={[
                        styles.goalInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                        },
                      ]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.goalFieldLabel, { color: colors.muted }]}
                    >
                      Unit
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 6,
                          paddingVertical: 4,
                        }}
                      >
                        {GOAL_UNITS.map((u) => (
                          <Pressable
                            key={u}
                            onPress={() =>
                              setCreateGoalModal((prev) => ({
                                ...prev,
                                unit: u,
                              }))
                            }
                            style={[
                              styles.unitPill,
                              {
                                backgroundColor:
                                  createGoalModal.unit === u
                                    ? colors.orange
                                    : colors.soft,
                                borderColor:
                                  createGoalModal.unit === u
                                    ? colors.orange
                                    : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.unitPillText,
                                {
                                  color:
                                    createGoalModal.unit === u
                                      ? colors.buttonText
                                      : colors.muted,
                                },
                              ]}
                            >
                              {u}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={closeCreateGoalModal}
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
                  <Pressable
                    onPress={handleCreateGoal}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.orange,
                        borderColor: colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalPrimaryButtonText}>Create</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── LOG PROGRESS MODAL ─── */}
      <Modal
        visible={logProgressModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeLogProgressModal}
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
            {logProgressModal.loading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Saving progress...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Log Progress
                </Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  {logProgressModal.goal?.title}
                </Text>
                <Text
                  style={[
                    styles.goalFieldLabel,
                    { color: colors.muted, marginTop: 14 },
                  ]}
                >
                  Amount ({logProgressModal.goal?.unit})
                </Text>
                <TextInput
                  value={logProgressModal.amount}
                  onChangeText={(t) =>
                    setLogProgressModal((prev) => ({ ...prev, amount: t }))
                  }
                  placeholder="e.g. 5"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  keyboardAppearance={scheme.keyboard}
                  autoFocus
                  style={[
                    styles.goalInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                />
                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={closeLogProgressModal}
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
                  <Pressable
                    onPress={handleLogProgress}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.orange,
                        borderColor: colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.modalPrimaryButtonText}>Save</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
