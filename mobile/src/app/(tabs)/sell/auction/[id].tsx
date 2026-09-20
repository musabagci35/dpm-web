import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import PhotoManager from "@/components/shared/PhotoManager";
import VideoManager from "@/components/marketplace/VideoManager";
import VehicleHistoryReportButton from "@/components/shared/VehicleHistoryReportButton";
import { VehicleImage } from "@/lib/api";
import { deleteAuction, fetchAuction, MyAuction, submitAuction, updateAuction } from "@/lib/auctionApi";
import { getMarketplaceCloudinarySignature, ListingVideo, TitleStatus } from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { formatMileage, formatTimeRemaining, vehicleTitle } from "@/lib/format";

const TITLE_STATUSES: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "salvage", label: "Salvage" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "title_pending", label: "Title Pending" },
  { value: "unknown", label: "Unknown" },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Admin Review",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  sold: "Sold",
  reserve_not_met: "Reserve Not Met",
  cancelled: "Cancelled",
};

export default function SellerAuctionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [checking, setChecking] = useState(true);
  const [auction, setAuction] = useState<MyAuction | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mileage, setMileage] = useState("");
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("unknown");
  const [description, setDescription] = useState("");
  const [disclosures, setDisclosures] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<"phone" | "email" | "either">("either");
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [video, setVideo] = useState<ListingVideo | null>(null);
  const [reportUrl, setReportUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = (await fetchAuction(id)) as MyAuction;
      setAuction(data);
      setMileage(String(data.mileage ?? ""));
      setTitleStatus(data.titleStatus);
      setDescription(data.description || "");
      setDisclosures(data.disclosures || "");
      setContactPhone(data.contactPhone || "");
      setContactEmail(data.contactEmail || "");
      setContactPreference(data.contactPreference || "either");
      setImages(data.images || []);
      setVideo(data.video || null);
      setReportUrl(data.vehicleHistoryReport?.url || "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load this auction.");
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
    if (!id || !auction) return;
    setError(null);
    setMessage(null);

    const mileageNum = Number(mileage);
    if (!mileage.trim() || !Number.isFinite(mileageNum) || mileageNum < 0) {
      setError("Enter a valid mileage.");
      return;
    }
    if (images.length === 0) {
      setError("Add at least one photo.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAuction(id, {
        mileage: mileageNum,
        titleStatus,
        description: description.trim(),
        disclosures: disclosures.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactPreference,
        images,
        video,
        vehicleHistoryReportUrl: reportUrl.trim(),
      });
      setAuction(updated);
      setMessage("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await handleSave();
      const updated = await submitAuction(id);
      setAuction(updated);
      setMessage("Submitted for review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this auction.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete draft", "Delete this draft auction? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteAuction(id);
      router.replace("/sell/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this auction.");
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

  if (loadError || !auction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this auction</Text>
        <Text style={styles.centeredText}>{loadError}</Text>
      </View>
    );
  }

  const editable = auction.status === "draft" || auction.status === "pending_review";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{STATUS_LABELS[auction.status] || auction.status}</Text>
          <Text style={styles.statusTitle}>{vehicleTitle(auction)}</Text>
          <Text style={styles.statusMeta}>
            {formatMileage(auction.mileage)} · Starting bid ${auction.startingBid.toLocaleString()}
          </Text>
          {auction.isTest ? <Text style={styles.testBadge}>TEST AUCTION</Text> : null}

          {auction.status === "draft" && auction.rejectionReason ? (
            <Text style={styles.rejectionText}>Admin feedback: {auction.rejectionReason}</Text>
          ) : null}
          {auction.status === "pending_review" ? (
            <Text style={styles.statusHint}>Awaiting admin review before it goes live.</Text>
          ) : null}
          {auction.status === "scheduled" ? (
            <Text style={styles.statusHint}>
              Starts {auction.startsAt ? new Date(auction.startsAt).toLocaleString() : "soon"}.
            </Text>
          ) : null}
          {auction.status === "live" ? (
            <Text style={styles.statusHint}>
              {formatTimeRemaining(auction.endsAt)} · Current bid{" "}
              {auction.currentBid != null ? `$${auction.currentBid.toLocaleString()}` : "none yet"} · {auction.bidCount} bids
            </Text>
          ) : null}
          {auction.status === "sold" ? (
            <Text style={styles.statusHint}>
              Sold for {auction.currentBid != null ? `$${auction.currentBid.toLocaleString()}` : "—"}.
            </Text>
          ) : null}
          {auction.status === "reserve_not_met" ? (
            <Text style={styles.statusHint}>Ended — the reserve price was not met.</Text>
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
              <Text style={styles.cardTitle}>Description &amp; disclosures</Text>
              <TextInput style={[styles.input, styles.messageInput]} placeholder="Description" value={description} onChangeText={setDescription} multiline placeholderTextColor="#9ca3af" />
              <TextInput style={[styles.input, styles.messageInput]} placeholder="Disclosures" value={disclosures} onChangeText={setDisclosures} multiline placeholderTextColor="#9ca3af" />
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
                it before it&apos;s shown to bidders.
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
              {auction.vehicleHistoryReport?.url && !(auction as any).vehicleHistoryReport?.approved ? (
                <Text style={styles.reportPending}>Awaiting admin approval.</Text>
              ) : null}
            </View>

            {message && <Text style={styles.success}>{message}</Text>}
            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={[styles.secondaryButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#111827" /> : <Text style={styles.secondaryButtonText}>Save Changes</Text>}
            </TouchableOpacity>

            {auction.status === "draft" ? (
              <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Review</Text>}
              </TouchableOpacity>
            ) : null}

            {auction.status === "draft" ? (
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
                report={auction.vehicleHistoryReport}
                onRequestReport={() => Alert.alert("Contact us", "Reach out to Drive Prime Motors to request a report.")}
              />
            </View>

            {auction.bids.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bid History ({auction.bids.length})</Text>
                {[...auction.bids].reverse().map((bid, i) => (
                  <View key={i} style={styles.bidRow}>
                    <Text style={styles.bidLabel}>{bid.bidderLabel}</Text>
                    <Text style={styles.bidAmount}>${bid.amount.toLocaleString()}</Text>
                    <Text style={styles.bidTime}>{new Date(bid.placedAt).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
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

  bidRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingVertical: 9 },
  bidLabel: { color: "#374151", fontSize: 12, fontWeight: "700", flex: 1 },
  bidAmount: { color: "#111827", fontSize: 13, fontWeight: "900", marginHorizontal: 8 },
  bidTime: { color: "#9ca3af", fontSize: 10 },

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
