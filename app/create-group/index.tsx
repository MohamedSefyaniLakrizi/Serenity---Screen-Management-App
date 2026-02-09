import { Button } from '@/components/ui';
import { spacing } from '@/constants';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { ScreenTimeModule } = NativeModules;

interface FamilyActivitySelection {
  applications: Array<{
    bundleId: string;
    name: string;
    category: string;
    categoryName: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  webDomains: string[];
}

interface AppInfo {
  name: string;
  icon: string;
  bundleId: string;
  category: string;
}

export default function SelectAppsScreen() {
  const theme = useThemedColors();
  const [selectedApps, setSelectedApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Check permission and show picker on mount
  React.useEffect(() => {
    checkPermissionAndShowPicker();
  }, []);

  const checkPermissionAndShowPicker = async () => {
    if (Platform.OS !== 'ios' || !ScreenTimeModule) {
      Alert.alert('Error', 'Screen Time is only available on iOS');
      setIsCheckingPermission(false);
      setHasPermission(false);
      return;
    }

    setIsCheckingPermission(true);

    try {
      // Request authorization first
      const authorized = await ScreenTimeModule.requestAuthorization();
      setHasPermission(authorized);

      if (authorized) {
        // Automatically show picker if permission granted
        await showAppPicker();
      }
    } catch (error) {
      console.error('Error requesting authorization:', error);
      setHasPermission(false);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const showAppPicker = async () => {
    setLoading(true);

    try {
      // Present the Family Activity Picker
      const selection: FamilyActivitySelection =
        await ScreenTimeModule.presentActivityPicker();

      // Convert selected apps to AppInfo format
      const apps: AppInfo[] = selection.applications.map((app) => ({
        name: app.name,
        icon: '', // iOS doesn't provide icons through the API
        bundleId: app.bundleId,
        category: app.category || 'other',
      }));

      setSelectedApps(apps);
    } catch (error) {
      console.error('Error selecting apps:', error);
      // User might have cancelled the picker - that's okay
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (!errorMessage.toLowerCase().includes('cancel')) {
          Alert.alert('Error', 'Failed to select apps. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApps = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable Screen Time permission in Settings to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // iOS doesn't allow direct navigation to specific settings
              // but we can open the app settings
              if (Platform.OS === 'ios') {
                const { Linking } = require('react-native');
                Linking.openURL('app-settings:');
              }
            }
          }
        ]
      );
      return;
    }

    await showAppPicker();
  };

  const handleContinue = () => {
    // Navigate to configure screen with selected apps
    router.push({
      pathname: '/create-group/configure',
      params: {
        apps: JSON.stringify(selectedApps),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: '50%', backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Step 1 of 2
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Select Apps
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose the apps you want to limit or block
              </Text>
            </View>

            {/* Loading State */}
            {isCheckingPermission && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Checking permissions...
                </Text>
              </View>
            )}

            {/* Permission Denied State */}
            {!isCheckingPermission && hasPermission === false && (
              <View
                style={[
                  styles.permissionDeniedContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={styles.permissionDeniedEmoji}>🔒</Text>
                <Text
                  style={[styles.permissionDeniedTitle, { color: theme.textPrimary }]}
                >
                  Screen Time permission is required
                </Text>
                <Text
                  style={[
                    styles.permissionDeniedDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Enable it in Settings → Screen Time → Serenity
                </Text>
                <Button
                  title="Try Again"
                  onPress={checkPermissionAndShowPicker}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}

            {/* Has Permission - Show Selection UI */}
            {!isCheckingPermission && hasPermission === true && (
              <>
                {/* Select Apps Button */}
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                  onPress={handleSelectApps}
                  disabled={loading}
                >
                  <View style={styles.selectButtonContent}>
                    <Text style={[styles.selectButtonEmoji]}>📱</Text>
                    <View style={styles.selectButtonTextContainer}>
                      <Text
                        style={[
                          styles.selectButtonTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {selectedApps.length > 0
                          ? `${selectedApps.length} ${
                              selectedApps.length === 1 ? 'app' : 'apps'
                            } selected`
                          : 'Tap to select apps'}
                      </Text>
                      <Text
                        style={[
                          styles.selectButtonSubtitle,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {selectedApps.length > 0
                          ? 'Tap to change selection'
                          : 'Opens iOS app picker'}
                      </Text>
                    </View>
                    {loading && <ActivityIndicator color={theme.primary} />}
                  </View>
                </TouchableOpacity>

                {/* Selected Apps List */}
                {selectedApps.length > 0 && (
                  <View style={styles.appsListContainer}>
                    <Text
                      style={[styles.appsListTitle, { color: theme.textPrimary }]}
                    >
                      Selected Apps
                    </Text>
                    <View
                      style={[
                        styles.appsList,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {selectedApps.map((app, index) => (
                        <View
                          key={app.bundleId}
                          style={[
                            styles.appItem,
                            index !== selectedApps.length - 1 && {
                              borderBottomWidth: 1,
                              borderBottomColor: theme.border,
                            },
                          ]}
                        >
                          <View style={styles.appInfo}>
                            <View
                              style={[
                                styles.appIconPlaceholder,
                                { backgroundColor: theme.primaryLight },
                              ]}
                            >
                              <Text style={styles.appIconText}>
                                {app.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.appDetails}>
                              <Text
                                style={[styles.appName, { color: theme.textPrimary }]}
                              >
                                {app.name}
                              </Text>
                              <Text
                                style={[
                                  styles.appCategory,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {app.category}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={[
            styles.actions,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={loading}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  content: {
    gap: spacing.lg,
  },
  titleSection: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  selectButton: {
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.md,
    minHeight: 80,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectButtonEmoji: {
    fontSize: 48,
  },
  selectButtonTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  selectButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectButtonSubtitle: {
    fontSize: 14,
  },
  appsListContainer: {
    gap: spacing.md,
  },
  appsListTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  appsList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appItem: {
    padding: spacing.md,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  appDetails: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
  },
  appCategory: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionDeniedContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  permissionDeniedEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  permissionDeniedTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionDeniedDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
