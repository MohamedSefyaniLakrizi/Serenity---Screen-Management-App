/**
 * RevenueCat Purchases Service
 *
 * Wraps react-native-purchases to provide a clean API for:
 * - SDK initialization
 * - Entitlement checking
 * - Fetching offerings
 * - Making purchases
 * - Restoring purchases
 * - Customer info retrieval
 */

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Your RevenueCat public API key (Apple / iOS) */
const RC_API_KEY_IOS = 'test_DtXiUbRpjorxKjwwuGhozpjBJyx';

/**
 * Place your Android public API key here when you have one.
 * You can obtain it from the RevenueCat dashboard under
 * Project → Apps → Your Android App → API Keys.
 */
const RC_API_KEY_ANDROID = 'your_android_api_key_here';

/** The RevenueCat entitlement identifier for Serenity Pro. */
export const ENTITLEMENT_PRO = 'Serenity Pro';

/**
 * Product identifiers as configured in App Store Connect / Google Play.
 * Make sure the offering in the RevenueCat dashboard contains packages with
 * these identifiers.
 */
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

// ---------------------------------------------------------------------------
// SDK Init
// ---------------------------------------------------------------------------

/**
 * Configure the RevenueCat SDK.
 * Call this once early in the app lifecycle (e.g. in the root layout).
 *
 * @param appUserID  Optional custom user identifier. If omitted, RevenueCat
 *                   will create an anonymous ID automatically.
 */
export async function configurePurchases(appUserID?: string): Promise<void> {
  try {
    // Enable verbose logging in development.
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey = Platform.OS === 'android' ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;

    await Purchases.configure({
      apiKey,
      appUserID: appUserID ?? undefined,
    });

    console.log('[RevenueCat] SDK configured successfully');
  } catch (error) {
    console.error('[RevenueCat] Failed to configure SDK:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Customer Info
// ---------------------------------------------------------------------------

/**
 * Fetch the latest CustomerInfo from RevenueCat.
 * The SDK caches this value aggressively, so repeated calls are inexpensive.
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

/**
 * Returns true when the "Serenity Pro" entitlement is currently active.
 */
export async function hasProEntitlement(): Promise<boolean> {
  try {
    const info = await getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_PRO];
  } catch {
    return false;
  }
}

/**
 * Checks CustomerInfo synchronously from a cached object.
 */
export function isProActive(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[ENTITLEMENT_PRO];
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

/**
 * Fetch all configured Offerings from RevenueCat.
 */
export async function getOfferings(): Promise<PurchasesOfferings> {
  return Purchases.getOfferings();
}

/**
 * Convenience helper – returns the current (default) offering.
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await getOfferings();
  return offerings.current;
}

// ---------------------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------------------

export interface PurchaseResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: PurchasesError | Error;
  userCancelled?: boolean;
}

/**
 * Purchase a Package.
 *
 * @param pkg  The RevenueCat PurchasesPackage object from an Offering.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error) {
    const purchasesError = error as PurchasesError;
    // userCancelledPurchase is a property on PurchasesError
    const userCancelled = (purchasesError as any)?.userCancelled === true;
    if (userCancelled) {
      return { success: false, userCancelled: true };
    }
    console.error('[RevenueCat] Purchase failed:', error);
    return { success: false, error: purchasesError };
  }
}

/**
 * Restore previous purchases for the current user / device.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    return { success: false, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// User Identity
// ---------------------------------------------------------------------------

/**
 * Log in with a known user identifier (e.g. your Supabase user id).
 * This merges any anonymous purchases with the identified user.
 */
export async function logInUser(appUserID: string): Promise<void> {
  try {
    const { customerInfo } = await Purchases.logIn(appUserID);
    console.log('[RevenueCat] Logged in user:', appUserID, customerInfo);
  } catch (error) {
    console.error('[RevenueCat] logIn failed:', error);
  }
}

/**
 * Log out the current user and revert to an anonymous ID.
 */
export async function logOutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] Logged out');
  } catch (error) {
    console.error('[RevenueCat] logOut failed:', error);
  }
}

/**
 * Add a listener that fires whenever the SDK receives updated CustomerInfo.
 * Returns a cleanup function.
 */
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
