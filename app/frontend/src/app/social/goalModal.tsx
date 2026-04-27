import { useSocialColors } from "@/components/social/useSocialColors";
import { View, Text, } from "@/components/Themed";
import { styles } from "@/components/social/socialStyles";
import { Pressable, ActivityIndicator, Modal, TextInput, ScrollView } from "react-native";
import { CreateGoalModalState, GoalUnit } from "@/components/social/socialTypes";
import { useScheme } from "@/components/Themed";

type Props = {
    state: CreateGoalModalState
    onClose(): void;
    onCreateGoal(): void;
    onChangeTitle(text: string): void;
    onChangeDescription(text: string): void;
    onChangeTargetValue(text: string): void;
    onChangeUnit(unit: GoalUnit): void;
}
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

export default function GoalModal({state, onClose, onCreateGoal, onChangeTitle, onChangeTargetValue, onChangeDescription, onChangeUnit}: Props) {
    const colors = useSocialColors();
    const scheme = useScheme()
    return (<Modal
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
                      value={state.title}
                      onChangeText={onChangeTitle}
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
                      value={state.description}
                      onChangeText={onChangeDescription}
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
                          value={state.targetValue}
                          onChangeText={onChangeTargetValue}
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
                                onPress={() => onChangeUnit(u)}
                                style={[
                                  styles.unitPill,
                                  {
                                    backgroundColor:
                                      state.unit === u
                                        ? colors.orange
                                        : colors.soft,
                                    borderColor:
                                      state.unit === u
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
                                        state.unit === u
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
                        onPress={onCreateGoal}
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
          </Modal> );
}