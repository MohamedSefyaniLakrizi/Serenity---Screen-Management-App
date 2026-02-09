import { colors, spacing, typography } from "@/constants";
import { FoxEvolutionStage, FoxMood } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";

interface FoxAvatarProps {
  evolutionStage: FoxEvolutionStage;
  mood: FoxMood;
  happiness: number;
  name: string;
}

export function FoxAvatar({ evolutionStage, mood, happiness, name }: FoxAvatarProps) {
  const getMoodEmoji = (mood: FoxMood) => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'neutral':
        return '😐';
      case 'sad':
        return '😢';
      case 'sleeping':
        return '😴';
      default:
        return '😊';
    }
  };

  const getEvolutionImage = (stage: FoxEvolutionStage) => {
    // For now, use the default mascot image for all stages
    // In production, you'd have 3 different images: baby_fox.png, teen_fox.png, adult_fox.png
    return require("../../assets/images/default_mascot.png");
  };

  const getBackgroundGradient = (stage: FoxEvolutionStage): [string, string] => {
    switch (stage) {
      case 'baby':
        return ['#FFE5E5', '#FFF0E5']; // Soft pink to peach
      case 'teen':
        return ['#E5F4FF', '#F0E5FF']; // Soft blue to lavender
      case 'adult':
        return ['#E5FFE5', '#E5FFFF']; // Soft green to cyan - vibrant and lively
      default:
        return ['#FFE5E5', '#FFF0E5'];
    }
  };

  const getStageLabel = (stage: FoxEvolutionStage) => {
    switch (stage) {
      case 'baby':
        return 'Baby Fox (Days 1-7)';
      case 'teen':
        return 'Teen Fox (Days 8-30)';
      case 'adult':
        return 'Majestic Fox (Day 31+)';
      default:
        return 'Baby Fox';
    }
  };

  const getFoxSize = (stage: FoxEvolutionStage) => {
    switch (stage) {
      case 'baby':
        return { width: 120, height: 120 };
      case 'teen':
        return { width: 160, height: 160 };
      case 'adult':
        return { width: 200, height: 200 };
      default:
        return { width: 120, height: 120 };
    }
  };

  const foxSize = getFoxSize(evolutionStage);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getBackgroundGradient(evolutionStage)}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Evolution Stage Badge */}
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{getStageLabel(evolutionStage)}</Text>
          </View>

          {/* Fox Image */}
          <View style={[styles.foxContainer, { width: foxSize.width, height: foxSize.height }]}>
            <Image
              source={getEvolutionImage(evolutionStage)}
              style={styles.foxImage}
              resizeMode="contain"
            />
          </View>

          {/* Fox Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.foxName}>{name}</Text>
            
            <View style={styles.moodRow}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
              <Text style={styles.moodText}>{mood.charAt(0).toUpperCase() + mood.slice(1)}</Text>
            </View>

            {/* Happiness Bar */}
            <View style={styles.happinessContainer}>
              <Text style={styles.happinessLabel}>Happiness</Text>
              <View style={styles.happinessBarBg}>
                <View style={[styles.happinessBarFill, { width: `${happiness}%` }]} />
              </View>
              <Text style={styles.happinessValue}>{happiness}%</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
    minHeight: 380,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  stageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  stageText: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  foxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  foxImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  foxName: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  happinessContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  happinessLabel: {
    fontSize: typography.small,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  happinessBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  happinessBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 10,
  },
  happinessValue: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
});
