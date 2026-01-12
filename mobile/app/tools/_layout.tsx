/**
 * Tools stack layout
 */

import { Stack } from "expo-router";

export default function ToolsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="glucose" />
      <Stack.Screen name="pace" />
    </Stack>
  );
}
