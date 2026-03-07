import { Card } from "@/components/ui";
import { colors, spacing, typography } from "@/constants";
import { AppGroup, AppGroupSchedule, AppGroupService } from "@/services/appGroups";
import { useRouter } from "expo-router";
import { CalendarDays, Clock, Edit2, Hash, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
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
  const [appGroups, setAppGroups] = useState<AppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppGroups();
  }, []);

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

  const DAY_LABELS: Record<string, string> = {
    mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'Sa', sun: 'Su',
  };
  const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const formatSchedule = (schedule?: AppGroupSchedule): string => {
    if (!schedule || schedule.alwaysOn) return 'Always On';
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    const fmt = (h: number, m: number) => {
      const s = h < 12 ? 'AM' : 'PM';
      return `${h % 12 === 0 ? 12 : h % 12}:${m.toString().padStart(2, '0')} ${s}`;
    };
    const timePart = `${fmt(sh, sm)} – ${fmt(eh, em)}`;
    const isAllDays = ALL_DAYS.every((d) => schedule.days.includes(d));
    const isWeekdays = ['mon','tue','wed','thu','fri'].every((d) => schedule.days.includes(d)) && !schedule.days.includes('sat') && !schedule.days.includes('sun');
    const dayPart = isAllDays ? 'Every day' : isWeekdays ? 'Weekdays' : schedule.days.map((d) => DAY_LABELS[d]).join('');
    return `${timePart} · ${dayPart}`;
  };

  const renderAppGroup = (group: AppGroup) => {
    const unlocksRemaining = group.dailyUnlocks - group.currentUnlocks;
    const isOutOfUnlocks = unlocksRemaining <= 0;

    return (
      <Card key={group.id} style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupTitleContainer}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.appCount}>
              {(group.applicationCount ?? group.apps.length) > 0
                ? `${group.applicationCount ?? group.apps.length} app${(group.applicationCount ?? group.apps.length) === 1 ? '' : 's'}`
                : 'No apps selected'}
              {group.categoryCount ? `  ·  ${group.categoryCount} categor${group.categoryCount === 1 ? 'y' : 'ies'}` : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(`/edit-group/${group.id}` as any)}
              style={styles.iconButton}
            >
              <Edit2 size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteGroup(group.id, group.name)}
              style={styles.iconButton}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App List */}
        <View style={styles.appsList}>
          {group.apps.map((app, index) => (
            <View key={app.bundleId} style={styles.appItem}>
              <Text style={styles.appIcon}>{app.icon || "📱"}</Text>
              <Text style={styles.appName} numberOfLines={1}>
                {app.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Group Settings */}
        <View style={styles.groupSettings}>
          <View style={styles.settingItem}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Mode:</Text>
            <Text style={styles.settingValue}>
              {group.isBlocked ? "Fully Blocked" : formatTime(group.sessionLength)}
            </Text>
          </View>

          {!group.isBlocked && (
            <View style={styles.settingItem}>
              <Hash size={16} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Daily Unlocks:</Text>
              <Text
                style={[
                  styles.settingValue,
                  isOutOfUnlocks && styles.settingValueWarning,
                ]}
              >
                {unlocksRemaining}/{group.dailyUnlocks}
              </Text>
            </View>
          )}

          <View style={styles.settingItem}>
            <CalendarDays size={16} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>When:</Text>
            <Text style={[styles.settingValue, styles.scheduleValue]} numberOfLines={1}>
              {formatSchedule(group.schedule)}
            </Text>
          </View>
        </View>

        {group.isBlocked && (
          <View style={styles.blockedBadge}>
            <Text style={styles.blockedText}>🔒 Completely Blocked</Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading app groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>App Groups</Text>
          <Text style={styles.subtitle}>
            Manage your blocked and limited apps
          </Text>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            ℹ️ App groups let you control multiple apps together. Session length
            is how long you can use apps before getting a reminder. Daily
            unlocks are how many times you can check the apps per day.
          </Text>
        </Card>

        {/* Create Group Button */}
        <TouchableOpacity
          onPress={() => router.push('/create-group' as any)}
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
            <Text style={styles.emptyStateEmoji}>📱</Text>
            <Text style={styles.emptyStateTitle}>No app groups yet</Text>
            <Text style={styles.emptyStateText}>
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  groupTitleContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xxs,
  },
  appCount: {
    fontSize: typography.small,
    color: colors.textGray,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
  },
  appsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  appItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
    maxWidth: "48%",
  },
  appIcon: {
    fontSize: 18,
  },
  appName: {
    fontSize: typography.small,
    color: colors.textDark,
    flex: 1,
  },
  groupSettings: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: typography.small,
    color: colors.textGray,
  },
  settingValue: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
  settingValueWarning: {
    color: colors.error,
  },
  scheduleValue: {
    flex: 1,
  },
  blockedBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.error + "20",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  blockedText: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.error,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
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
