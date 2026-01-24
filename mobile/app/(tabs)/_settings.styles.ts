import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 16,
    color: "#1C1B1F",
  },
  rowValue: {
    fontSize: 16,
    color: "#49454F",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    color: "#49454F",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  button: {
    backgroundColor: "#1976D2",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#90CAF9",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  segmentTextActive: {
    color: "#1976D2",
    fontWeight: "600",
  },
  destructiveRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  destructiveText: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "500",
  },
  disconnectButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  disconnectText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    height: 32,
  },
});
