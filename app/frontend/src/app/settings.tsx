import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "@/components/Themed";
import { useAccessibility } from "@/core/accessibility";
import { api, setToken, User } from "@/core/api";
import { useAuth } from "@/core/auth";
import DeleteAccountButton from "@/components/deleteAccount/DeleteAccountButton";
type Status = { type: "ok" | "err"; msg: string } | null;
function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.modeBtn, selected && styles.modeBtnSelected]}>
      <Text style={[styles.modeBtnText, selected && styles.modeBtnTextSelected]}>{label}</Text>
    </Pressable>
  );
}
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}
function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <View style={[styles.statusBanner, status.type === "ok" ? styles.statusOk : styles.statusErr]}>
      <Text style={styles.statusText}>{status.msg}</Text>
    </View>
  );
}
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="rgba(0,0,0,0.35)"
      />
    </View>
  );
}
function ActionButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variantStyle =
    variant === "danger"
      ? styles.btnDanger
      : variant === "secondary"
      ? styles.btnSecondary
      : styles.btnPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, variantStyle, disabled && styles.btnDisabled]}
    >
      <Text style={[styles.btnText, variant === "secondary" && styles.btnTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}
export default function SettingsScreen() {
  const { colorMode, setColorMode, textScale, setTextScale } = useAccessibility();
  const { currentUser, setCurrentUser, setLoggedIn } = useAuth();
  const [status, setStatus] = useState<Status>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [pUsername, setPUsername] = useState("");
  const [pBio, setPBio] = useState("");
  const [cCurrent, setCCurrent] = useState("");
  const [cNew, setCNew] = useState("");
  async function refreshMe() {
    setLoading(true);
    setStatus(null);
    try {
      const me = await api.me();
      if (typeof me === "undefined") throw new Error("User not signed in.");
      setUser(me);
      setPUsername(me.username ?? "");
      setPBio(me.bio ?? "");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refreshMe();
  }, []);
  async function doUpdateProfile() {
    setLoading(true);
    setStatus(null);
    try {
      const updated = await api.updateMe({ username: pUsername || undefined, bio: pBio ?? "" });
      if (typeof updated === "undefined") throw new Error("User not signed in");
      setUser(updated);
      setStatus({ type: "ok", msg: "Profile updated." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }
  async function doChangePassword() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.changePassword({ current_password: cCurrent, new_password: cNew });
      if (typeof res === "undefined") throw new Error("Password change failed.");
      setCCurrent(""); setCNew("");
      setStatus({ type: "ok", msg: "Password changed." });
    } catch (e: any) {
      setStatus({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <StatusBanner status={status} />
        <Text style={styles.pageTitle}>Settings</Text>
        <SectionHeader title="Appearance" />
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.modeRow}>
          <ModeButton label="System" selected={colorMode === "system"} onPress={() => setColorMode("system")} />
          <ModeButton label="Light"  selected={colorMode === "light"}  onPress={() => setColorMode("light")} />
          <ModeButton label="Dark"   selected={colorMode === "dark"}   onPress={() => setColorMode("dark")} />
        </View>
        <Text style={styles.sectionTitle}>Text Size</Text>
        <Text style={styles.helper}>Adjust the slider to scale text across the app.</Text>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={1.0}
          maximumValue={1.4}
          step={0.05}
          value={textScale}
          onValueChange={(v) => setTextScale(v)}
          minimumTrackTintColor="#2f80ed"
        />
        <View style={styles.previewCard}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Preview</Text>
          <Text style={{ marginTop: 8 }}>
            This is how your text will look with the current setting.
          </Text>
        </View>
        <Text style={styles.footerNote}>
          Settings are saved automatically and will persist after restarting the app.
        </Text>
        <SectionHeader title="Account" />
        {loading && <ActivityIndicator style={{ marginVertical: 8 }} color="#2f80ed" />}
        <Text style={[styles.helper, { marginBottom: 12 }]}>
          {currentUser
            ? `Signed in as ${currentUser.username ?? "User"} (${currentUser.email})`
            : user
              ? `Signed in as ${user.username} (${user.email})`
              : ""}
        </Text>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Field label="Username" value={pUsername} onChangeText={setPUsername} placeholder="New username" />
        <Field label="Bio"      value={pBio}      onChangeText={setPBio}      placeholder="Bio (≤280 chars)" multiline />
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Change Password</Text>
        <Field label="Current password" value={cCurrent} onChangeText={setCCurrent} secureTextEntry />
        <Field label="New password"     value={cNew}     onChangeText={setCNew}     secureTextEntry />
        <View style={styles.rowBtns}>
          <ActionButton label="Save Profile"    onPress={doUpdateProfile}   disabled={loading} />
          <ActionButton label="Change Password" onPress={doChangePassword}  disabled={loading || !cCurrent || !cNew} variant="secondary" />
        </View>
        {user && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <DeleteAccountButton
              userId={user.profile_id}
              onDeleted={() => {
                setToken(null);
                setUser(null);
                setCurrentUser(null);
                setLoggedIn(false);
                setStatus({ type: "ok", msg: "Account deleted." });
              }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
// Style
const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    opacity: 0.45,
    marginTop: 28,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.15)",
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  helper: { opacity: 0.65, fontSize: 13, marginBottom: 4 },
  modeRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.25)",
  },
  modeBtnSelected: { backgroundColor: "#2f80ed", borderColor: "#2f80ed" },
  modeBtnText: { fontWeight: "700" },
  modeBtnTextSelected: { color: "white" },
  previewCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.2)",
  },
  footerNote: { marginTop: 14, opacity: 0.55, fontSize: 12 },
  statusBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusOk: { backgroundColor: "#d4edda" },
  statusErr: { backgroundColor: "#f8d7da" },
  statusText: { fontWeight: "600", fontSize: 13 },
  fieldWrapper: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4, opacity: 0.75 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  rowBtns: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  btnPrimary: { backgroundColor: "#2f80ed" },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.3)",
  },
  btnDanger: { backgroundColor: "#e53935" },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "white", fontWeight: "700", fontSize: 14 },
  btnTextSecondary: { color: "#2f80ed" },
});
