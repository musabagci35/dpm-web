import { useState } from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * The one text-input style shared by every auth screen (login, register,
 * forgot/reset password, OTP entry): a clear-X button that appears once
 * there's text, and — for password fields — a show/hide eye toggle next to
 * it. Toggling visibility never touches the underlying value, only how the
 * OS renders it, so nothing about the password is exposed beyond what the
 * person themselves chose to reveal on their own screen.
 */
export default function AuthTextInput({
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  keyboardType,
  autoCapitalize = "none",
  textContentType,
  accessibilityLabel,
  maxLength,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  textContentType?: TextInputProps["textContentType"];
  accessibilityLabel?: string;
  maxLength?: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const label = accessibilityLabel || placeholder;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword && !revealed}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        textContentType={textContentType}
        maxLength={maxLength}
        accessibilityLabel={label}
      />
      <View style={styles.icons}>
        {value.length > 0 ? (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
        ) : null}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Hide ${label}` : `Show ${label}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>{revealed ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  icons: { flexDirection: "row", alignItems: "center", paddingRight: 8, gap: 2 },
  iconButton: { padding: 6 },
  iconText: { fontSize: 15, color: "#6b7280" },
});
