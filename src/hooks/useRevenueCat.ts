/**
 * useRevenueCat
 *
 * A high-level hook that surfaces everything a component needs to interact
 * with RevenueCat: subscription status, paywall presentation, and purchases.
 *
 * Examples
 * --------
 * // Gate a feature behind Serenity Pro
 * const { isPro } = useRevenueCat();
 * if (!isPro) return <UpgradePrompt />;
 *
 * // Show the full paywall
 * const { showPaywall } = useRevenueCat();
 * <Button onPress={showPaywall} title="Upgrade to Pro" />
 *
 * // Show paywall only if the user isn't already Pro
 * const { showPaywallIfNeeded } = useRevenueCat();
 * <Button onPress={showPaywallIfNeeded} title="Unlock Pro" />
 */

import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { ENTITLEMENT_PRO } from '../services/purchases';
import { usePurchasesStore } from '../store/purchasesStore';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRevenueCat() {
  const {
    isPro,
    customerInfo,
    currentOffering,
    isPurchasing,
    isFetchingInfo,
    error,
    fetchCustomerInfo,
    purchasePackageById,
    restorePurchases,
    clearError,
  } = usePurchasesStore();

  /**
   * Present the RevenueCat paywall for the current offering.
   * Returns true if the user ended up purchasing or restoring.
   */
  const showPaywall = async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywall();
      const purchased =
        result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
      if (purchased) {
        // Refresh state so the rest of the app immediately knows about the purchase.
        await fetchCustomerInfo();
      }
      return purchased;
    } catch (err) {
      console.error('[useRevenueCat] showPaywall error:', err);
      return false;
    }
  };

  /**
   * Present the paywall ONLY if the user does not already have Serenity Pro.
   * Returns true if a purchase occurred, false otherwise.
   */
  const showPaywallIfNeeded = async (): Promise<boolean> => {
    if (isPro) return false;
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_PRO,
      });
      const purchased =
        result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
      if (purchased) {
        await fetchCustomerInfo();
      }
      return purchased;
    } catch (err) {
      console.error('[useRevenueCat] showPaywallIfNeeded error:', err);
      return false;
    }
  };

  /**
   * Present the paywall for a specific offering identifier.
   */
  const showPaywallForOffering = async (offeringId: string): Promise<boolean> => {
    try {
      const { getOfferings } = await import('../services/purchases');
      const offerings = await getOfferings();
      const offering = offerings.all[offeringId];
      if (!offering) {
        console.warn(`[useRevenueCat] Offering "${offeringId}" not found.`);
        return false;
      }
      const result = await RevenueCatUI.presentPaywall({ offering });
      const purchased =
        result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
      if (purchased) await fetchCustomerInfo();
      return purchased;
    } catch (err) {
      console.error('[useRevenueCat] showPaywallForOffering error:', err);
      return false;
    }
  };

  /**
   * Purchase a package by its identifier string (e.g. 'monthly', 'yearly', 'lifetime').
   */
  const purchase = (packageId: string) => purchasePackageById(packageId);

  /**
   * Restore the user's previous purchases.
   */
  const restore = () => restorePurchases();

  /**
   * Refresh customer info (e.g. after returning from background).
   */
  const refresh = () => fetchCustomerInfo();

  return {
    // State
    isPro,
    customerInfo,
    currentOffering,
    isPurchasing,
    isLoading: isFetchingInfo,
    error,

    // Actions
    showPaywall,
    showPaywallIfNeeded,
    showPaywallForOffering,
    purchase,
    restore,
    refresh,
    clearError,
  };
}
