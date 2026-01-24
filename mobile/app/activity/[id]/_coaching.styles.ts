import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coachingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 12,
    width: 20,
  },
  attentionIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    marginRight: 12,
    width: 20,
    textAlign: "center",
  },
  coachingText: {
    flex: 1,
    fontSize: 14,
    color: "#49454F",
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  focusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  focusCue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
    lineHeight: 24,
  },
  fatigueCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  fatigueMetric: {
    fontSize: 12,
    color: "#49454F",
    marginBottom: 4,
  },
  fatigueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fatigueValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  fatigueArrow: {
    fontSize: 14,
    color: "#49454F",
  },
  fatigueChange: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
  },
});
