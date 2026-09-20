import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
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
import VideoManager from "@/components/marketplace/VideoManager";
import { lookupVin, VehicleImage, VinRecall } from "@/lib/api";
import {
  createListing,
  getMarketplaceCloudinarySignature,
  ListingVideo,
  TitleStatus,
} from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { consumePendingScannedVin } from "@/lib/scanVinBridge";

const TITLE_STATUSES: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "salvage", label: "Salvage" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "title_pending", label: "Title Pending" },
  { value: "unknown", label: "Unknown" },
];

type DecodedSpecs = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyClass: string;
};

const emptySpecs: DecodedSpecs = {
  vin: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  engine: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  bodyClass: "",
};

export default function CreateListingScreen() {
  const [checking, setChecking] = useState(true);
  const [vinInput, setVinInput] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [specs, setSpecs] = useState<DecodedSpecs>(emptySpecs);
  const [decodedNote, setDecodedNote] = useState<string | null>(null);
  const [recalls, setRecalls] = useState<VinRecall[]>([]);
  const [recallsError, setRecallsError] = useState<string | null>(null);

  const [mileage, setMileage] = useState("");
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("unknown");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"phone" | "email" | "either">("either");
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [video, setVideo] = useState<ListingVideo | null>(null);
  const [isTest, setIsTest] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifySellerSession().then((seller) => {
      if (!seller) {
        router.replace("/sell/login");
        return;
      }
      setContactName(seller.name || "");
      setContactPhone(seller.phone || "");
      setContactEmail(seller.email || "");
      setChecking(false);
    });
  }, []);

  // Picks up a VIN the seller just confirmed on the scan screen and decodes
  // it immediately — the scan screen already had them confirm/correct it,
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
    const value = (overrideVin ?? vinInput).replace(/[^a-z0-9]/gi, "").toUpperCase();
    setError(null);
    setDecodedNote(null);

    if (value.length !== 17) {
      setError("Enter a valid 17-character VIN.");
      return;
    }

    if (overrideVin) setVinInput(value);

    setVinLoading(true);
    try {
      const result = await lookupVin(value);
      setSpecs({
        vin: result.vin,
        year: result.year,
        make: result.make,
        model: result.model,
        trim: result.trim,
        engine: result.engine,
        transmission: result.transmission,
        drivetrain: result.drivetrain,
        fuelType: result.fuel,
        bodyClass: result.body,
      });
      setRecalls(result.recalls);
      setRecallsError(result.recallsAvailable ? result.recallsError : null);
      setDecodedNote(
        result.hasData
          ? "VIN decoded. Only factory build data was filled in — you still need to enter mileage and title status yourself."
          : "NHTSA has no factory data for this VIN. You can still list the vehicle — fill in the fields manually."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "VIN lookup failed.");
    } finally {
      setVinLoading(false);
    }
  }

  async function handleSaveDraft() {
    setError(null);

    const mileageNum = Number(mileage);
    const priceNum = Number(price);

    if (!mileage.trim()) {
      setError("Enter the vehicle's mileage.");
      return;
    }
    if (!Number.isFinite(mileageNum) || mileageNum < 0) {
      setError("Mileage must be a valid number.");
      return;
    }
    if (!price.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Enter a valid asking price.");
      return;
    }
    if (images.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setError("Enter a phone number or email so buyers can contact you.");
      return;
    }

    setSaving(true);
    try {
      const listing = await createListing({
        vin: specs.vin,
        year: Number(specs.year) || 0,
        make: specs.make,
        model: specs.model,
        trim: specs.trim,
        engine: specs.engine,
        transmission: specs.transmission,
        drivetrain: specs.drivetrain,
        fuelType: specs.fuelType,
        bodyClass: specs.bodyClass,
        mileage: mileageNum,
        titleStatus,
        price: priceNum,
        description: description.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactPreference,
        images,
        video,
        isTest,
      });
      router.replace(`/sell/listing/${listing._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your listing.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Decode by VIN</Text>
          <Text style={styles.cardSubtitle}>
            Optional, but recommended — this only fills in verified factory data (year, make,
            model, trim, engine, fuel, body style, transmission, drivetrain). It never fills in
            mileage, title status, or history.
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push("/sell/scan-vin")}
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
              value={vinInput}
              onChangeText={(v) => setVinInput(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
            />
            <TouchableOpacity style={[styles.smallButton, vinLoading && styles.buttonDisabled]} onPress={() => handleDecode()} disabled={vinLoading}>
              {vinLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Decode</Text>}
            </TouchableOpacity>
          </View>
          {decodedNote ? <Text style={styles.note}>{decodedNote}</Text> : null}

          {specs.make || specs.model ? (
            <View style={styles.specsGrid}>
              <Text style={styles.specsLine}>
                {[specs.year, specs.make, specs.model, specs.trim].filter(Boolean).join(" ")}
              </Text>
              <Text style={styles.specsLineSmall}>
                {[specs.engine, specs.transmission, specs.drivetrain, specs.fuelType, specs.bodyClass]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>

              <Text style={styles.recallsHeading}>Open NHTSA safety recalls</Text>
              {recallsError ? (
                <Text style={styles.recallsEmpty}>{recallsError}</Text>
              ) : recalls.length === 0 ? (
                <Text style={styles.recallsEmpty}>None on record for this year, make, and model.</Text>
              ) : (
                recalls.map((recall, i) => (
                  <View key={recall.campaignNumber || i} style={styles.recallItem}>
                    <Text style={styles.recallComponent}>{recall.component || "Safety recall"}</Text>
                    {recall.summary ? <Text style={styles.recallSummary}>{recall.summary}</Text> : null}
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mileage &amp; title status</Text>
          <TextInput
            style={styles.input}
            placeholder="Mileage (required)"
            placeholderTextColor="#9ca3af"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
          />
          <Text style={styles.fieldLabel}>Title status</Text>
          <View style={styles.pillRow}>
            {TITLE_STATUSES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pill, titleStatus === option.value && styles.pillSelected]}
                onPress={() => setTitleStatus(option.value)}
              >
                <Text style={[styles.pillText, titleStatus === option.value && styles.pillTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price &amp; description</Text>
          <TextInput
            style={styles.input}
            placeholder="Asking price"
            placeholderTextColor="#9ca3af"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Description (optional)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact preferences</Text>
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#9ca3af" value={contactName} onChangeText={setContactName} />
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#9ca3af" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.fieldLabel}>Buyers should contact you by</Text>
          <View style={styles.pillRow}>
            {(["phone", "email", "either"] as const).map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[styles.pill, contactPreference === pref && styles.pillSelected]}
                onPress={() => setContactPreference(pref)}
              >
                <Text style={[styles.pillText, contactPreference === pref && styles.pillTextSelected]}>
                  {pref === "either" ? "Either" : pref === "phone" ? "Phone" : "Email"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <PhotoManager images={images} onChange={setImages} getSignature={() => getMarketplaceCloudinarySignature("image")} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video</Text>
          <VideoManager video={video} onChange={setVideo} />
        </View>

        <TouchableOpacity style={styles.testToggle} onPress={() => setIsTest((v) => !v)}>
          <View style={[styles.checkbox, isTest && styles.checkboxChecked]}>
            {isTest ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.testToggleText}>Mark this as a test listing</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.primaryButton, saving && styles.buttonDisabled]} onPress={handleSaveDraft} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}
        </TouchableOpacity>
        <Text style={styles.footnote}>
          Saving creates a draft. You&apos;ll pay the $49 listing fee and submit it for review on
          the next screen.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  cardSubtitle: { color: "#6b7280", fontSize: 12, lineHeight: 17, marginTop: 5, marginBottom: 12 },
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
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827", marginBottom: 10, backgroundColor: "#fff" },
  messageInput: { minHeight: 84, textAlignVertical: "top" },
  smallButton: { backgroundColor: "#111827", borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", minWidth: 82 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  note: { color: "#1d4ed8", fontSize: 12, marginTop: 10 },
  specsGrid: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  specsLine: { color: "#111827", fontWeight: "800", fontSize: 14 },
  specsLineSmall: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  recallsHeading: { color: "#374151", fontSize: 11, fontWeight: "800", marginTop: 12, textTransform: "uppercase" },
  recallsEmpty: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  recallItem: { marginTop: 8 },
  recallComponent: { color: "#991b1b", fontWeight: "800", fontSize: 12 },
  recallSummary: { color: "#6b7280", fontSize: 11, lineHeight: 16, marginTop: 2 },
  fieldLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginBottom: 8 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  pillTextSelected: { color: "#fff" },
  testToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#9ca3af", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#111827", borderColor: "#111827" },
  checkboxMark: { color: "#fff", fontSize: 12, fontWeight: "900" },
  testToggleText: { color: "#374151", fontSize: 13, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  primaryButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  footnote: { color: "#9ca3af", fontSize: 11, textAlign: "center", marginTop: 10, lineHeight: 16 },
});
