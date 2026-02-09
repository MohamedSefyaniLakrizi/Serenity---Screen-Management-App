import { Button, Card } from "@/components/ui";
import { borderRadius, colors, spacing, typography } from "@/constants";
import { useAppStore } from "@/store/appStore";
import { AppCategory, CategoryLimit } from "@/types";
import { APP_CATEGORIES, getAppsInCategory } from "@/utils/categories";
import { useRouter } from "expo-router";
import { ChevronRight, Clock, Hash } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InstalledApp {
  bundleId: string;
  appName: string;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { categoryLimits, setCategoryLimit, loadFromStorage } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | null>(null);
  const [timeLimit, setTimeLimit] = useState("");
  const [maxUnlocks, setMaxUnlocks] = useState("");

  // Mock installed apps for demo
  const installedApps: InstalledApp[] = [
    { bundleId: "com.instagram.app", appName: "Instagram" },
    { bundleId: "com.facebook.app", appName: "Facebook" },
    { bundleId: "com.twitter.app", appName: "Twitter" },
    { bundleId: "com.tiktok.app", appName: "TikTok" },
    { bundleId: "com.youtube.app", appName: "YouTube" },
    { bundleId: "com.netflix.app", appName: "Netflix" },
    { bundleId: "com.spotify.app", appName: "Spotify" },
  ];

  useEffect(() => {
    loadFromStorage();
  }, []);

  const openCategoryModal = (category: AppCategory) => {
    setSelectedCategory(category);
    
    const existingLimit = categoryLimits.find(c => c.category === category);
    if (existingLimit) {
      setTimeLimit(existingLimit.timeLimit.toString());
      setMaxUnlocks(existingLimit.maxUnlocks.toString());
    } else {
      setTimeLimit("120");
      setMaxUnlocks("10");
    }
    
    setModalVisible(true);
  };

  const saveCategoryLimit = async () => {
    if (!selectedCategory) return;

    const timeLimitNum = parseInt(timeLimit);
    const maxUnlocksNum = parseInt(maxUnlocks);

    if (isNaN(timeLimitNum) || timeLimitNum < 0) {
      Alert.alert("Invalid Input", "Please enter a valid time limit");
      return;
    }

    if (isNaN(maxUnlocksNum) || maxUnlocksNum < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of unlocks");
      return;
    }

    try {
      // Get all apps in this category
      const categoryApps = getAppsInCategory(installedApps, selectedCategory);
      const bundleIds = categoryApps.map(app => app.bundleId);

      // Create category limit
      const categoryLimit: CategoryLimit = {
        category: selectedCategory,
        timeLimit: timeLimitNum,
        maxUnlocks: maxUnlocksNum,
        currentUnlocks: 0,
        lastReset: new Date().toISOString().split('T')[0],
        apps: bundleIds,
      };

      // Save to store
      setCategoryLimit(categoryLimit);

      setModalVisible(false);
      Alert.alert(
        "Success", 
        `Limits set for ${APP_CATEGORIES[selectedCategory].label}\n${categoryApps.length} apps affected`
      );
    } catch (error) {
      console.error("Error setting category limit:", error);
      Alert.alert("Error", "Failed to set category limit");
    }
  };

  const getCategoryLimit = (category: AppCategory): CategoryLimit | undefined => {
    return categoryLimits.find(c => c.category === category);
  };

  const getCategoryAppCount = (category: AppCategory): number => {
    return getAppsInCategory(installedApps, category).length;
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return "Blocked";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>App Categories</Text>
            <Text style={styles.subtitle}>Set limits for groups of apps</Text>
          </View>

          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>
              Setting a category limit will apply to all apps in that category. 
              The unlock limit is shared across all apps in the category.
            </Text>
          </Card>

          {/* Category Cards */}
          <View style={styles.categoriesSection}>
            {(Object.keys(APP_CATEGORIES) as AppCategory[]).map((category) => {
              const categoryData = APP_CATEGORIES[category];
              const limit = getCategoryLimit(category);
              const appCount = getCategoryAppCount(category);
              const hasLimit = !!limit;

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => openCategoryModal(category)}
                >
                  <Card style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: categoryData.color + '20' }
                      ]}>
                        <Text style={styles.categoryEmoji}>{categoryData.icon}</Text>
                      </View>
                      
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{categoryData.label}</Text>
                        <Text style={styles.appCount}>{appCount} apps</Text>
                      </View>

                      <ChevronRight size={20} color={colors.textSecondary} />
                    </View>

                    {hasLimit && (
                      <View style={styles.categoryLimits}>
                        <View style={styles.limitBadge}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.limitText}>{formatTime(limit.timeLimit)}</Text>
                        </View>
                        <View style={styles.limitBadge}>
                          <Hash size={14} color={colors.textSecondary} />
                          <Text style={styles.limitText}>
                            {limit.maxUnlocks - limit.currentUnlocks}/{limit.maxUnlocks} unlocks
                          </Text>
                        </View>
                      </View>
                    )}

                    {!hasLimit && (
                      <Text style={styles.noLimitText}>No limit set</Text>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Category Limit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Set Limit for {selectedCategory && APP_CATEGORIES[selectedCategory].label}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Time Limit (minutes per day)</Text>
              <Text style={styles.inputHint}>
                Total time for all apps in this category. Set to 0 to block completely.
              </Text>
              <TextInput
                style={styles.input}
                value={timeLimit}
                onChangeText={setTimeLimit}
                keyboardType="numeric"
                placeholder="120"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Unlocks Per Day</Text>
              <Text style={styles.inputHint}>
                Shared across all apps in category
              </Text>
              <TextInput
                style={styles.input}
                value={maxUnlocks}
                onChangeText={setMaxUnlocks}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.affectedApps}>
              <Text style={styles.affectedTitle}>Affected Apps:</Text>
              {selectedCategory && getAppsInCategory(installedApps, selectedCategory).map(app => (
                <Text key={app.bundleId} style={styles.affectedApp}>• {app.appName}</Text>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={saveCategoryLimit}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textGray,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Categories
  categoriesSection: {
    gap: spacing.md,
  },
  categoryCard: {
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xxs,
  },
  appCount: {
    fontSize: typography.small,
    color: colors.textGray,
  },
  categoryLimits: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  limitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: borderRadius.small,
  },
  limitText: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },
  noLimitText: {
    fontSize: typography.small,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs / 2,
  },
  inputHint: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  affectedApps: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
  },
  affectedTitle: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  affectedApp: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginTop: spacing.xxs / 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
