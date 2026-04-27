import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
