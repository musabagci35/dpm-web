import { useState } from "react";
import { router } from "expo-router";
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
import { createAdminCar, lookupVin, VehicleImage, VinLookupResult } from "@/lib/api";

export default function AddVehicleScreen() {
  const [vin, setVin] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinLookup, setVinLookup] = useState<VinLookupResult | null>(null);
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(patch: Partial<VehicleFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleDecode() {
    const value = vin.replace(/[^a-z0-9]/gi, "").toUpperCase();
    setError(null);
    setMessage(null);

    if (value.length !== 17) {
      setError("Enter a valid 17-character VIN.");
      return;
    }

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
        carfaxUrl: form.carfaxUrl.trim(),
        engine: form.engine.trim(),
        fuelType: form.fuel.trim(),
        bodyClass: form.bodyStyle.trim(),
        transmission: form.transmission.trim(),
        drivetrain: form.drivetrain.trim(),
        status: form.status,
        images,
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Decode by VIN</Text>
          <Text style={styles.cardSubtitle}>
            Optional, but recommended — decoding fills in year, make, model, trim
            and specifications automatically.
          </Text>

          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="17-character VIN"
              placeholderTextColor="#9ca3af"
              value={vin}
              onChangeText={(value) => setVin(value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.smallButton, vinLoading && styles.buttonDisabled]}
              onPress={handleDecode}
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
  success: { color: "#15803d", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
});
