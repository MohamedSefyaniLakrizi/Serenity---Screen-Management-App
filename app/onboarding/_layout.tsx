import { useThemedColors } from '@/hooks/useThemedStyles';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  const theme = useThemedColors();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'none',
      }}
    />
  );
}
