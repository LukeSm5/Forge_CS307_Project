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

/* ─── Group Goal types ─── */

type GoalUnit =
  | "kg"
  | "lbs"
  | "km"
  | "miles"
  | "sessions"
  | "calories"
  | "steps"
  | "minutes";

type GroupGoalMember = {
  profileId: number;
  username: string;
  progress: number;
  joinedAt: string;
};

type GroupGoal = {
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  unit: GoalUnit;
  createdAt: string;
  createdBy: string;
  members: GroupGoalMember[];
  completedAt?: string | null;
};

type CreateGoalModalState = {
  visible: boolean;
  loading: boolean;
  title: string;
  description: string;
  targetValue: string;
  unit: GoalUnit;
};

type LogProgressModalState = {
  visible: boolean;
  loading: boolean;
  goal: GroupGoal | null;
  amount: string;
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
                        onPress={() => router.push("../ProgressionScreen")}
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
