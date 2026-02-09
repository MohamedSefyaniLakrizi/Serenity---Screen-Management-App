import { Card } from "@/components/ui";
import { colors, spacing, typography } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { AppGroup, AppGroupService } from "@/services/appGroups";
import { useFocusEffect, useRouter } from "expo-router";
import { Clock, Flame, Hash, Lock, Plus, Smartphone, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AppsScreen() {
  const router = useRouter();
  const themedColors = useThemedColors();
  const [appGroups, setAppGroups] = useState<AppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload app groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppGroups();
    }, [])
  );

  const loadAppGroups = async () => {
    try {
      setLoading(true);
      const groups = await AppGroupService.getAppGroups();
      setAppGroups(groups);
    } catch (error) {
      console.error("Error loading app groups:", error);
      Alert.alert("Error", "Failed to load app groups");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppGroups();
    setRefreshing(false);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${groupName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AppGroupService.deleteAppGroup(groupId);
              await loadAppGroups();
              Alert.alert("Success", "App group deleted");
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "Failed to delete app group");
            }
          },
        },
      ]
    );
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "Instant Block";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m session`;
    if (mins === 0) return `${hours}h session`;
    return `${hours}h ${mins}m session`;
  };

  const renderAppGroup = (group: AppGroup) => {
    const unlocksRemaining = group.dailyUnlocks - group.currentUnlocks;
    const isOutOfUnlocks = unlocksRemaining <= 0;
    // Calculate streak (placeholder - this would come from your data in production)
    const streak = Math.floor(Math.random() * 15) + 1; // Mock streak for now

    return (
      <Card key={group.id} style={styles.groupCard}>
        <View style={styles.compactHeader}>
          <View style={styles.groupMainInfo}>
            <Text style={[styles.groupName, { color: themedColors.textPrimary }]} numberOfLines={1}>
              {group.name}
            </Text>
            <View style={styles.groupMeta}>
              <Smartphone size={12} color={themedColors.textSecondary} />
              <Text style={[styles.metaText, { color: themedColors.textSecondary }]}>
                {group.apps.length} {group.apps.length === 1 ? "app" : "apps"}
              </Text>
              {group.isBlocked && (
                <>
                  <View style={styles.metaDivider} />
                  <Lock size={12} color={themedColors.textSecondary} />
                  <Text style={[styles.metaText, { color: themedColors.textSecondary }]}>Blocked</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.streakBadge}>
              <Flame size={14} color="#FF6B35" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteGroup(group.id, group.name)}
              style={styles.deleteButton}
            >
              <Trash2 size={18} color={themedColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Stats Row */}
        <View style={styles.statsRow}>
          {!group.isBlocked && (
            <View style={styles.statItem}>
              <Clock size={14} color={themedColors.textSecondary} />
              <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>
                {formatTime(group.sessionLength)}
              </Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Hash size={14} color={themedColors.textSecondary} />
            <Text
              style={[
                styles.statValue,
                { color: themedColors.textPrimary },
                isOutOfUnlocks && { color: colors.error },
              ]}
            >
              {unlocksRemaining}/{group.dailyUnlocks}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themedColors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.loadingText, { color: themedColors.textSecondary }]}>Loading app groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themedColors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themedColors.textPrimary }]}>App Groups</Text>
          <Text style={[styles.subtitle, { color: themedColors.textSecondary }]}>
            Manage your blocked and limited apps
          </Text>
        </View>

        {/* Create Group Button */}
        <TouchableOpacity
          onPress={() => {
            router.push('/create-group');
          }}
          style={styles.createButton}
        >
          <Card style={styles.createButtonCard}>
            <View style={styles.createButtonContent}>
              <Plus size={24} color={colors.primary} />
              <Text style={styles.createButtonText}>Create New Group</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* App Groups List */}
        {appGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Smartphone size={64} color={themedColors.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyStateTitle, { color: themedColors.textPrimary }]}>No app groups yet</Text>
            <Text style={[styles.emptyStateText, { color: themedColors.textSecondary }]}>
              Create a group to start managing your app usage
            </Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {appGroups.map((group) => renderAppGroup(group))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textGray,
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.textGray,
    textAlign: "center",
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.small,
    color: colors.textGray,
    lineHeight: 20,
  },
  createButton: {
    marginBottom: spacing.lg,
  },
  createButtonCard: {
    padding: spacing.md,
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  groupsList: {
    gap: spacing.md,
  },
  groupCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  groupMainInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  groupName: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  metaText: {
    fontSize: typography.small,
    color: colors.textGray,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xxs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FF6B3520",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: typography.semibold,
    color: "#FF6B35",
  },
  deleteButton: {
    padding: spacing.xxs,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  statValue: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.h2,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.body,
    color: colors.textGray,
    textAlign: "center",
  },
});
