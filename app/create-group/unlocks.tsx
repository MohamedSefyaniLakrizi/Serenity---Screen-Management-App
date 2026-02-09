import { Button } from '@/components/ui';
import { spacing } from '@/constants';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { AppGroupService, AppInfo } from '@/services/appGroups';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
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
  const [loading, setLoading] = useState(false);

  // Parse params
  const selectedApps: AppInfo[] = params.apps ? JSON.parse(params.apps as string) : [];
  const groupName = params.groupName as string;

  const handleCreate = async () => {
    const unlocks = customUnlocks ? parseInt(customUnlocks, 10) : selectedUnlocks;

    if (isNaN(unlocks) || unlocks < 0 || unlocks > 100) {
      Alert.alert('Validation Error', 'Please enter a valid number of unlocks (0-100)');
      return;
    }

    setLoading(true);

    try {
      await AppGroupService.createAppGroup(
        groupName,
        selectedApps,
        30, // sessionLength - not used in MVP
        unlocks,
        true // isBlocked - always true for MVP
      );

      Alert.alert('Success!', 'App group created successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)/');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create app group. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  { width: '100%', backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Step 3 of 3
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

            {/* Summary */}
            <View
              style={[
                styles.summary,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
                Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Group Name
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {groupName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Apps Selected
                </Text>
                <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                  {selectedApps.length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Daily Unlocks
                </Text>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>
                  {customUnlocks || selectedUnlocks}
                </Text>
              </View>
            </View>
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
            title="Create Group"
            onPress={handleCreate}
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  customInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
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
