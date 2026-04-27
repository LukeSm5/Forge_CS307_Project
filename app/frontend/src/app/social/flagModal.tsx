import { View, Text } from "@/components/Themed";
import { styles } from "@/components/social/socialStyles";
import { Pressable, ActivityIndicator, Modal, TextInput } from "react-native";
import { useSocialColors } from "@/components/social/useSocialColors";
import { FlagModalState } from "@/components/social/socialTypes";

type Props = {
    state: FlagModalState;
    onClose(): void;
    onGoToBlock(): void;
    onGoToReport(): void;
    onGoToChoose(): void;
    onConfirmBlock(): void;
    onSubmitReport(): void;
    onChangeDescription(text: string): void;
}

export default function FlagModal ({state, onClose, onGoToBlock, onGoToReport, onGoToChoose, onChangeDescription,
    onConfirmBlock, onSubmitReport} : Props) {
    const colors = useSocialColors();
    return (
    <Modal
        visible={state.visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
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
                {state.loading || !state.step ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator size="small" />
                    <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                      Loading...
                    </Text>
                  </View>
                ) : /* ── STEP 1: CHOOSE ── */
                state.step === "choose" ? (
                  <>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      @{state.profile?.username}
                    </Text>
    
                    <View style={styles.modalButtonRow}>
                      <Pressable
                        onPress={onGoToBlock}
                        style={({ pressed }) => [
                          styles.modalButton,
                          { backgroundColor: colors.red, borderColor: colors.red },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.modalDangerButtonText}>
                          {state.isBlocked ? "Unblock" : "Block"}
                        </Text>
                      </Pressable>
    
                      <Pressable
                        onPress={onGoToReport}
                        style={({ pressed }) => [
                          styles.modalButton,
                          { backgroundColor: colors.red, borderColor: colors.red },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.modalDangerButtonText}>Report</Text>
                      </Pressable>
    
                      <Pressable
                        onPress={onClose}
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
                state.step === "block_confirm" ? (
                  <>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {state.isBlocked ? "Unblock User" : "Block User"}
                    </Text>
                    <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                      {state.isBlocked
                        ? `Unblock @${state.profile?.username}?`
                        : `Block @${state.profile?.username}? This will also remove any existing friendship.`}
                    </Text>
    
                    <View style={styles.modalButtonRow}>
                      <Pressable
                        onPress={onGoToChoose}
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
                        onPress={onConfirmBlock}
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
                state.step === "report" ? (
                  <>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Report User
                    </Text>
                    <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                      Describe the violation by @{state.profile?.username}:
                    </Text>
    
                    <TextInput
                      value={state.description}
                      onChangeText={onChangeDescription}
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
                        onPress={onGoToChoose}
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
                        onPress={onSubmitReport}
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
    );
}