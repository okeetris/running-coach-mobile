import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  clearBtn: {
    padding: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#49454F",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  speedInput: {
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: "#49454F",
    marginBottom: 8,
  },
  smallInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    width: 70,
    height: 50,
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
    textAlign: "center",
  },
  paceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  paceInput: {
    alignItems: "center",
  },
  paceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    marginBottom: 8,
  },
  paceFields: {
    flexDirection: "row",
    gap: 8,
  },
  paceFieldGroup: {
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    color: "#9E9E9E",
    marginBottom: 4,
  },
  distanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeInput: {
    width: "48%",
    marginBottom: 20,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#49454F",
    textAlign: "center",
    marginBottom: 8,
  },
  timeFields: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  timeFieldGroup: {
    alignItems: "center",
  },
  timeFieldInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    width: 50,
    height: 50,
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    textAlign: "center",
  },
});
