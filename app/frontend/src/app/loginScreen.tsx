import React from "react";
import LoginButton from "../components/ForgeButton";
import LoginTextBox from "../components/ForgeTextBox";
import { StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router/build/exports";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuth } from "@/core/auth";
import { api, setToken } from "@/core/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View } from "@/components/Themed";
import { useAppColorScheme } from "@/core/accessibility";
import { Schemes } from "@/constants/Colors";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === "web"
    ? "http://localhost:8000"
    : expoHost
      ? `http://${expoHost}:8000`
      : "http://localhost:8000");

type TemporaryProfileSeed = {
  email: string;
  username: string;
  password: string;
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

function buildTemporaryProfileSeed(): TemporaryProfileSeed {
  const uniqueSuffix = `${randInt(10000, 99999)}`;
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
    "Temporary Forge test account.",
    "Auto-generated account for frontend testing.",
    "Quick test user for multi-account flows.",
  ];

  const age = randInt(18, 40);
  const height = randInt(62, 76);
  const weight = randInt(130, 230);
  const activityIndex = randInt(0, 4);

  return {
    email: `temp_${uniqueSuffix}@forge.test`,
    username: `temp_${uniqueSuffix}`,
    password: `ForgeTemp!${uniqueSuffix}`,
    bio: pickOne(bios),
    gymLocation: TEST_GYM_LOCATION,
    onboarding: {
      healthScore: randInt(55, 90),
      age,
      height,
      weight,
      genderIndex: randInt(0, 1),
      activityIndex,
      calorie_goal: randInt(2100, 3000),
      goals: pickOne(goals),
      previousExperience: pickOne(experienceLevels),
      bio: pickOne(bios),
      acceptedTerms: true,
    },
  };
}

const LoginScreen = () => {
  const router = useRouter();
  const { setLoggedIn, setCurrentUser } = useAuth();
  const scheme = useAppColorScheme() ?? "light";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
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

        if (rememberMe && data.refresh_token) {
          await AsyncStorage.setItem("refresh_token", data.refresh_token);
        }

        const me = await api.me().catch(() => undefined);

        setCurrentUser(
          me
            ? {
                profile_id: me.profile_id,
                email: me.email,
                username: me.username,
              }
            : {
                email,
                username: email.split("@")[0],
              },
        );

        setLoggedIn(true);
        router.push("/(tabs)");
      }
    } catch (error) {
      alert(`Server did not connect properly. API: ${BASE_URL}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemporaryAccount = async () => {
    if (isSubmitting) return;

    setRememberMe(false);
    const seed = buildTemporaryProfileSeed();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/create_account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: seed.email,
          username: seed.username,
          password: seed.password,
          bio: seed.bio,
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
        throw new Error(
          data?.detail ?? raw ?? "Temporary account creation failed",
        );
      }

      setToken(data.access_token ?? null);

      await AsyncStorage.removeItem("refresh_token");

      const createdUser = await api.me();
      if (!createdUser) {
        throw new Error(
          "Temporary account was created but could not be loaded.",
        );
      }

      const onboardingSuccess = await api.submitOnboarding(seed.onboarding);
      if (!onboardingSuccess) {
        throw new Error("Temporary account onboarding failed.");
      }

      const updatedUser = await api.updateMe({
        bio: seed.bio,
        gym_location: seed.gymLocation,
      });

      setCurrentUser(
        updatedUser
          ? {
              profile_id: updatedUser.profile_id,
              email: updatedUser.email,
              username: updatedUser.username,
            }
          : {
              profile_id: createdUser.profile_id,
              email: createdUser.email,
              username: createdUser.username,
            },
      );

      setLoggedIn(true);
      router.replace("/(tabs)");
    } catch (error: any) {
      alert(error?.message ?? "Could not create temporary account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <LoginTextBox
        label="Email"
        value={email}
        onChangeText={setEmail}
        isVisible={true}
      />

      <LoginTextBox
        label="Password"
        value={password}
        onChangeText={setPassword}
        maxLength={20}
        isVisible={true}
      />

      <Pressable
        onPress={() => setRememberMe((prev) => !prev)}
        style={styles.rememberRow}
      >
        <View
          lightColor="transparent"
          darkColor="transparent"
          style={[
            styles.checkbox,
            {
              borderColor: "#2f80ed",
              backgroundColor: rememberMe ? "#2f80ed" : "transparent",
            },
          ]}
        >
          {rememberMe && (
            <Text
              lightColor="#ffffff"
              darkColor="#ffffff"
              style={styles.checkmark}
            >
              ✓
            </Text>
          )}
        </View>

        <Text style={[styles.rememberText, { color: Schemes[scheme].text }]}>
          Remember me
        </Text>
      </Pressable>

      <LoginButton onPress={handleLogin} text="Login" disabled={isSubmitting} />
      <LoginButton
        onPress={() => router.push("/createAccountScreen")}
        text="Create Account"
        disabled={isSubmitting}
      />
      <LoginButton
        onPress={() => router.push("/resetPasswordScreen")}
        text="Reset Password"
        disabled={isSubmitting}
      />
      <LoginButton
        onPress={handleTemporaryAccount}
        text={isSubmitting ? "Working..." : "Temporary"}
        disabled={isSubmitting}
        color="#dc2626"
        textColor="#ffffff"
        style={styles.temporaryButton}
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
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "700",
  },
  rememberText: {
    fontSize: 14,
  },
  temporaryButton: {
    marginTop: 14,
  },
});

export default LoginScreen;
