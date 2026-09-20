import { useEffect, useState } from "react";
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
import VideoManager from "@/components/marketplace/VideoManager";
import { lookupVin, VehicleImage, VinRecall } from "@/lib/api";
import { createAuction } from "@/lib/auctionApi";
import { getMarketplaceCloudinarySignature, ListingVideo, TitleStatus } from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";

const TITLE_STATUSES: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "salvage", label: "Salvage" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "title_pending", label: "Title Pending" },
  { value: "unknown", label: "Unknown" },
];

const DURATIONS: { value: number; label: string }[] = [
  { value: 24, label: "1 day" },
  { value: 72, label: "3 days" },
  { value: 120, label: "5 days" },
  { value: 168, label: "7 days" },
  { value: 240, label: "10 days" },
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

export default function CreateAuctionScreen() {
  const [checking, setChecking] = useState(true);
  const [vinInput, setVinInput] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [specs, setSpecs] = useState<DecodedSpecs>(emptySpecs);
  const [decodedNote, setDecodedNote] = useState<string | null>(null);
  const [recalls, setRecalls] = useState<VinRecall[]>([]);
  const [recallsError, setRecallsError] = useState<string | null>(null);

  const [mileage, setMileage] = useState("");
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("unknown");
  const [startingBid, setStartingBid] = useState("");
  const [hasReserve, setHasReserve] = useState(false);
  const [reservePrice, setReservePrice] = useState("");
  const [bidIncrement, setBidIncrement] = useState("100");
  const [hasBuyItNow, setHasBuyItNow] = useState(false);
  const [buyItNowPrice, setBuyItNowPrice] = useState("");
  const [durationHours, setDurationHours] = useState(168);
  const [description, setDescription] = useState("");
  const [disclosures, setDisclosures] = useState("");
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

  async function handleDecode() {
    const value = vinInput.replace(/[^a-z0-9]/gi, "").toUpperCase();
    setError(null);
    setDecodedNote(null);

    if (value.length !== 17) {
      setError("Enter a valid 17-character VIN.");
      return;
    }

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
          : "NHTSA has no factory data for this VIN. You can still create the auction — fill in the fields manually."
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
    const startingBidNum = Number(startingBid);
    const bidIncrementNum = Number(bidIncrement);
    const reserveNum = hasReserve ? Number(reservePrice) : null;
    const buyItNowNum = hasBuyItNow ? Number(buyItNowPrice) : null;

    if (!mileage.trim()) {
      setError("Enter the vehicle's mileage.");
      return;
    }
    if (!Number.isFinite(mileageNum) || mileageNum < 0) {
      setError("Mileage must be a valid number.");
      return;
    }
    if (!startingBid.trim() || !Number.isFinite(startingBidNum) || startingBidNum <= 0) {
      setError("Enter a valid starting bid.");
      return;
    }
    if (!Number.isFinite(bidIncrementNum) || bidIncrementNum <= 0) {
      setError("Enter a valid bid increment.");
      return;
    }
    if (hasReserve && (!reserveNum || reserveNum <= startingBidNum)) {
      setError("Reserve price must be greater than the starting bid.");
      return;
    }
    if (hasBuyItNow && (!buyItNowNum || buyItNowNum <= startingBidNum)) {
      setError("Buy It Now price must be greater than the starting bid.");
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
      const auction = await createAuction({
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
        description: description.trim(),
        disclosures: disclosures.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactPreference,
        images,
        video,
        startingBid: startingBidNum,
        reservePrice: reserveNum,
        bidIncrement: bidIncrementNum,
        buyItNowPrice: buyItNowNum,
        durationHours,
        isTest,
      });
      router.replace(`/sell/auction/${auction._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your auction.");
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
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="17-character VIN"
              placeholderTextColor="#9ca3af"
              value={vinInput}
              onChangeText={(v) => setVinInput(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity style={[styles.smallButton, vinLoading && styles.buttonDisabled]} onPress={handleDecode} disabled={vinLoading}>
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
          <Text style={styles.cardTitle}>Auction terms</Text>

          <Text style={styles.fieldLabel}>Starting bid</Text>
          <TextInput
            style={styles.input}
            placeholder="Starting bid ($)"
            placeholderTextColor="#9ca3af"
            value={startingBid}
            onChangeText={setStartingBid}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>Bid increment</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum increase per bid ($)"
            placeholderTextColor="#9ca3af"
            value={bidIncrement}
            onChangeText={setBidIncrement}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setHasReserve((v) => !v)}>
            <View style={[styles.checkbox, hasReserve && styles.checkboxChecked]}>
              {hasReserve ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Set a reserve price (minimum you'll accept)</Text>
          </TouchableOpacity>
          {hasReserve ? (
            <TextInput
              style={styles.input}
              placeholder="Reserve price ($)"
              placeholderTextColor="#9ca3af"
              value={reservePrice}
              onChangeText={setReservePrice}
              keyboardType="decimal-pad"
            />
          ) : (
            <Text style={styles.helperText}>No reserve — this auction will sell to the highest bidder.</Text>
          )}

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setHasBuyItNow((v) => !v)}>
            <View style={[styles.checkbox, hasBuyItNow && styles.checkboxChecked]}>
              {hasBuyItNow ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Add a Buy It Now price (optional)</Text>
          </TouchableOpacity>
          {hasBuyItNow ? (
            <TextInput
              style={styles.input}
              placeholder="Buy It Now price ($)"
              placeholderTextColor="#9ca3af"
              value={buyItNowPrice}
              onChangeText={setBuyItNowPrice}
              keyboardType="decimal-pad"
            />
          ) : null}

          <Text style={styles.fieldLabel}>Auction duration</Text>
          <View style={styles.pillRow}>
            {DURATIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pill, durationHours === option.value && styles.pillSelected]}
                onPress={() => setDurationHours(option.value)}
              >
                <Text style={[styles.pillText, durationHours === option.value && styles.pillTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description &amp; disclosures</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Description (optional)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Disclosures — known issues, accidents, modifications (optional)"
            placeholderTextColor="#9ca3af"
            value={disclosures}
            onChangeText={setDisclosures}
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
          <Text style={styles.testToggleText}>Mark this as a test auction</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.primaryButton, saving && styles.buttonDisabled]} onPress={handleSaveDraft} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Draft</Text>}
        </TouchableOpacity>
        <Text style={styles.footnote}>
          Saving creates a draft. You&apos;ll submit it for review on the next screen — no payment
          is required to start an auction.
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
  fieldLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  pill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  pillTextSelected: { color: "#fff" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 8 },
  checkboxLabel: { color: "#374151", fontSize: 13, fontWeight: "600", flex: 1 },
  helperText: { color: "#9ca3af", fontSize: 11, marginBottom: 8 },
  testToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "#9ca3af", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#111827", borderColor: "#111827" },
  checkboxMark: { color: "#fff", fontSize: 12, fontWeight: "900" },
  testToggleText: { color: "#374151", fontSize: 13, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  primaryButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  footnote: { color: "#9ca3af", fontSize: 11, textAlign: "center", marginTop: 10, lineHeight: 16 },
});
