import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, NativeModules, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FamilyActivitySelection, ScreenTimeUtils } from '../../modules/screentime';

const { ScreenTimeModule } = NativeModules;

export default function AppSelection() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  
  const [screenFade, titleAnimation, subtitleAnimation, contentAnimation, buttonAnimation] = useSequentialFadeIn(5, { duration: 300, stagger: 400 });
  
  // Authorization state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection state
  const [selection, setSelection] = useState<FamilyActivitySelection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeScreenTime();
  }, []);

  const initializeScreenTime = async () => {
    try {
      setIsLoading(true);
      
      // Check if ScreenTimeModule is available
      if (!ScreenTimeModule || !ScreenTimeModule.requestAuthorization) {
        console.log('ScreenTimeModule not available, skipping app selection');
        skipToNextStep();
        return;
      }
      
      // Request Screen Time authorization
      const authorized = await ScreenTimeUtils.requestAuthorization();
      setIsAuthorized(authorized);
      
      if (!authorized) {
        console.log('Screen Time authorization not granted, skipping app selection');
        setTimeout(() => skipToNextStep(), 500);
        return;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Screen Time:', error);
      setError('Failed to initialize Screen Time');
      setIsLoading(false);
      setTimeout(() => skipToNextStep(), 500);
    }
  };

  const skipToNextStep = () => {
    updateData({
      selectedApps: [],
      selectedCategories: [],
    });
    router.push('./usage-patterns');
  };

  const handleOpenPicker = async () => {
    try {
      setError(null);
      const result = await ScreenTimeUtils.presentActivityPicker();
      
      if (result) {
        setSelection(result);
      } else {
        // User cancelled or error occurred
        setError('No apps selected. You can select apps later in settings.');
      }
    } catch (error) {
      console.error('Error opening activity picker:', error);
      setError('Failed to open app picker. Please try again.');
    }
  };

  const handleContinue = () => {
    if (!selection) {
      skipToNextStep();
      return;
    }

    // Extract bundle IDs from selected apps
    const selectedAppBundles = selection.applications.map(app => app.bundleId);
    
    // Extract category IDs
    const selectedCategoryIds = selection.categories.map(cat => cat.id);
    
    // Get all apps from selected categories
    const appsFromCategories = selection.applications
      .filter(app => selection.categories.some(cat => cat.id === app.category))
      .map(app => app.bundleId);
    
    // Combine both individual apps and category apps
    const allSelectedApps = Array.from(new Set([...selectedAppBundles, ...appsFromCategories]));
    
    updateData({
      selectedApps: allSelectedApps,
      selectedCategories: selectedCategoryIds,
    });
    
    router.push('./usage-patterns');
  };

  // Render loading state
  if (isLoading) {
    return (
      <Animated.View style={[styles(theme).container, screenFade]}>
        <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
          <StatusBar barStyle={theme.statusBar} />
          <View style={styles(theme).loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles(theme).loadingText}>Initializing Screen Time...</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // Render unauthorized state (auto-skips)
  if (!isAuthorized) {
    return (
      <Animated.View style={[styles(theme).container, screenFade]}>
        <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
          <StatusBar barStyle={theme.statusBar} />
          <View style={styles(theme).loadingContainer}>
            <Text style={styles(theme).errorText}>Screen Time not available</Text>
            <Text style={styles(theme).errorSubtext}>Skipping to next step...</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />
        
        {/* Progress bar */}
        <View style={styles(theme).progressBarContainer}>
          <View style={styles(theme).progressBarWrapper}>
            <TouchableOpacity 
              style={styles(theme).backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles(theme).backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles(theme).progressBarBackground}>
              <View style={[styles(theme).progressBarFill, { width: '50%' }]} />
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles(theme).scrollContent}
          contentContainerStyle={styles(theme).scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles(theme).content}>
            <Animated.Text style={[styles(theme).title, titleAnimation]}>
              Select Apps to Manage
            </Animated.Text>
            
            <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
              Choose which apps and categories you want Serenity to help you manage. You can change this anytime in settings.
            </Animated.Text>

            <Animated.View style={[styles(theme).pickerSection, contentAnimation]}>
              {!selection ? (
                <View style={styles(theme).emptyState}>
                  <Text style={styles(theme).emptyStateIcon}>📱</Text>
                  <Text style={styles(theme).emptyStateTitle}>No apps selected yet</Text>
                  <Text style={styles(theme).emptyStateText}>
                    Tap the button below to open the app picker and choose which apps you'd like to manage.
                  </Text>
                  
                  <Button
                    title="Select Apps & Categories"
                    onPress={handleOpenPicker}
                    style={styles(theme).pickerButton}
                  />
                </View>
              ) : (
                <View style={styles(theme).selectionDisplay}>
                  {/* Selected Categories */}
                  {selection.categories.length > 0 && (
                    <View style={styles(theme).selectionSection}>
                      <Text style={styles(theme).selectionSectionTitle}>
                        Categories ({selection.categories.length})
                      </Text>
                      {selection.categories.map((category) => (
                        <View key={category.id} style={styles(theme).selectionItem}>
                          <Text style={styles(theme).selectionItemIcon}>{category.icon}</Text>
                          <Text style={styles(theme).selectionItemText}>{category.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Selected Apps */}
                  {selection.applications.length > 0 && (
                    <View style={styles(theme).selectionSection}>
                      <Text style={styles(theme).selectionSectionTitle}>
                        Individual Apps ({selection.applications.length})
                      </Text>
                      {selection.applications.map((app) => (
                        <View key={app.bundleId} style={styles(theme).selectionItem}>
                          <View style={styles(theme).appIconPlaceholder}>
                            <Text style={styles(theme).appIconText}>
                              {app.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles(theme).appInfo}>
                            <Text style={styles(theme).selectionItemText}>{app.name}</Text>
                            <Text style={styles(theme).selectionItemSubtext}>{app.categoryName}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles(theme).selectionNote}>
                    ✨ These apps will be managed by Serenity to help you stay focused and mindful.
                  </Text>
                </View>
              )}

              {error && (
                <View style={styles(theme).errorContainer}>
                  <Text style={styles(theme).errorTextSmall}>{error}</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </ScrollView>

        <Animated.View style={[styles(theme).actions, buttonAnimation]}>
          <Button
            title={selection ? "Continue" : "Skip for Now"}
            onPress={handleContinue}
          />
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: theme.textSecondary,
  },
  errorText: {
    fontSize: typography.body,
    color: theme.error,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: spacing.sm,
    fontSize: typography.small,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: theme.background,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.textPrimary,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.body,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  pickerSection: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  pickerButton: {
    minWidth: 200,
  },
  selectionDisplay: {
    gap: spacing.lg,
  },
  selectionSection: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  selectionSectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.md,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  selectionItemIcon: {
    fontSize: 32,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: '#FFFFFF',
  },
  appInfo: {
    flex: 1,
  },
  selectionItemText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: theme.textPrimary,
  },
  selectionItemSubtext: {
    fontSize: typography.small,
    color: theme.textSecondary,
    marginTop: 2,
  },
  selectionNote: {
    fontSize: typography.small,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.error,
  },
  errorTextSmall: {
    fontSize: typography.small,
    color: theme.error,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
