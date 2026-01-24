/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation with Home, Activities, and Analyze tabs.
 */

import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../../src/styles/app/tabs/layout.styles";

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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 70 + Math.max(insets.bottom - 12, 0),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ],
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
            <TabIcon name="Analyze" icon="📊" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar - accessed via header icon
        }}
      />
    </Tabs>
  );
}

