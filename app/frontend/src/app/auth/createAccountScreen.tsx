import React from "react";
import LoginButton from "@/components/ForgeButton";
import LoginTextBox from "@/components/ForgeTextBox";
import { StyleSheet, View, Text } from "react-native";
import { useRouter } from "expo-router/build/exports";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuth } from "@/core/auth";
import { api, setToken } from "@/core/api";
import { Schemes } from "@/constants/Colors";
import { useAppColorScheme } from "@/core/accessibility";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === "web"
    ? "http://localhost:8000"
    : expoHost
      ? `http://${expoHost}:8000`
      : "http://localhost:8000");

type TemporaryOnboardingSeed = {
  bio: string;
  gymLocation: string;
  onboarding: {
    healthScore: number;
    age: number;
    height: number;
    weight: number;
    genderIndex: number;
    activityIndex: number;
    calorie_goal: number;
    goals: string;
    previousExperience: string;
    bio: string;
    acceptedTerms: boolean;
  };
};

const TEST_GYM_LOCATION = "Temporary Test Gym";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildTemporaryOnboardingSeed(
  username: string,
): TemporaryOnboardingSeed {
  const goals = [
    "Build muscle and stay consistent",
    "Lose fat while keeping strength",
    "Improve general fitness and routine",
    "Stay active and hit protein goals",
  ];
  const experienceLevels = [
    "Beginner testing account",
    "Intermediate lifter testing account",
    "Experienced gym user testing account",
  ];
  const bios = [
    `Temporary Forge test account for ${username}.`,
    `Auto-filled onboarding for ${username}.`,
    `Quick test user profile for ${username}.`,
  ];

  const bio = pickOne(bios);

  return {
    bio,
    gymLocation: TEST_GYM_LOCATION,
    onboarding: {
      healthScore: randInt(55, 90),
      age: randInt(18, 40),
      height: randInt(62, 76),
      weight: randInt(130, 230),
      genderIndex: randInt(0, 1),
      activityIndex: randInt(0, 4),
      calorie_goal: randInt(2100, 3000),
      goals: pickOne(goals),
      previousExperience: pickOne(experienceLevels),
      bio,
      acceptedTerms: true,
    },
  };
}

const CreateAccountScreen = () => {
  const router = useRouter();
  const { setLoggedIn, setCurrentUser } = useAuth();
  const scheme = useAppColorScheme() ?? "light";

  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const createAccount = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/create_account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      });

      const raw = await response.text();
      let data: any = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        alert(`Error: ${data?.detail ?? raw ?? "Request failed"}`);
      } else {
        setToken(data.access_token ?? null);
        setCurrentUser({
          email,
          username,
        });
        setLoggedIn(true);
        router.replace("./onboarding");
      }
    } catch (error) {
      console.log("Full error:", error);
      alert(`Server did not connect properly. API: ${BASE_URL}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Schemes[scheme].background },
      ]}
    >
      <Text style={[styles.title, { color: Schemes[scheme].text }]}>
        Create Account
      </Text>

      <LoginTextBox
        label="Email"
        value={email}
        onChangeText={setEmail}
        isVisible={true}
      />
      <LoginTextBox
        label="Username"
        value={username}
        onChangeText={setUsername}
        isVisible={true}
      />
      <LoginTextBox
        label="Password"
        value={password}
        onChangeText={setPassword}
        maxLength={20}
        isVisible={false}
      />

      <LoginButton
        onPress={createAccount}
        text={isSubmitting ? "Working..." : "Create Account"}
        disabled={isSubmitting}
      />
      <LoginButton
        onPress={() => router.replace("./loginScreen")}
        text="Back to Login"
        disabled={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: "bold",
  },
  temporaryButton: {
    marginTop: 8,
  },
});

export default CreateAccountScreen;
