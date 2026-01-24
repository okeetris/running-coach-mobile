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
  lapsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lapsHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
    textTransform: "uppercase",
  },
  headerPace: {
    flex: 1,
    marginLeft: 40,
  },
  headerDist: {
    width: 70,
    textAlign: "right",
  },
  headerTime: {
    width: 50,
    textAlign: "right",
  },
  lapRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lapNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lapNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1976D2",
  },
  lapDetails: {
    flex: 1,
  },
  lapMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lapPace: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  lapDistance: {
    width: 70,
    fontSize: 13,
    color: "#49454F",
    textAlign: "right",
  },
  lapDuration: {
    width: 50,
    fontSize: 13,
    color: "#49454F",
    textAlign: "right",
  },
  lapMetrics: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
    alignItems: "center",
  },
  lapMetric: {
    fontSize: 12,
    color: "#757575",
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: "auto",
  },
  intensityText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
