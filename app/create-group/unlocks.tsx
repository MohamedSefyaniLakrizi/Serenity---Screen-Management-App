import { OnboardingHeader } from '@/components/OnboardingHeader';
import { Button } from '@/components/ui';
import { spacing } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UNLOCK_PRESETS = [1, 2, 3, 5, 10];

export default function UnlocksConfigScreen() {
  const theme = useThemedColors();
  const params = useLocalSearchParams();
  const [selectedUnlocks, setSelectedUnlocks] = useState(3);
  const [customUnlocks, setCustomUnlocks] = useState('');

  // Parse params
  const familyActivitySelection = (params.familyActivitySelection as string) ?? '';
  const applicationCount = parseInt((params.applicationCount as string) ?? '0', 10);
  const categoryCount = parseInt((params.categoryCount as string) ?? '0', 10);
  const groupName = params.groupName as string;

  const handleContinue = () => {
    const unlocks = customUnlocks ? parseInt(customUnlocks, 10) : selectedUnlocks;

    if (isNaN(unlocks) || unlocks < 0 || unlocks > 100) {
      Alert.alert('Validation Error', 'Please enter a valid number of unlocks (0-100)');
      return;
    }

    router.push({
      pathname: '/create-group/custom-timeframe',
      params: {
        familyActivitySelection,
        applicationCount: applicationCount.toString(),
        categoryCount: categoryCount.toString(),
        groupName,
        unlockCount: unlocks.toString(),
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />

        <OnboardingHeader
          progressFraction={3 / 4}
          stepLabel="Step 3 of 4"
          onBack={() => router.back()}
        />

        <View style={styles.scrollView}>
          <View style={[styles.content, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }]}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Daily Unlocks
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose how many times you can unlock these apps per day
              </Text>
            </View>

            {/* Preset Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Quick Select
              </Text>
              <View style={styles.presetsGrid}>
                {UNLOCK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor:
                          !customUnlocks && selectedUnlocks === preset
                            ? theme.primary
                            : theme.border,
                      },
                      !customUnlocks &&
                        selectedUnlocks === preset &&
                        styles.presetButtonSelected,
                    ]}
                    onPress={() => {
                      setSelectedUnlocks(preset);
                      setCustomUnlocks('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetNumber,
                        {
                          color:
                            !customUnlocks && selectedUnlocks === preset
                              ? theme.primary
                              : theme.textPrimary,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                    <Text
                      style={[
                        styles.presetLabel,
                        {
                          color:
                            !customUnlocks && selectedUnlocks === preset
                              ? theme.primary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      unlocks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Or Enter Custom Amount
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: customUnlocks ? theme.primary : theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Enter number"
                placeholderTextColor={theme.textTertiary}
                value={customUnlocks}
                onChangeText={(text) => {
                  setCustomUnlocks(text);
                  if (text) {
                    setSelectedUnlocks(0);
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        </View>

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
  scrollView: {
    flex: 1,
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
    fontFamily: FONTS.loraMedium,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.interRegular,
    lineHeight: 20,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.interSemiBold,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetButton: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minWidth: 70,
  },
  presetButtonSelected: {
    borderWidth: 2,
  },
  presetNumber: {
    fontSize: 20,
    fontFamily: FONTS.interBold,
    marginBottom: spacing.xs / 2,
  },
  presetLabel: {
    fontSize: 11,
    fontFamily: FONTS.interMedium,
  },
  customInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: FONTS.interSemiBold,
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
});
