import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#1976D2",
    fontWeight: "600",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#E3F2FD",
    gap: 8,
  },
  syncStatusText: {
    color: "#1976D2",
    fontSize: 14,
  },
  syncError: {
    backgroundColor: "#FFEBEE",
  },
  syncSuccess: {
    backgroundColor: "#E8F5E9",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  successText: {
    color: "#388E3C",
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#49454F",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: "#49454F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1976D2",
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#49454F",
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#757575",
  },
});
