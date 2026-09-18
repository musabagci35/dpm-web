import { useState } from "react";
import { Link } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ContactForm from "@/components/ContactForm";
import { VinLookupResult } from "@/lib/api";
import { coverImageUrl, formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

const RECALLS_SHOWN_COLLAPSED = 2;

function Fact({ label, value }: { label: string; value: string }) {
  const provided = Boolean(value && value.trim());
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.factValue, !provided && styles.factValueMissing]}>
        {provided ? value : "Not provided by NHTSA"}
      </Text>
    </View>
  );
}

export default function VinResultCard({ result }: { result: VinLookupResult }) {
  const [showAllRecalls, setShowAllRecalls] = useState(false);

  const title = [result.year, result.make, result.model, result.trim]
    .filter(Boolean)
    .join(" ");
  const match = result.car;
  const recalls = showAllRecalls
    ? result.recalls
    : result.recalls.slice(0, RECALLS_SHOWN_COLLAPSED);
  const hiddenRecalls = result.recalls.length - recalls.length;

  return (
    <View style={styles.wrapper}>
      {/* ---------------- Header ---------------- */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>VIN LOOKUP RESULT</Text>
        <Text style={styles.title}>{title || "No vehicle record found"}</Text>
        <Text style={styles.vin}>VIN {result.vin}</Text>
      </View>

      {!result.hasData ? (
        <View style={styles.noDecode}>
          <Text style={styles.noDecodeHeading}>
            NHTSA has no record for this VIN
          </Text>
          <Text style={styles.noDecodeText}>
            The VIN is correctly formatted, but the federal vehicle database
            returned no build data for it. Double-check the VIN, or send it to
            us below and we&apos;ll look into it.
          </Text>
        </View>
      ) : (
        /* ---------------- Decoded information ---------------- */
        <View style={styles.panel}>
          <Text style={styles.panelHeading}>Decoded vehicle information</Text>
          <View style={styles.grid}>
            <Fact label="Year" value={result.year} />
            <Fact label="Make" value={result.make} />
            <Fact label="Model" value={result.model} />
            <Fact label="Trim" value={result.trim} />
            <Fact label="Engine" value={result.engine} />
            <Fact label="Fuel type" value={result.fuel} />
            <Fact label="Body style" value={result.body} />
            <Fact label="Transmission" value={result.transmission} />
            <Fact label="Drivetrain" value={result.drivetrain} />
          </View>
          <Text style={styles.sourceLine}>
            Decoded from the VIN via {result.decodeSource}.
          </Text>
        </View>
      )}

      {/* ---------------- Inventory status ---------------- */}
      {result.foundInInventory && match ? (
        <View style={styles.matchPanel}>
          <Text style={styles.matchHeading}>
            This vehicle is in our inventory
          </Text>

          <Link
            href={`/vehicle/${encodeURIComponent(match.slug)}`}
            asChild
          >
            <TouchableOpacity style={styles.matchCard} accessibilityRole="link">
              {coverImageUrl(match.images) ? (
                <Image
                  source={{ uri: coverImageUrl(match.images) as string }}
                  style={styles.matchImage}
                />
              ) : (
                <View style={[styles.matchImage, styles.matchImagePlaceholder]}>
                  <Text style={styles.matchImagePlaceholderText}>No photo</Text>
                </View>
              )}

              <View style={styles.matchInfo}>
                <Text style={styles.matchTitle} numberOfLines={2}>
                  {vehicleTitle(match)}
                </Text>
                <Text style={styles.matchMeta}>
                  {formatMileage(match.mileage)}
                </Text>
                <Text style={styles.matchPrice}>{formatPrice(match.price)}</Text>
                <Text style={styles.matchCta}>View full listing →</Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Text style={styles.matchFootnote}>
            Photos, full specifications, description and contact options are on
            the listing page.
          </Text>
        </View>
      ) : (
        <View style={styles.notListedPanel}>
          <Text style={styles.notListedHeading}>
            Not currently listed by Drive Prime Motors
          </Text>
          <Text style={styles.notListedText}>
            {result.hasData
              ? "We decoded this vehicle successfully, but it is not in our live inventory right now. Tell us how to reach you and we'll let you know if we can source it or find you something comparable."
              : "We don't have this VIN in our live inventory. Send us your details and we'll follow up."}
          </Text>
          <Link href="/" style={styles.notListedLink}>
            Browse current inventory →
          </Link>
        </View>
      )}

      {/* ---------------- Safety recalls ---------------- */}
      <View style={styles.panel}>
        <Text style={styles.panelHeading}>Open safety recalls</Text>

        {!result.recallsAvailable ? (
          <Text style={styles.recallEmpty}>
            A recall check needs the make, model and year, which we couldn&apos;t
            decode for this VIN.
          </Text>
        ) : result.recallsError ? (
          <Text style={styles.recallEmpty}>{result.recallsError}</Text>
        ) : result.recalls.length === 0 ? (
          <Text style={styles.recallEmpty}>
            NHTSA lists no safety recalls for this year, make and model.
          </Text>
        ) : (
          <>
            <View style={styles.recallCountPill}>
              <Text style={styles.recallCountText}>
                {result.recalls.length}{" "}
                {result.recalls.length === 1 ? "recall" : "recalls"} on record
              </Text>
            </View>

            {recalls.map((recall, index) => (
              <View
                key={recall.campaignNumber || `${recall.component}-${index}`}
                style={styles.recall}
              >
                <Text style={styles.recallComponent}>
                  {recall.component || "Safety recall"}
                </Text>
                {recall.campaignNumber ? (
                  <Text style={styles.recallCampaign}>
                    NHTSA campaign {recall.campaignNumber}
                    {recall.reportedDate ? ` · ${recall.reportedDate}` : ""}
                  </Text>
                ) : null}
                {recall.summary ? (
                  <Text style={styles.recallBody}>{recall.summary}</Text>
                ) : null}
                {recall.consequence ? (
                  <Text style={styles.recallBody}>
                    <Text style={styles.recallBodyLabel}>Risk: </Text>
                    {recall.consequence}
                  </Text>
                ) : null}
                {recall.remedy ? (
                  <Text style={styles.recallBody}>
                    <Text style={styles.recallBodyLabel}>Remedy: </Text>
                    {recall.remedy}
                  </Text>
                ) : null}
              </View>
            ))}

            {hiddenRecalls > 0 || showAllRecalls ? (
              <TouchableOpacity
                style={styles.recallToggle}
                onPress={() => setShowAllRecalls((value) => !value)}
                accessibilityRole="button"
              >
                <Text style={styles.recallToggleText}>
                  {showAllRecalls
                    ? "Show fewer recalls"
                    : `Show ${hiddenRecalls} more ${
                        hiddenRecalls === 1 ? "recall" : "recalls"
                      }`}
                </Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.sourceLine}>
              Source: NHTSA recall database, matched by year, make and model.
              Confirm whether a specific recall is still open for this VIN with
              an authorized dealer.
            </Text>
          </>
        )}
      </View>

      {/* ---------------- Honesty note ---------------- */}
      <View style={styles.disclosure}>
        <Text style={styles.disclosureText}>
          This report covers factory build data and federal safety recalls only.
          Accident, title, ownership and odometer history are not included —
          those come from a licensed vehicle-history provider, and we don&apos;t
          estimate them.
        </Text>
      </View>

      {/* ---------------- Request form ---------------- */}
      {!result.foundInInventory ? (
        <ContactForm
          vin={result.vin}
          carTitle={title || undefined}
          heading="Request This Vehicle"
          intro="Send us your contact details and we'll follow up about sourcing this vehicle or finding a close match."
          submitLabel="Request This Vehicle"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },

  header: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
  },
  eyebrow: {
    color: "#fca5a5",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 6 },
  vin: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
    fontWeight: "600",
  },

  panel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  panelHeading: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14, columnGap: 12 },
  fact: { width: "47%" },
  factLabel: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  factValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 19,
  },
  factValueMissing: { color: "#9ca3af", fontWeight: "500", fontStyle: "italic" },

  sourceLine: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
  },

  noDecode: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#fde68a",
    padding: 16,
  },
  noDecodeHeading: { color: "#92400e", fontWeight: "900", fontSize: 15 },
  noDecodeText: {
    color: "#92400e",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  matchPanel: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#bbf7d0",
    padding: 16,
  },
  matchHeading: { color: "#166534", fontWeight: "900", fontSize: 15 },
  matchCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 10,
    marginTop: 12,
  },
  matchImage: { width: 104, height: 84, borderRadius: 10, backgroundColor: "#f3f4f6" },
  matchImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  matchImagePlaceholderText: { color: "#9ca3af", fontSize: 11, fontWeight: "700" },
  matchInfo: { flex: 1 },
  matchTitle: { color: "#111827", fontSize: 14, fontWeight: "800" },
  matchMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  matchPrice: { color: "#dc2626", fontSize: 17, fontWeight: "900", marginTop: 4 },
  matchCta: { color: "#166534", fontSize: 12, fontWeight: "900", marginTop: 6 },
  matchFootnote: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },

  notListedPanel: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#fed7aa",
    padding: 16,
  },
  notListedHeading: { color: "#9a3412", fontWeight: "900", fontSize: 15 },
  notListedText: {
    color: "#9a3412",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  notListedLink: { color: "#9a3412", fontWeight: "900", fontSize: 13, marginTop: 12 },

  recallEmpty: { color: "#6b7280", fontSize: 13, lineHeight: 19 },
  recallCountPill: {
    alignSelf: "flex-start",
    backgroundColor: "#fef2f2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  recallCountText: { color: "#991b1b", fontWeight: "900", fontSize: 12 },
  recall: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    marginTop: 12,
  },
  recallComponent: { color: "#991b1b", fontWeight: "900", fontSize: 13 },
  recallCampaign: { color: "#9ca3af", fontSize: 11, marginTop: 2, fontWeight: "600" },
  recallBody: { color: "#374151", fontSize: 13, lineHeight: 19, marginTop: 6 },
  recallBodyLabel: { fontWeight: "800", color: "#111827" },
  recallToggle: { marginTop: 14 },
  recallToggleText: { color: "#b91c1c", fontWeight: "900", fontSize: 13 },

  disclosure: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 16,
  },
  disclosureText: { color: "#6b7280", fontSize: 12, lineHeight: 17 },
});
