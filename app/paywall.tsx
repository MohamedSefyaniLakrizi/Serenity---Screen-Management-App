/**
 * PaywallScreen
 *
 * A full-screen paywall using RevenueCat's remote-configured paywall UI
 * (`<RevenueCatUI.Paywall>`). If RevenueCat does not have a paywall
 * configured for the current offering, the SDK automatically renders a
 * default paywall showing all available packages.
 *
 * Navigation
 * ----------
 * Push this screen with `router.push('/paywall')` from anywhere in the app.
 * It can also be used as a modal by adding it to the Stack navigator.
 *
 * The screen self-dismisses after a successful purchase/restore.
 */

import { colors } from '@/constants';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaywallScreen() {
  const router = useRouter();
  const { currentOffering, isLoading, refresh } = useRevenueCat();

  const navigateAway = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/' as any);
    }
  }, [router]);

  // Called when the user successfully completes a purchase.
  const handlePurchaseCompleted = useCallback(
    async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
      console.log('[Paywall] Purchase completed:', customerInfo.entitlements.active);
      // Refresh the store so isPro updates everywhere.
      await refresh();
      navigateAway();
    },
    [refresh, navigateAway]
  );

  // Called when the user successfully restores purchases.
  const handleRestoreCompleted = useCallback(
    async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
      console.log('[Paywall] Restore completed:', customerInfo.entitlements.active);
      await refresh();
      navigateAway();
    },
    [refresh, navigateAway]
  );

  // Called when the user dismisses the paywall without purchasing.
  const handleDismiss = useCallback(() => {
    navigateAway();
  }, [navigateAway]);

  if (isLoading || !currentOffering) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading plans…</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Close button for accessibility / hard-paywall avoidance */}
      <SafeAreaView style={styles.closeRow} edges={['top']}>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton} accessibilityLabel="Close paywall">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* The RevenueCat paywall view – fully managed from the RC dashboard */}
      <RevenueCatUI.Paywall
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
        onPurchaseCancelled={handleDismiss}
        onPurchaseError={({ error }) => {
          console.error('[Paywall] Purchase error:', error);
        }}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  closeRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingRight: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
