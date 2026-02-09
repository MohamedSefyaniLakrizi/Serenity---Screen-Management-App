import { Button } from '@/components/ui';
import { spacing } from '@/constants';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { AppGroupService, AppInfo } from '@/services/appGroups';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lock, Unlock } from 'lucide-react-native';
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

export default function ConfigureGroupScreen() {
  const theme = useThemedColors();
  const params = useLocalSearchParams();
  const [groupName, setGroupName] = useState('');
  const [blockMode, setBlockMode] = useState<'unlocks' | 'blocked'>('unlocks');

  // Parse apps from navigation params
  const selectedApps: AppInfo[] = params.apps
    ? JSON.parse(params.apps as string)
    : [];

  // Set default group name on mount
  React.useEffect(() => {
    const setDefaultName = async () => {
      const groups = await AppGroupService.getAppGroups();
      const groupNumber = groups.length + 1;
      setGroupName(`Group ${groupNumber}`);
    };
    setDefaultName();
  }, []);

  const handleContinue = () => {
    // Validation
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name');
      return;
    }

    // Navigate to appropriate next screen based on mode
    if (blockMode === 'unlocks') {
      router.push({
        pathname: '/create-group/unlocks',
        params: {
          apps: JSON.stringify(selectedApps),
          groupName: groupName.trim(),
        },
      });
    } else {
      router.push({
        pathname: '/create-group/custom-timeframe',
        params: {
          apps: JSON.stringify(selectedApps),
          groupName: groupName.trim(),
        },
      });
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
                  { width: '67%', backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={[styles.stepText, { color: theme.textSecondary }]}>
              Step 2 of 3
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
                Configure Group
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Set a name and choose how to limit access
              </Text>
            </View>

            {/* Group Name Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Group Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="e.g., Social Media, Games, etc."
                placeholderTextColor={theme.textTertiary}
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Block Mode Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Access Control
              </Text>
              <View style={styles.modeGrid}>
                {/* Unlocks Mode */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        blockMode === 'unlocks' ? theme.primary : theme.border,
                    },
                    blockMode === 'unlocks' && styles.modeCardSelected,
                  ]}
                  onPress={() => setBlockMode('unlocks')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor:
                          blockMode === 'unlocks'
                            ? theme.primaryLight
                            : theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Unlock
                      size={24}
                      color={blockMode === 'unlocks' ? theme.primary : theme.textSecondary}
                    />
                  </View>
                  <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>
                    Limited Unlocks
                  </Text>
                  <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>
                    Allow a set number of unlocks per day
                  </Text>
                </TouchableOpacity>

                {/* Blocked Mode */}
                <TouchableOpacity
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        blockMode === 'blocked' ? theme.primary : theme.border,
                    },
                    blockMode === 'blocked' && styles.modeCardSelected,
                  ]}
                  onPress={() => setBlockMode('blocked')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modeIcon,
                      {
                        backgroundColor:
                          blockMode === 'blocked'
                            ? theme.primaryLight
                            : theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Lock
                      size={24}
                      color={blockMode === 'blocked' ? theme.primary : theme.textSecondary}
                    />
                  </View>
                  <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>
                    Fully Blocked
                  </Text>
                  <Text style={[styles.modeSubtitle, { color: theme.textSecondary }]}>
                    Block completely with no access
                  </Text>
                </TouchableOpacity>
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
            title="Continue"
            onPress={handleContinue}
            disabled={!groupName.trim()}
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
  input: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 16,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modeCardSelected: {
    borderWidth: 2,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs / 2,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  modeSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
});
