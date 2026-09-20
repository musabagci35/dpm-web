import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
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
import VehicleHistoryReportButton from "@/components/shared/VehicleHistoryReportButton";
import { VehicleImage } from "@/lib/api";
import {
  deleteListing,
  fetchListing,
  getMarketplaceCloudinarySignature,
  ListingVideo,
  MyListing,
  startFeaturedCheckout,
  startListingCheckout,
  TitleStatus,
  updateListing,
} from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

const TITLE_STATUSES: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "salvage", label: "Salvage" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "title_pending", label: "Title Pending" },
  { value: "unknown", label: "Unknown" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  payment_pending: "Payment Pending",
  pending_review: "Pending Admin Review",
  live: "Live",
  rejected: "Rejected",
  sold: "Sold",
  expired: "Expired",
};

export default function SellerListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [checking, setChecking] = useState(true);
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mileage, setMileage] = useState("");
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("unknown");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"phone" | "email" | "either">("either");
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [video, setVideo] = useState<ListingVideo | null>(null);
  const [reportUrl, setReportUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = (await fetchListing(id)) as MyListing;
      setListing(data);
      setMileage(String(data.mileage ?? ""));
      setTitleStatus(data.titleStatus);
      setPrice(String(data.price ?? ""));
      setDescription(data.description || "");
      setContactPhone(data.contactPhone || "");
      setContactEmail(data.contactEmail || "");
      setContactPreference(data.contactPreference || "either");
      setImages(data.images || []);
      setVideo(data.video || null);
      setReportUrl(data.vehicleHistoryReport?.url || "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load this listing.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const seller = await verifySellerSession();
        if (cancelled) return;
        if (!seller) {
          router.replace("/sell/login");
          return;
        }
        setChecking(true);
        setLoadError(null);
        await load();
        if (!cancelled) setChecking(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  async function handleSave() {
    if (!id || !listing) return;
    setError(null);
    setMessage(null);

    const mileageNum = Number(mileage);
    const priceNum = Number(price);
    if (!mileage.trim() || !Number.isFinite(mileageNum) || mileageNum < 0) {
      setError("Enter a valid mileage.");
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

    setSaving(true);
    try {
      const updated = await updateListing(id, {
        mileage: mileageNum,
        titleStatus,
        price: priceNum,
        description: description.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactPreference,
        images,
        video,
        vehicleHistoryReportUrl: reportUrl.trim(),
      });
      setListing(updated);
      setMessage("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitAndPay() {
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await handleSave();
      const url = await startListingCheckout(id);
      const result = await WebBrowser.openAuthSessionAsync(url, "driveprimemotors://marketplace/checkout-result");
      if (result.type === "success") {
        await load();
      } else {
        // Cancelled or dismissed — refresh anyway so state reflects reality
        // (e.g. status may already have moved to payment_pending).
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFeature() {
    if (!id) return;
    setError(null);
    setFeaturing(true);
    try {
      const url = await startFeaturedCheckout(id);
      await WebBrowser.openAuthSessionAsync(url, "driveprimemotors://marketplace/checkout-result");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setFeaturing(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete draft", "Delete this draft listing? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteListing(id);
      router.replace("/sell/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this listing.");
      setDeleting(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (loadError || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this listing</Text>
        <Text style={styles.centeredText}>{loadError}</Text>
      </View>
    );
  }

  const editable = listing.status === "draft" || listing.status === "rejected";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{STATUS_LABELS[listing.status] || listing.status}</Text>
          <Text style={styles.statusTitle}>{vehicleTitle(listing)}</Text>
          <Text style={styles.statusMeta}>
            {formatMileage(listing.mileage)} · {formatPrice(listing.price)}
          </Text>
          {listing.isTest ? <Text style={styles.testBadge}>TEST LISTING</Text> : null}

          {listing.status === "rejected" && listing.rejectionReason ? (
            <Text style={styles.rejectionText}>Admin feedback: {listing.rejectionReason}</Text>
          ) : null}
          {listing.status === "payment_pending" ? (
            <Text style={styles.statusHint}>
              Waiting on payment confirmation. If you already paid, pull down to refresh.
            </Text>
          ) : null}
          {listing.status === "pending_review" ? (
            <Text style={styles.statusHint}>
              Payment received — your listing is awaiting admin review before it goes live.
            </Text>
          ) : null}
          {listing.status === "live" ? (
            <Text style={styles.statusHint}>
              Live until {listing.listingExpiresAt ? new Date(listing.listingExpiresAt).toLocaleDateString() : "—"}.
            </Text>
          ) : null}
        </View>

        {editable ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mileage &amp; title status</Text>
              <TextInput style={styles.input} placeholder="Mileage" value={mileage} onChangeText={setMileage} keyboardType="number-pad" placeholderTextColor="#9ca3af" />
              <View style={styles.pillRow}>
                {TITLE_STATUSES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pill, titleStatus === option.value && styles.pillSelected]}
                    onPress={() => setTitleStatus(option.value)}
                  >
                    <Text style={[styles.pillText, titleStatus === option.value && styles.pillTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Price &amp; description</Text>
              <TextInput style={styles.input} placeholder="Asking price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholderTextColor="#9ca3af" />
              <TextInput style={[styles.input, styles.messageInput]} placeholder="Description" value={description} onChangeText={setDescription} multiline placeholderTextColor="#9ca3af" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact preferences</Text>
              <TextInput style={styles.input} placeholder="Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholderTextColor="#9ca3af" />
              <TextInput style={styles.input} placeholder="Email" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#9ca3af" />
              <View style={styles.pillRow}>
                {(["phone", "email", "either"] as const).map((pref) => (
                  <TouchableOpacity key={pref} style={[styles.pill, contactPreference === pref && styles.pillSelected]} onPress={() => setContactPreference(pref)}>
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

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vehicle history report (optional)</Text>
              <Text style={styles.reportHint}>
                Have a CARFAX or similar report? Paste the link — an admin will review and approve
                it before it&apos;s shown to buyers.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={reportUrl}
                onChangeText={setReportUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
              />
              {listing.vehicleHistoryReport?.url && !(listing as any).vehicleHistoryReport?.approved ? (
                <Text style={styles.reportPending}>Awaiting admin approval.</Text>
              ) : null}
            </View>

            {message && <Text style={styles.success}>{message}</Text>}
            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={[styles.secondaryButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#111827" /> : <Text style={styles.secondaryButtonText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={handleSubmitAndPay} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit &amp; Pay $49</Text>}
            </TouchableOpacity>

            {listing.status === "draft" ? (
              <TouchableOpacity style={[styles.deleteButton, deleting && styles.buttonDisabled]} onPress={confirmDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#b91c1c" /> : <Text style={styles.deleteButtonText}>Delete Draft</Text>}
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <>
            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vehicle History Report</Text>
              <VehicleHistoryReportButton
                report={listing.vehicleHistoryReport}
                onRequestReport={() => Alert.alert("Contact us", "Reach out to Drive Prime Motors to request a report.")}
              />
            </View>

            {listing.status === "live" && !listing.featured ? (
              <TouchableOpacity style={[styles.primaryButton, featuring && styles.buttonDisabled]} onPress={handleFeature} disabled={featuring}>
                {featuring ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Feature This Listing — $99</Text>}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.secondaryButton} onPress={() => load()}>
              <Text style={styles.secondaryButtonText}>Refresh Status</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 16, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 13, marginTop: 8, textAlign: "center" },

  statusCard: { backgroundColor: "#111827", borderRadius: 16, padding: 18, marginBottom: 16 },
  statusLabel: { color: "#fca5a5", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  statusTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 6 },
  statusMeta: { color: "#d1d5db", fontSize: 13, marginTop: 4 },
  statusHint: { color: "#d1d5db", fontSize: 12, marginTop: 10, lineHeight: 17 },
  testBadge: { color: "#fbbf24", fontWeight: "900", fontSize: 11, marginTop: 8 },
  rejectionText: { color: "#fca5a5", fontSize: 12, marginTop: 10, fontWeight: "600" },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#111827", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827", marginBottom: 10, backgroundColor: "#fff" },
  messageInput: { minHeight: 84, textAlignVertical: "top" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  pillTextSelected: { color: "#fff" },
  reportHint: { color: "#6b7280", fontSize: 12, lineHeight: 17, marginBottom: 10 },
  reportPending: { color: "#b45309", fontSize: 12, fontWeight: "700", marginTop: 6 },

  success: { color: "#15803d", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  primaryButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  secondaryButton: { borderWidth: 1, borderColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  secondaryButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  deleteButton: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  deleteButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 14 },
});
