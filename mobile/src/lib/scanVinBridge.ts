/**
 * expo-router has no built-in "return a value to the screen that pushed me"
 * mechanism, so the VIN scan screen hands its confirmed result back through
 * this tiny module-level slot. The form screen reads and clears it in a
 * useFocusEffect when it regains focus after router.back().
 */
let pendingScannedVin: string | null = null;

export function setPendingScannedVin(vin: string) {
  pendingScannedVin = vin;
}

export function consumePendingScannedVin(): string | null {
  const value = pendingScannedVin;
  pendingScannedVin = null;
  return value;
}
