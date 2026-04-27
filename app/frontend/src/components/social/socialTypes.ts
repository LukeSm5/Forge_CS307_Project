export type SocialPanel = 'friends' | 'gym' | 'chats';

export type SocialPalette = {
  background: string;
  secondaryBackground: string;
  border: string;
  text: string;
  muted: string;
  tint: string;
  buttonBg: string;
  buttonSecondaryBg: string;
  buttonText: string;
};

export type ProfileSearchResult = {
  id: number | string;
  username: string;
  gymLocation?: string | null;
  bio?: string | null;
  workoutStreakWeeks?: number;
};

export type FriendshipAction = "send" | "remove" | "cancel" | "accept";

export type ProfileDetailModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  error: string;
};

export type FlagStep = "choose" | "block_confirm" | "report";

export type FlagModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  step: FlagStep | null;
  isBlocked: boolean; // whether me -> them block already exists
  description: string;
};

/* ─── Group Goal types ─── */

export type GoalUnit =
  | "kg"
  | "lbs"
  | "km"
  | "miles"
  | "sessions"
  | "calories"
  | "steps"
  | "minutes";

export type GroupGoalMember = {
  profileId: number;
  username: string;
  progress: number;
  joinedAt: string;
};

export type GroupGoal = {
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

export type CreateGoalModalState = {
  visible: boolean;
  loading: boolean;
  title: string;
  description: string;
  targetValue: string;
  unit: GoalUnit;
};

export type LogProgressModalState = {
  visible: boolean;
  loading: boolean;
  goal: GroupGoal | null;
  amount: string;
};

export type FriendModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  action: FriendshipAction | null;
};