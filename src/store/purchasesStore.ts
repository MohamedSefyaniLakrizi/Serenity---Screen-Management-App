/**
 * RevenueCat Purchases Store (Zustand)
 *
 * Centralises all subscription-related state so any component can read
 * entitlement status, trigger a paywall, or refresh customer info without
 * prop-drilling.
 *
 * Usage:
 *   const { isPro, customerInfo, fetchCustomerInfo } = usePurchasesStore();
 */

import { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';
import {
    addCustomerInfoListener,
    ENTITLEMENT_PRO,
    getCurrentOffering,
    getCustomerInfo,
    isProActive,
    purchasePackage,
    PurchaseResult,
    restorePurchases,
} from '../services/purchases';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PurchasesState {
  /** Whether the RevenueCat SDK has been initialised. */
  isConfigured: boolean;
  /** Latest customer info from RevenueCat. null until first fetch. */
  customerInfo: CustomerInfo | null;
  /** True when the Serenity Pro entitlement is active. */
  isPro: boolean;
  /** Currently active / default Offering. null until fetched. */
  currentOffering: PurchasesOffering | null;
  /** True while any async purchase operation is in-flight. */
  isPurchasing: boolean;
  /** True while fetching customer info. */
  isFetchingInfo: boolean;
  /** Any error message from the last operation. */
  error: string | null;

  // Actions
  /** Mark the SDK as configured and begin listening to updates. */
  onSDKConfigured: () => void;
  /** Fetch (or refresh) CustomerInfo and the current Offering. */
  fetchCustomerInfo: () => Promise<void>;
  /** Purchase a package by its identifier in the current offering. */
  purchasePackageById: (packageId: string) => Promise<PurchaseResult>;
  /** Restore previous purchases. */
  restorePurchases: () => Promise<PurchaseResult>;
  /** Manually update state with new CustomerInfo (e.g. from the SDK listener). */
  setCustomerInfo: (info: CustomerInfo) => void;
  /** Clear any error message. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  isConfigured: false,
  customerInfo: null,
  isPro: false,
  currentOffering: null,
  isPurchasing: false,
  isFetchingInfo: false,
  error: null,

  onSDKConfigured: () => {
    set({ isConfigured: true });

    // Subscribe to live CustomerInfo updates from the RevenueCat SDK.
    // The cleanup function is intentionally not called here because the store
    // lives for the entire app lifetime. If you need cleanup (e.g. in tests),
    // call `addCustomerInfoListener` directly in your component.
    addCustomerInfoListener((info) => {
      get().setCustomerInfo(info);
    });

    // Do an initial fetch so state is populated right away.
    get().fetchCustomerInfo();
  },

  fetchCustomerInfo: async () => {
    set({ isFetchingInfo: true, error: null });
    try {
      const [info, offering] = await Promise.all([
        getCustomerInfo(),
        getCurrentOffering(),
      ]);
      set({
        customerInfo: info,
        isPro: isProActive(info),
        currentOffering: offering,
        isFetchingInfo: false,
      });
    } catch (error) {
      set({ isFetchingInfo: false, error: (error as Error).message });
    }
  },

  purchasePackageById: async (packageId: string) => {
    const { currentOffering } = get();
    if (!currentOffering) {
      const err = 'No offering available. Please try again.';
      set({ error: err });
      return { success: false, error: new Error(err) };
    }

    const pkg = currentOffering.availablePackages.find(
      (p: PurchasesPackage) => p.packageType === packageId || p.identifier === packageId
    );

    if (!pkg) {
      const err = `Package "${packageId}" not found in the current offering.`;
      set({ error: err });
      return { success: false, error: new Error(err) };
    }

    set({ isPurchasing: true, error: null });
    const result = await purchasePackage(pkg);
    set({ isPurchasing: false });

    if (result.success && result.customerInfo) {
      set({
        customerInfo: result.customerInfo,
        isPro: isProActive(result.customerInfo),
      });
    } else if (result.error) {
      set({ error: (result.error as Error).message });
    }

    return result;
  },

  restorePurchases: async () => {
    set({ isPurchasing: true, error: null });
    const result = await restorePurchases();
    set({ isPurchasing: false });

    if (result.success && result.customerInfo) {
      set({
        customerInfo: result.customerInfo,
        isPro: isProActive(result.customerInfo),
      });
    } else if (result.error) {
      set({ error: (result.error as Error).message });
    }

    return result;
  },

  setCustomerInfo: (info: CustomerInfo) => {
    set({
      customerInfo: info,
      isPro: isProActive(info),
    });
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors (convenience hooks)
// ---------------------------------------------------------------------------

/** Returns true when the user has an active Serenity Pro entitlement. */
export const useIsPro = () => usePurchasesStore((s) => s.isPro);

/** Returns the active entitlement object (or null). */
export const useProEntitlement = () =>
  usePurchasesStore(
    (s) => s.customerInfo?.entitlements.active[ENTITLEMENT_PRO] ?? null
  );
