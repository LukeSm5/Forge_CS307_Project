import { StyleSheet } from "react-native";
import { useScheme } from "@/components/Themed";

export const stylesProvider = () => {
  const s = useScheme();
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: s.background,
    },
    container: {
      flex: 1,
      backgroundColor: s.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 10,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
      color: s.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 10,
    },
    subsectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: s.text,
      marginTop: 4,
      marginBottom: 2,
    },
    label: {
      fontSize: 13,
      color: s.secondaryText,
    },
    input: {
      borderWidth: 1,
      borderColor: s.neutralColor,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: s.text,
      backgroundColor: s.background,
    },
    dropdown: {
      borderWidth: 1,
      borderColor: s.neutralColor,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: s.background,
    },
    machineDropdown: {
      marginBottom: 8,
    },
    dropdownContainer: {
      backgroundColor: s.background,
      borderColor: s.neutralColor,
      borderRadius: 10,
      overflow: "hidden",
    },
    dropdownItemContainer: {
      backgroundColor: s.background,
    },
    dropdownItemText: {
      color: s.text,
    },
    dropdownSelectedText: {
      color: s.text,
      backgroundColor: s.background,
    },
    dropdownPlaceholder: {
      color: s.secondaryText,
    },
    dropdownSearchInput: {
      backgroundColor: s.background,
      color: s.text,
      borderColor: s.neutralColor,
      borderRadius: 8,
    },
    dropdownOption: {
      padding: 12,
    },
    dropdownOptionText: {
      fontWeight: "600",
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    half: {
      flex: 1,
    },
    rowWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    muscleBtn: {
      minWidth: 92,
    },
    machineBtn: {
      minWidth: 92,
    },
    empty: {
      color: s.secondaryText,
    },
    card: {
      borderWidth: 1,
      borderColor: s.neutralColor,
      borderRadius: 12,
      padding: 10,
      marginBottom: 8,
    },
    cardTitle: {
      fontWeight: "600",
      marginBottom: 2,
    },

    dateBox: {
      flex: 1,
    },
    splitBox: {
      flex: 1.4,
    },
    suggestionCard: {
      borderWidth: 1,
      borderColor: s.neutralColor,
      borderRadius: 10,
      backgroundColor: s.background,
      overflow: "hidden",
    },
    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: s.neutralColor,
    },
    suggestionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: s.text,
    },
    suggestionSubtitle: {
      fontSize: 12,
      color: s.secondaryText,
      marginTop: 2,
    },

    timerCard: {
      borderWidth: 1,
      borderColor: s.neutralColor,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      backgroundColor: s.background,
      gap: 12,
    },
    timerDisplay: {
      fontSize: 44,
      fontWeight: "700",
      color: s.text,
      letterSpacing: 2,
    },
    timerButtonRow: {
      flexDirection: "row",
      gap: 10,
    },
    timerToggleBtn: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },

    exerciseInputCol: {
      flex: 1,
      gap: 10,
    },
    tailorCol: {
      justifyContent: "center",
      paddingTop: 6,
    },
    tailorBtn: {
      minWidth: 64,
      alignSelf: "stretch",
      flex: 1,
    },
    modalLoadingText: {
      fontSize: 14,
      color: s.secondaryText,
      textAlign: "center",
      marginBottom: 8,
    },
    tailorResultRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: s.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: s.neutralColor,
    },
    tailorResultItem: {
      alignItems: "center",
      flex: 1,
    },
    tailorResultValue: {
      fontSize: 24,
      fontWeight: "800",
      color: s.text,
    },
    tailorResultLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: s.secondaryText,
      marginTop: 4,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    tailorResultDivider: {
      width: 1,
      height: 40,
      backgroundColor: s.neutralColor,
    },
    modalButtonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButtonHalf: {
      flex: 1,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 340,
      borderRadius: 16,
      backgroundColor: s.background,
      padding: 28,
      alignItems: "center",
      gap: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: s.text,
      textAlign: "center",
    },
    modalSubtitle: {
      fontSize: 14,
      color: s.secondaryText,
      textAlign: "center",
      lineHeight: 20,
    },
  });
};
