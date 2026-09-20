import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
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

import PhotoManager from "@/components/admin/PhotoManager";
import VehicleFieldsForm, {
  emptyVehicleForm,
  VehicleFormState,
} from "@/components/admin/VehicleFieldsForm";
import { createAdminCar, getCloudinarySignature, lookupVin, VehicleImage, VinLookupResult } from "@/lib/api";
import { consumePendingScannedVin } from "@/lib/scanVinBridge";
import { uploadDocumentToCloudinary } from "@/lib/upload";

const REPORT_FOLDER = "drive-prime-motors/vehicle-history-reports";

export default function AddVehicleScreen() {
  const [vin, setVin] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinLookup, setVinLookup] = useState<VinLookupResult | null>(null);
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [reportUrl, setReportUrl] = useState("");
  const [reportSource, setReportSource] = useState<"carfax" | "other">("carfax");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(patch: Partial<VehicleFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handlePickReportPdf() {
    setUploadError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploadingPdf(true);
      const signature = await getCloudinarySignature(REPORT_FOLDER, "raw");
      const uploaded = await uploadDocumentToCloudinary({
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType || "application/pdf",
      }, signature);
      setReportUrl(uploaded.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload that PDF.");
    } finally {
      setUploadingPdf(false);
    }
  }

  // Picks up a VIN just confirmed on the shared scan screen and decodes it
  // immediately — the scan screen already had the admin confirm/correct it,
  // so no second confirmation step is needed here.
  useFocusEffect(
    useCallback(() => {
      const scanned = consumePendingScannedVin();
      if (scanned) {
        handleDecode(scanned);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  async function handleDecode(overrideVin?: string) {
    const value = (overrideVin ?? vin).replace(/[^a-z0-9]/gi, "").toUpperCase();
    setError(null);
    setMessage(null);

    if (value.length !== 17) {
      setError("Enter a valid 17-character VIN.");
      return;
    }

    if (overrideVin) setVin(value);

    setVinLoading(true);
    try {
      const result = await lookupVin(value);
      setVinLookup(result);
      setVin(result.vin);
      setForm((current) => ({
        ...current,
        year: result.year || current.year,
        make: result.make || current.make,
        model: result.model || current.model,
        trim: result.trim || current.trim,
        engine: result.engine || current.engine,
        fuel: result.fuel || current.fuel,
        bodyStyle: result.body || current.bodyStyle,
        transmission: result.transmission || current.transmission,
        drivetrain: result.drivetrain || current.drivetrain,
      }));
      setMessage(
        result.foundInInventory
          ? "This VIN is already in current inventory."
          : "VIN decoded. Review the fields below, then save."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "VIN lookup failed.");
    } finally {
      setVinLoading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setMessage(null);

    const year = Number(form.year);
    const price = Number(form.price || 0);
    const mileage = Number(form.mileage || 0);
    const cleanVin = vin.replace(/[^a-z0-9]/gi, "").toUpperCase();

    if (!year || !form.make.trim() || !form.model.trim()) {
      setError("Year, make, and model are required.");
      return;
    }
    if (cleanVin && (cleanVin.length !== 17 || /[IOQ]/.test(cleanVin))) {
      setError("VIN must contain 17 valid characters.");
      return;
    }
    if (!form.mileage.trim()) {
      // Mileage is never decoded from the VIN — it must always be entered
      // by hand, since NHTSA has no odometer data for any vehicle.
      setError("Enter the vehicle's mileage.");
      return;
    }
    if (!Number.isFinite(price) || !Number.isFinite(mileage) || mileage < 0) {
      setError("Price and mileage must be valid numbers.");
      return;
    }

    setSaving(true);
    try {
      const created = await createAdminCar({
        title: [form.year, form.make, form.model, form.trim]
          .filter(Boolean)
          .join(" "),
        year,
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim(),
        price,
        mileage,
        vin: cleanVin,
        titleStatus: form.titleStatus,
        description: form.description.trim(),
        phone: form.phone.trim(),
        engine: form.engine.trim(),
        fuelType: form.fuel.trim(),
        bodyClass: form.bodyStyle.trim(),
        transmission: form.transmission.trim(),
        drivetrain: form.drivetrain.trim(),
        status: form.status,
        images,
        vehicleHistoryReport: reportUrl.trim()
          ? { url: reportUrl.trim(), source: reportSource, approved: true }
          : undefined,
      });
      setMessage("Vehicle saved to the live inventory.");
      router.replace(`/admin/edit-vehicle/${created._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Decode by VIN</Text>
          <Text style={styles.cardSubtitle}>
            Optional, but recommended — decoding fills in year, make, model, trim
            and specifications automatically.
          </Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push("/admin/scan-vin")}
            accessibilityRole="button"
          >
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan VIN with Camera</Text>
          </TouchableOpacity>
          <Text style={styles.scanHint}>
            Works on a windshield etching, door-jamb sticker, or a printed title document.
          </Text>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR ENTER MANUALLY</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="17-character VIN"
              placeholderTextColor="#9ca3af"
              value={vin}
              onChangeText={(value) => setVin(value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
            />
            <TouchableOpacity
              style={[styles.smallButton, vinLoading && styles.buttonDisabled]}
              onPress={() => handleDecode()}
              disabled={vinLoading}
            >
              {vinLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Decode</Text>
              )}
            </TouchableOpacity>
          </View>

          {vinLookup && (
            <Text style={styles.lookupText}>
              Decoded:{" "}
              {[vinLookup.year, vinLookup.make, vinLookup.model, vinLookup.trim]
                .filter(Boolean)
                .join(" ") || "No vehicle description returned"}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle details</Text>
          <VehicleFieldsForm value={form} onChange={setField} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle History Report (optional)</Text>
          <Text style={styles.cardSubtitle}>
            Only ever a real, verified report — this is never generated or inferred from the VIN.
            Leave blank if none exists yet; the public listing will show "CARFAX report not
            available yet" until one is added.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://... (real CARFAX or history report link)"
            placeholderTextColor="#9ca3af"
            value={reportUrl}
            onChangeText={setReportUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <TouchableOpacity
            style={[styles.uploadButton, (uploadingPdf || saving) && styles.buttonDisabled]}
            onPress={handlePickReportPdf}
            disabled={uploadingPdf || saving}
          >
            {uploadingPdf ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.uploadButtonText}>📄 Upload CARFAX PDF</Text>
            )}
          </TouchableOpacity>
          {uploadError ? <Text style={styles.uploadErrorText}>{uploadError}</Text> : null}
          {reportUrl.trim() ? (
            <Text style={styles.reportAttachedText}>Report attached — will save with this vehicle.</Text>
          ) : null}
          <View style={styles.reportSourceRow}>
            {(["carfax", "other"] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.reportSourcePill, reportSource === option && styles.reportSourcePillSelected]}
                onPress={() => setReportSource(option)}
              >
                <Text style={[styles.reportSourcePillText, reportSource === option && styles.reportSourcePillTextSelected]}>
                  {option === "carfax" ? "CARFAX (verified)" : "Other / Dealer-provided"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <PhotoManager images={images} onChange={setImages} />
        </View>

        {message && <Text style={styles.success}>{message}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Vehicle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 48 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  cardSubtitle: { color: "#6b7280", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 12 },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonIcon: { fontSize: 18 },
  scanButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  scanHint: { color: "#9ca3af", fontSize: 11, textAlign: "center", marginTop: 8 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { color: "#9ca3af", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  inlineRow: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  flexInput: { flex: 1, marginBottom: 0 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  smallButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 82,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  lookupText: { color: "#1d4ed8", fontSize: 12, marginTop: 10 },
  uploadButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingVertical: 11, alignItems: "center", backgroundColor: "#f9fafb" },
  uploadButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  uploadErrorText: { color: "#b91c1c", fontSize: 12, marginTop: 6, fontWeight: "600" },
  reportAttachedText: { color: "#15803d", fontSize: 12, marginTop: 8, fontWeight: "700" },
  reportSourceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  reportSourcePill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 8, paddingHorizontal: 11 },
  reportSourcePillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  reportSourcePillText: { color: "#374151", fontSize: 11, fontWeight: "700" },
  reportSourcePillTextSelected: { color: "#fff" },
  success: { color: "#15803d", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
});
