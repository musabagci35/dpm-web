import type { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export type TitleStatus =
  | "clean"
  | "salvage"
  | "rebuilt"
  | "title_pending"
  | "unknown";

export type VehicleFormState = {
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  bodyStyle: string;
  transmission: string;
  drivetrain: string;
  price: string;
  /** Always manually entered — never autofilled or inferred from the VIN. */
  mileage: string;
  titleStatus: TitleStatus;
  phone: string;
  description: string;
  /** Optional link to a real third-party CARFAX report — never generated. */
  carfaxUrl: string;
  status: "available" | "pending" | "sold" | "archived";
};

export const emptyVehicleForm: VehicleFormState = {
  year: "",
  make: "",
  model: "",
  trim: "",
  engine: "",
  fuel: "",
  bodyStyle: "",
  transmission: "",
  drivetrain: "",
  price: "",
  mileage: "",
  titleStatus: "unknown",
  phone: "",
  description: "",
  carfaxUrl: "",
  status: "available",
};

const STATUSES: VehicleFormState["status"][] = [
  "available",
  "pending",
  "sold",
  "archived",
];

const TITLE_STATUSES: { value: TitleStatus; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "salvage", label: "Salvage" },
  { value: "rebuilt", label: "Rebuilt" },
  { value: "title_pending", label: "Title Pending" },
  { value: "unknown", label: "Unknown" },
];

export default function VehicleFieldsForm({
  value,
  onChange,
}: {
  value: VehicleFormState;
  onChange: (patch: Partial<VehicleFormState>) => void;
}) {
  return (
    <View>
      <View style={styles.twoColumns}>
        <Field
          style={styles.columnInput}
          placeholder="Year"
          value={value.year}
          onChangeText={(v) => onChange({ year: v })}
          keyboardType="number-pad"
        />
        <Field
          style={styles.columnInput}
          placeholder="Price"
          value={value.price}
          onChangeText={(v) => onChange({ price: v })}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.twoColumns}>
        <Field
          style={styles.columnInput}
          placeholder="Make"
          value={value.make}
          onChangeText={(v) => onChange({ make: v })}
        />
        <Field
          style={styles.columnInput}
          placeholder="Model"
          value={value.model}
          onChangeText={(v) => onChange({ model: v })}
        />
      </View>
      <View style={styles.twoColumns}>
        <Field
          style={styles.columnInput}
          placeholder="Trim (optional)"
          value={value.trim}
          onChangeText={(v) => onChange({ trim: v })}
        />
        <Field
          style={styles.columnInput}
          placeholder="Mileage (required)"
          value={value.mileage}
          onChangeText={(v) => onChange({ mileage: v })}
          keyboardType="number-pad"
        />
      </View>

      <Text style={styles.sectionLabel}>Title status</Text>
      <View style={styles.titleStatusRow}>
        {TITLE_STATUSES.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.titleStatusButton,
              value.titleStatus === option.value && styles.statusButtonSelected,
            ]}
            onPress={() => onChange({ titleStatus: option.value })}
          >
            <Text
              style={[
                styles.statusButtonText,
                value.titleStatus === option.value && styles.statusButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Specifications</Text>
      <View style={styles.twoColumns}>
        <Field
          style={styles.columnInput}
          placeholder="Engine"
          value={value.engine}
          onChangeText={(v) => onChange({ engine: v })}
        />
        <Field
          style={styles.columnInput}
          placeholder="Fuel type"
          value={value.fuel}
          onChangeText={(v) => onChange({ fuel: v })}
        />
      </View>
      <View style={styles.twoColumns}>
        <Field
          style={styles.columnInput}
          placeholder="Body style"
          value={value.bodyStyle}
          onChangeText={(v) => onChange({ bodyStyle: v })}
        />
        <Field
          style={styles.columnInput}
          placeholder="Transmission"
          value={value.transmission}
          onChangeText={(v) => onChange({ transmission: v })}
        />
      </View>
      <Field
        placeholder="Drivetrain"
        value={value.drivetrain}
        onChangeText={(v) => onChange({ drivetrain: v })}
      />

      <Text style={styles.sectionLabel}>Contact & description</Text>
      <Field
        placeholder="Contact phone for this vehicle (optional)"
        value={value.phone}
        onChangeText={(v) => onChange({ phone: v })}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Description (optional)"
        placeholderTextColor="#9ca3af"
        value={value.description}
        onChangeText={(v) => onChange({ description: v })}
        multiline
      />
      <Field
        placeholder="CARFAX report URL (optional)"
        value={value.carfaxUrl}
        onChangeText={(v) => onChange({ carfaxUrl: v })}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.statusRow}>
        {STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              value.status === status && styles.statusButtonSelected,
            ]}
            onPress={() => onChange({ status })}
          >
            <Text
              style={[
                styles.statusButtonText,
                value.status === status && styles.statusButtonTextSelected,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Field(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#9ca3af"
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  twoColumns: { flexDirection: "row", gap: 8 },
  columnInput: { flex: 1 },
  messageInput: { minHeight: 84, textAlignVertical: "top" },
  sectionLabel: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 8,
  },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  titleStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  titleStatusButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  statusButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: "center",
  },
  statusButtonSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  statusButtonText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusButtonTextSelected: { color: "#fff" },
});
