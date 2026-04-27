import { useSocialColors } from "@/components/social/useSocialColors";
import { styles } from "@/components/social/socialStyles";
import { LogProgressModalState } from "@/components/social/socialTypes";
import { Pressable, Modal, ActivityIndicator, TextInput } from "react-native";
import { View, Text, useScheme } from "@/components/Themed"

type Props = {
  state: LogProgressModalState;
  onClose(): void;
  onLogProgress(): void;
  onChangeAmount(text: string): void;
}

export default function LogProgressModal({state, onClose, onLogProgress, onChangeAmount}: Props) {
    const colors = useSocialColors();
    const scheme = useScheme();
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
            {state.loading ? (
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
                  {state.goal?.title}
                </Text>
                <Text
                  style={[
                    styles.goalFieldLabel,
                    { color: colors.muted, marginTop: 14 },
                  ]}
                >
                  Amount ({state.goal?.unit})
                </Text>
                <TextInput
                  value={state.amount}
                  onChangeText={onChangeAmount}
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
                  <Pressable
                    onPress={onLogProgress}
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
      </Modal> );
}