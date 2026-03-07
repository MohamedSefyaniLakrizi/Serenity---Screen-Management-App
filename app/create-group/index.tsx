import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Button } from '@/components/ui';
import { spacing } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useThemedColors, useThemedStyles } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AuthorizationStatus,
  DeviceActivitySelectionView,
  getAuthorizationStatus,
  requestAuthorization,
} from 'react-native-device-activity';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectAppsScreen() {
  const theme = useThemedColors();
  const { isDark } = useThemedStyles();
  const [familyActivitySelection, setFamilyActivitySelection] = useState<string | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Request authorization on mount
  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;
    checkAndRequestAuth();
  }, []);

  const checkAndRequestAuth = async () => {
    const status = getAuthorizationStatus();

    if (status === AuthorizationStatus.approved) {
      setAuthorized(true);
      return;
    }

    if (status === AuthorizationStatus.denied) {
      setAuthorized(false);
      return;
    }

    // notDetermined — request it
    setLoading(true);
    try {
      await requestAuthorization('individual');
      const newStatus = getAuthorizationStatus();
      setAuthorized(newStatus === AuthorizationStatus.approved);
    } catch (error: any) {
      console.error('Authorization error:', error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (event: any) => {
    const {
      familyActivitySelection: token,
      applicationCount: apps,
      categoryCount: cats,
    } = event?.nativeEvent ?? {};
    setFamilyActivitySelection(token ?? null);
    setApplicationCount(apps ?? 0);
    setCategoryCount(cats ?? 0);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/create-group/configure',
      params: {
        familyActivitySelection: familyActivitySelection ?? '',
        applicationCount: applicationCount.toString(),
        categoryCount: categoryCount.toString(),
      },
    });
  };

  const totalSelected = applicationCount + categoryCount;

  if (Platform.OS !== 'ios') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary, padding: spacing.lg }}>
          Screen Time is only available on iOS.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />

        <OnboardingHeader
          progressFraction={1 / 4}
          stepLabel="Step 1 of 4"
          onBack={() => router.back()}
        />

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Select Apps
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose the apps and categories you want to limit or block
          </Text>
        </View>

        {/* Loading auth */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Requesting permission…
            </Text>
          </View>
        )}

        {/* Permission denied */}
        {!loading && authorized === false && (
          <View style={styles.centeredState}>
            <View
              style={[
                styles.permissionDeniedContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={styles.permissionDeniedEmoji}>🔒</Text>
              <Text style={[styles.permissionDeniedTitle, { color: theme.textPrimary }]}>
                Screen Time permission required
              </Text>
              <Text style={[styles.permissionDeniedDescription, { color: theme.textSecondary }]}>
                Enable it in Settings → Screen Time → Serenity
              </Text>
              <Button
                title="Try Again"
                onPress={checkAndRequestAuth}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </View>
        )}

        {/* Full-screen native picker — flex: 1 so it takes all remaining space */}
        {!loading && authorized === true && (
          <DeviceActivitySelectionView
            style={[styles.picker, { backgroundColor: theme.background }]}
            onSelectionChange={handleSelectionChange}
            familyActivitySelection={familyActivitySelection}
            headerText="Select apps to limit"
            footerText="Your selection is private and stays on-device"
            appearance={isDark ? 'dark' : 'light'}
          />
        )}

        {/* Bottom Actions */}
        <View
          style={[
            styles.actions,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          {totalSelected > 0 && (
            <Text style={[styles.selectionSummary, { color: theme.textSecondary }]}>
              {applicationCount > 0 && `${applicationCount} app${applicationCount !== 1 ? 's' : ''}`}
              {applicationCount > 0 && categoryCount > 0 && '  ·  '}
              {categoryCount > 0 && `${categoryCount} categor${categoryCount !== 1 ? 'ies' : 'y'}`}
            </Text>
          )}
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={loading || (!__DEV__ && authorized !== true)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: { fontSize: 28, fontFamily: FONTS.loraMedium, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: FONTS.interRegular, lineHeight: 20 },
  // Picker fills ALL remaining vertical space between title and actions
  picker: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: { fontSize: 16, fontWeight: '500', marginTop: spacing.md },
  permissionDeniedContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  permissionDeniedEmoji: { fontSize: 48, marginBottom: spacing.xs },
  permissionDeniedTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  permissionDeniedDescription: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  selectionSummary: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
});
