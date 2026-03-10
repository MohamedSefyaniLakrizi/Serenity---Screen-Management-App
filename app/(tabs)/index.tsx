import { Card } from "@/components/ui";
import { colors, spacing, typography } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { AppGroup, AppGroupService } from "@/services/appGroups";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronRight,
  Crown,
  Folder,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import type { ViewStyle } from "react-native";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FREE_GROUP_LIMIT = 1;

export default function AppsScreen() {
  const router = useRouter();
  const themedColors = useThemedColors();
  const { isPro, showPaywall } = useRevenueCat();
  const [appGroups, setAppGroups] = useState<AppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload app groups when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppGroups();
    }, []),
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

  const handleCreateGroup = async () => {
    if (!isPro && appGroups.length >= FREE_GROUP_LIMIT) {
      await showPaywall();
      return;
    }
    router.push("/create-group");
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
      ],
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
    const appCount = group.applicationCount ?? group.apps.length;
    const categoryCount = group.categoryCount ?? 0;

    const selectionParts: string[] = [];
    if (appCount > 0)
      selectionParts.push(`${appCount} app${appCount === 1 ? "" : "s"}`);
    if (categoryCount > 0)
      selectionParts.push(
        `${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`,
      );
    const selectionSummary =
      selectionParts.length > 0 ? selectionParts.join("  ·  ") : "No selection";

    const blockLabel = group.isBlocked
      ? "Blocked"
      : `${group.dailyUnlocks} unlock${group.dailyUnlocks === 1 ? "" : "s"}/day`;

    return (
      <TouchableOpacity
        key={group.id}
        onPress={() => router.push(`/edit-group/${group.id}` as any)}
        activeOpacity={0.7}
      >
        <Card
          style={
            {
              ...styles.groupCard,
              backgroundColor: themedColors.surface,
            } as ViewStyle
          }
        >
          <View style={styles.cardRow}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: themedColors.surfaceSecondary },
              ]}
            >
              <Folder size={18} color={themedColors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text
                style={[styles.groupName, { color: themedColors.textPrimary }]}
                numberOfLines={1}
              >
                {group.name}
              </Text>
              <Text
                style={[
                  styles.appCountText,
                  { color: themedColors.textSecondary },
                ]}
              >
                {selectionSummary}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.blockLabel,
                  { color: themedColors.textTertiary },
                ]}
              >
                {blockLabel}
              </Text>
              <View style={styles.cardActions}>
                <ChevronRight size={16} color={themedColors.textTertiary} />
                <TouchableOpacity
                  onPress={() => handleDeleteGroup(group.id, group.name)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={15} color={themedColors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: themedColors.background }]}
      >
        <View style={styles.content}>
          <Text
            style={[styles.loadingText, { color: themedColors.textSecondary }]}
          >
            Loading app groups...
          </Text>
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
          <Text style={[styles.title, { color: themedColors.textPrimary }]}>
            App Groups
          </Text>
          <Text
            style={[styles.subtitle, { color: themedColors.textSecondary }]}
          >
            Manage your blocked and limited apps
          </Text>
        </View>

        {/* Upgrade Banner for free users */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => showPaywall()}
            style={styles.upgradeBanner}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeBannerContent}>
              <Crown size={20} color="#fff" />
              <View style={styles.upgradeBannerText}>
                <Text style={styles.upgradeBannerTitle}>Upgrade to Serenity Pro</Text>
                <Text style={styles.upgradeBannerSubtitle}>Unlimited groups, flexible blocking & more</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Create Group Button */}
        <TouchableOpacity
          onPress={handleCreateGroup}
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
            <Smartphone
              size={64}
              color={themedColors.textSecondary}
              strokeWidth={1.5}
            />
            <Text
              style={[
                styles.emptyStateTitle,
                { color: themedColors.textPrimary },
              ]}
            >
              No app groups yet
            </Text>
            <Text
              style={[
                styles.emptyStateText,
                { color: themedColors.textSecondary },
              ]}
            >
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
  upgradeBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  upgradeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontFamily: FONTS.interSemiBold,
    color: "#fff",
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
    color: "rgba(255,255,255,0.8)",
  },
  title: {
    fontSize: typography.h1,
    fontFamily: FONTS.loraMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.body,
    fontFamily: FONTS.interRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: typography.body,
    fontFamily: FONTS.interRegular,
    color: colors.textSecondary,
    textAlign: "center",
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.small,
    fontFamily: FONTS.interRegular,
    color: colors.textSecondary,
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
    fontFamily: FONTS.interSemiBold,
    color: colors.primary,
  },
  groupsList: {
    gap: spacing.md,
  },
  groupCard: {
    padding: spacing.md,
    borderRadius: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  groupName: {
    fontSize: 15,
    fontFamily: FONTS.interSemiBold,
  },
  appCountText: {
    fontSize: 12,
    fontFamily: FONTS.interMedium,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  blockLabel: {
    fontSize: 11,
    fontFamily: FONTS.interMedium,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButton: {
    padding: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.h2,
    fontFamily: FONTS.loraMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: typography.body,
    fontFamily: FONTS.interRegular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
