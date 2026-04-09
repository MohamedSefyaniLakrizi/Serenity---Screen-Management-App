import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { spacing, typography } from "@/constants";
import { FONTS } from "@/constants/typography";
import { ChevronLeft } from "lucide-react-native";

export default function CategoriesScreen() {
  const router = useRouter();
  const theme = useThemedColors();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <ChevronLeft size={24} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Categories</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  back: { marginBottom: spacing.lg },
  title: { fontFamily: FONTS.loraBold, fontSize: typography.sizes.h1, marginBottom: spacing.sm },
  subtitle: { fontFamily: FONTS.interRegular, fontSize: typography.sizes.body },
});
