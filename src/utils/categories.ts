import { AppCategory } from "@/types";

/**
 * App category definitions and mappings
 */

export const APP_CATEGORIES: Record<AppCategory, {
  label: string;
  icon: string;
  color: string;
  apps: string[]; // bundleId patterns
}> = {
  social: {
    label: "Social Media",
    icon: "👥",
    color: "#FF6B9D",
    apps: [
      "com.instagram",
      "com.facebook",
      "com.twitter",
      "com.tiktok",
      "com.snapchat",
      "com.reddit",
    ],
  },
  games: {
    label: "Games",
    icon: "🎮",
    color: "#9B59B6",
    apps: [
      "game",
      "play",
      "minecraft",
      "roblox",
      "fortnite",
      "callofduty",
    ],
  },
  entertainment: {
    label: "Entertainment",
    icon: "🎬",
    color: "#E74C3C",
    apps: [
      "youtube",
      "netflix",
      "spotify",
      "hulu",
      "disney",
      "twitch",
    ],
  },
  productivity: {
    label: "Productivity",
    icon: "📊",
    color: "#27AE60",
    apps: [
      "slack",
      "notion",
      "evernote",
      "todoist",
      "asana",
      "trello",
    ],
  },
  other: {
    label: "Other",
    icon: "📱",
    color: "#95A5A6",
    apps: [],
  },
};

/**
 * Categorize an app by its bundle ID
 */
export function categorizeApp(bundleId: string): AppCategory {
  const lowerBundleId = bundleId.toLowerCase();
  
  for (const [category, data] of Object.entries(APP_CATEGORIES)) {
    for (const pattern of data.apps) {
      if (lowerBundleId.includes(pattern.toLowerCase())) {
        return category as AppCategory;
      }
    }
  }
  
  return "other";
}

/**
 * Get all apps in a category from a list of apps
 */
export function getAppsInCategory(
  apps: { bundleId: string; appName: string }[],
  category: AppCategory
): { bundleId: string; appName: string }[] {
  return apps.filter(app => categorizeApp(app.bundleId) === category);
}

/**
 * Get category statistics
 */
export function getCategoryStats(
  apps: { bundleId: string; appName: string }[]
): Record<AppCategory, number> {
  const stats: Record<AppCategory, number> = {
    social: 0,
    games: 0,
    entertainment: 0,
    productivity: 0,
    other: 0,
  };
  
  apps.forEach(app => {
    const category = categorizeApp(app.bundleId);
    stats[category]++;
  });
  
  return stats;
}
