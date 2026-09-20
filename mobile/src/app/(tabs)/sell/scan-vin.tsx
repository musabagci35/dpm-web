import { router } from "expo-router";

import VinScanner from "@/components/shared/VinScanner";
import { setPendingScannedVin } from "@/lib/scanVinBridge";

export default function SellScanVinScreen() {
  return (
    <VinScanner
      onConfirmed={(vin) => {
        setPendingScannedVin(vin);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
