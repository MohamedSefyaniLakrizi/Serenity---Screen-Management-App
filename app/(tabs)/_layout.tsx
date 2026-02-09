import { useThemedColors } from "@/hooks/useThemedStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const router = useRouter();
  const theme = useThemedColors();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboardingCompleted');
        const isComplete = completed === 'true';
        console.log('🛡️ Tabs guard: Onboarding complete?', isComplete);
        
        if (!isComplete) {
          console.log('🛡️ Tabs guard: Redirecting to onboarding...');
          router.replace('/onboarding' as any);
        } else {
          setIsOnboardingComplete(true);
        }
      } catch (error) {
        console.error('Tabs guard: Error checking onboarding:', error);
        router.replace('/onboarding' as any);
      } finally {
        setIsChecking(false);
      }
    };
    checkOnboarding();
  }, [router]);

  if (isChecking) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isOnboardingComplete) {
    return null;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Apps</Label>
        <Icon sf="square.grid.2x2.fill" drawable="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <Label>Progress</Label>
        <Icon sf="chart.bar.fill" drawable="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf="gearshape.fill" drawable="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
});
