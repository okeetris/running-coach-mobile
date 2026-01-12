/**
 * Activity Detail Screen
 *
 * Dynamic route for viewing a specific activity's analysis.
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityDetailScreen } from "../../src/screens/ActivityDetailScreen";

export default function ActivityDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  if (!id) {
    return null;
  }

  return <ActivityDetailScreen activityId={id} onBack={handleBack} />;
}
