import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  searchContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#d5dee9",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  listContainer: {
    marginTop: 18,
    maxHeight: 360,
  },
  statusText: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: "#b91c1c",
    marginBottom: 8,
  },
  logCard: {
    borderWidth: 1,
    borderColor: "#dbe3f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  logDate: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748b",
  },
  exerciseList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  exerciseHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  exerciseItem: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 3,
    paddingRight: 8,
  },
  timerRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logButton: {
    backgroundColor: "#2563eb",
  },
  generateButton: {
    backgroundColor: "#0f766e",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: "#64748b",
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalExerciseCard: {
    borderWidth: 1,
    borderColor: "#dbe3f0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  twoCols: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    flex: 1,
  },
  modalActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#64748b",
  },
  modalAddButton: {
    backgroundColor: "#16a34a",
  },
  deleteConfirmButton: {
    backgroundColor: "#dc2626",
  },
  modalButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  confirmCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  confirmText: {
    marginTop: 8,
    marginBottom: 14,
    color: "#334155",
  },
  splitCard: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#eff6ff",
  },
  splitTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e3a5f",
  },
  splitDate: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
  },
  progressButton: {
    alignSelf: "flex-start",
    borderRadius: 12,
    marginVertical: 0,
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  postButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
});
