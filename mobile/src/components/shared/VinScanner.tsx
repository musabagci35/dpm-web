import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { isVinLike, normalizeVin, scanVinFromPhoto } from "@/lib/api";

type Phase = "camera" | "scanning" | "confirm";

/**
 * Camera VIN scanner shared by the public Sell flow and Admin → Add
 * Vehicle. It only ever reads and returns a 17-character VIN string for
 * the caller to confirm — decoding, populating form fields, and saving
 * anything all happen elsewhere, through the same manual VIN decode path
 * used everywhere else in the app.
 */
export default function VinScanner({
  onConfirmed,
  onCancel,
}: {
  /** Called once the user has confirmed (or corrected) the detected VIN. */
  onConfirmed: (vin: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>("camera");
  const [candidateVin, setCandidateVin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) {
        setError("Could not capture a photo. Please try again.");
        return;
      }

      setPhase("scanning");
      const vin = await scanVinFromPhoto(photo.base64);
      setCandidateVin(vin);
      setPhase("confirm");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read VIN — try again or enter it manually."
      );
      setPhase("camera");
    }
  }

  function handleRetake() {
    setCandidateVin("");
    setError(null);
    setPhase("camera");
  }

  function handleConfirm() {
    const clean = normalizeVin(candidateVin);
    if (!isVinLike(clean)) {
      setError("That's not a valid 17-character VIN. Correct it or retake the photo.");
      return;
    }
    onConfirmed(clean);
  }

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionHeading}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Drive Prime Motors needs camera access to scan a VIN from a vehicle or title document.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelLink} onPress={onCancel}>
          <Text style={styles.cancelLinkText}>Enter VIN manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "confirm") {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.confirmContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.confirmHeading}>Confirm the VIN</Text>
          <Text style={styles.confirmSubtext}>
            Check every character carefully — correct any mistakes before continuing.
          </Text>

          <TextInput
            style={styles.confirmInput}
            value={candidateVin}
            onChangeText={(v) => setCandidateVin(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={17}
          />
          <Text style={styles.confirmCount}>{candidateVin.length} / 17 characters</Text>

          {error ? <Text style={styles.confirmError}>{error}</Text> : null}

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm &amp; Decode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onCancel}>
            <Text style={styles.cancelLinkText}>Cancel — enter VIN manually</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.flex} facing="back" />

      <View pointerEvents="none" style={styles.overlay}>
        <Text style={styles.instructions}>
          Align the VIN inside the frame{"\n"}(windshield, door jamb, or title document)
        </Text>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {phase === "scanning" ? (
        <View style={styles.scanningOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.scanningText}>Reading VIN…</Text>
        </View>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <View style={styles.controlsSpacer} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, backgroundColor: "#111827" },

  permissionHeading: { color: "#fff", fontSize: 20, fontWeight: "900", textAlign: "center", marginTop: 200, paddingHorizontal: 28 },
  permissionText: { color: "#d1d5db", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 12, paddingHorizontal: 28 },
  permissionButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, marginHorizontal: 28, alignItems: "center", marginTop: 24 },
  permissionButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  instructions: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 24, paddingHorizontal: 20, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  frame: { width: "85%", height: 110, position: "relative" },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#fff", borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  errorBanner: { position: "absolute", top: Platform.OS === "ios" ? 60 : 20, left: 16, right: 16, backgroundColor: "rgba(185,28,28,0.9)", borderRadius: 10, padding: 12 },
  errorBannerText: { color: "#fff", fontSize: 13, fontWeight: "700", textAlign: "center" },

  scanningOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.75)", paddingVertical: 40, alignItems: "center", gap: 10 },
  scanningText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  controls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30, paddingBottom: 46, paddingTop: 16 },
  controlsSpacer: { width: 70 },
  cancelButton: { width: 70, alignItems: "flex-start" },
  cancelButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  captureButton: { width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },

  confirmContainer: {
    flexGrow: 1,
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  confirmHeading: { color: "#fff", fontSize: 22, fontWeight: "900" },
  confirmSubtext: { color: "#d1d5db", fontSize: 13, lineHeight: 19, marginTop: 8 },
  confirmInput: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 20, fontWeight: "800", letterSpacing: 2, color: "#111827", marginTop: 24, textAlign: "center" },
  confirmCount: { color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 8 },
  confirmError: { color: "#fca5a5", fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 14 },
  confirmButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 28 },
  confirmButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  retakeButton: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  retakeButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cancelLink: { alignItems: "center", marginTop: 20 },
  cancelLinkText: { color: "#9ca3af", fontWeight: "700", fontSize: 13 },
});
