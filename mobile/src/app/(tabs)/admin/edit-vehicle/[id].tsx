import { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PhotoManager from "@/components/shared/PhotoManager";
import VehicleFieldsForm, {
  emptyVehicleForm,
  TitleStatus,
  VehicleFormState,
} from "@/components/admin/VehicleFieldsForm";
import VehicleHistoryReportEditor, { AdminVehicleHistoryReport } from "@/components/admin/VehicleHistoryReportEditor";
import {
  AdminVehicle,
  deleteAdminCar,
  fetchAdminCar,
  updateAdminCar,
  VehicleImage,
} from "@/lib/api";
import { vehicleTitle } from "@/lib/format";

function toFormState(car: AdminVehicle): VehicleFormState {
  return {
    year: String(car.year || ""),
    make: car.make || "",
    model: car.model || "",
    trim: car.trim || "",
    engine: car.engine || "",
    fuel: car.fuelType || "",
    bodyStyle: car.bodyClass || "",
    transmission: car.transmission || "",
    drivetrain: car.drivetrain || "",
    price: String(car.price ?? ""),
    mileage: String(car.mileage ?? ""),
    titleStatus: ((car.titleStatus as TitleStatus) || "unknown") as TitleStatus,
    phone: car.phone || "",
    description: car.description || "",
    status: (car.status as VehicleFormState["status"]) || "available",
  };
}

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [vin, setVin] = useState("");
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [vehicleHistoryReport, setVehicleHistoryReport] = useState<AdminVehicleHistoryReport>(null);
  const [saving, setSaving] = useState(false);
  const [reportSaving, setReportSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);

    try {
      const car = await fetchAdminCar(id);
      setVin(car.vin || "");
      setForm(toFormState(car));
      setImages(car.images || []);
      setVehicleHistoryReport((car as any).vehicleHistoryReport || null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Could not load this vehicle."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(patch: Partial<VehicleFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    if (!id) return;
    setError(null);
    setMessage(null);

    const year = Number(form.year);
    const price = Number(form.price || 0);
    const mileage = Number(form.mileage || 0);

    if (!year || !form.make.trim() || !form.model.trim()) {
      setError("Year, make, and model are required.");
      return;
    }
    if (!form.mileage.trim()) {
      setError("Enter the vehicle's mileage.");
      return;
    }
    if (!Number.isFinite(price) || !Number.isFinite(mileage) || mileage < 0) {
      setError("Price and mileage must be valid numbers.");
      return;
    }

    setSaving(true);
    try {
      await updateAdminCar(id, {
        title: [form.year, form.make, form.model, form.trim]
          .filter(Boolean)
          .join(" "),
        year,
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim(),
        price,
        mileage,
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
      });
      setMessage("Changes saved to the live inventory.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReport(input: { url: string; source: "carfax" | "other"; reportDate?: string; approved: boolean }) {
    if (!id) return;
    setError(null);
    setReportSaving(true);
    try {
      await updateAdminCar(id, { vehicleHistoryReport: input });
      setVehicleHistoryReport({ url: input.url, source: input.source, reportDate: input.reportDate || null, approved: input.approved });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the vehicle history report.");
    } finally {
      setReportSaving(false);
    }
  }

  async function handleRemoveReport() {
    if (!id) return;
    setError(null);
    setReportSaving(true);
    try {
      await updateAdminCar(id, { vehicleHistoryReport: { url: "", source: "other", approved: true } });
      setVehicleHistoryReport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the report.");
    } finally {
      setReportSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete vehicle",
      `Permanently delete ${vehicleTitle({
        year: Number(form.year) || 0,
        make: form.make,
        model: form.model,
        trim: form.trim,
      })} from the live inventory? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    setError(null);

    try {
      await deleteAdminCar(id);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete vehicle.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this vehicle</Text>
        <Text style={styles.centeredText}>{loadError}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={load}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {vin ? <Text style={styles.vinLine}>VIN {vin}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle details</Text>
          <VehicleFieldsForm value={form} onChange={setField} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <PhotoManager images={images} onChange={setImages} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle History Report</Text>
          <VehicleHistoryReportEditor
            report={vehicleHistoryReport}
            onSave={handleSaveReport}
            onRemove={handleRemoveReport}
            busy={reportSaving}
          />
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
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {form.status === "available" || form.status === "pending" ? (
          <TouchableOpacity
            style={styles.marketingButton}
            onPress={() => router.push(`/marketing/car/${id}`)}
            accessibilityRole="button"
          >
            <Text style={styles.marketingButtonText}>📣 Marketing Center</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 28,
  },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  vinLine: { color: "#6b7280", fontSize: 12, fontWeight: "700", marginBottom: 14, letterSpacing: 1 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 12 },
  success: { color: "#15803d", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  deleteButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 14 },
  marketingButton: { borderWidth: 1.5, borderColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  marketingButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
});
