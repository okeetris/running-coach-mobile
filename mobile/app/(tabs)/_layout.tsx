/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation with Home, Activities, and Analyze tabs.
 */

import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

interface TabIconProps {
  name: string;
  icon: string;
  focused: boolean;
}

function TabIcon({ name, icon, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelFocused]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#1976D2",
        tabBarInactiveTintColor: "#757575",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Home" icon="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Runs",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="Runs" icon="🏃" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: "Analyze",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="New" icon="📊" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "500",
  },
  tabLabelFocused: {
    color: "#1976D2",
    fontWeight: "600",
  },
});
