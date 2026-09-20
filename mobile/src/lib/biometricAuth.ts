import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

/**
 * The device-bound credential itself (a random 32-byte secret the server
 * issued, hashed server-side, never the password) lives in SecureStore —
 * iOS Keychain / Android Keystore — never in plain AsyncStorage, and is
 * only ever written after a successful biometric enrollment step that
 * itself required one real, already-completed login.
 */
export type StoredBiometricCredential = { id: string; credential: string };

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch {
    return false;
  }
}

export type BiometricAuthResult =
  | { success: true }
  | { success: false; error: "no_hardware" | "not_enrolled" | "cancelled" | "failed" };

/**
 * Prompts Face ID/Touch ID (or Android biometric/device credential) and
 * resolves once the OS itself has confirmed the person's identity. This
 * function never sees or handles anything about *which* account is signing
 * in — that's entirely the caller's job once this resolves successfully.
 */
export async function promptBiometricUnlock(reason: string): Promise<BiometricAuthResult> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
  if (!hasHardware) return { success: false, error: "no_hardware" };

  const isEnrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
  if (!isEnrolled) return { success: false, error: "not_enrolled" };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (result.success) return { success: true };
  if (result.error === "user_cancel" || result.error === "system_cancel") {
    return { success: false, error: "cancelled" };
  }
  return { success: false, error: "failed" };
}

function storageKey(namespace: "seller" | "admin"): string {
  return `dpm_${namespace}_biometric_credential`;
}

export async function storeBiometricCredential(
  namespace: "seller" | "admin",
  value: StoredBiometricCredential
): Promise<void> {
  await SecureStore.setItemAsync(storageKey(namespace), JSON.stringify(value));
}

export async function getBiometricCredential(
  namespace: "seller" | "admin"
): Promise<StoredBiometricCredential | null> {
  const raw = await SecureStore.getItemAsync(storageKey(namespace));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBiometricCredential;
  } catch {
    return null;
  }
}

export async function clearBiometricCredential(namespace: "seller" | "admin"): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(namespace));
}

// Not a security control — purely so the "enable Face ID?" prompt is asked
// once per device rather than after every single login once declined.
function askedKey(namespace: "seller" | "admin"): string {
  return `dpm_${namespace}_biometric_asked`;
}

export async function hasBeenAskedAboutBiometric(namespace: "seller" | "admin"): Promise<boolean> {
  return Boolean(await SecureStore.getItemAsync(askedKey(namespace)));
}

export async function markAskedAboutBiometric(namespace: "seller" | "admin"): Promise<void> {
  await SecureStore.setItemAsync(askedKey(namespace), "1");
}

/**
 * True only right after a real login, when the device actually has
 * working biometric hardware, nothing is enrolled yet, and this device
 * hasn't already been asked (and presumably declined) before — the single
 * gate every login screen checks before ever offering the enable-Face-ID step.
 */
export async function shouldOfferBiometricSetup(namespace: "seller" | "admin"): Promise<boolean> {
  const [hardwareOk, alreadyEnrolled, alreadyAsked] = await Promise.all([
    isBiometricHardwareAvailable(),
    getBiometricCredential(namespace).then(Boolean),
    hasBeenAskedAboutBiometric(namespace),
  ]);
  return hardwareOk && !alreadyEnrolled && !alreadyAsked;
}
