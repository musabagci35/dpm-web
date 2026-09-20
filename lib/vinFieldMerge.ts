export type MergeableField = {
  key: string;
  label: string;
  current: string;
  decoded: string;
};

/**
 * Compares each field's current (dealer-entered) value against the decoded
 * VIN value. Empty fields are filled automatically. Fields that already
 * differ from the decoded value prompt the user before being overwritten.
 * Returns only the keys that should actually be updated.
 */
export function resolveVinFieldUpdates(
  fields: MergeableField[]
): Record<string, string> {
  const updates: Record<string, string> = {};

  for (const field of fields) {
    const decodedTrimmed = (field.decoded || "").trim();
    if (!decodedTrimmed) continue;

    const currentTrimmed = (field.current || "").trim();

    if (!currentTrimmed) {
      updates[field.key] = decodedTrimmed;
      continue;
    }

    if (currentTrimmed.toLowerCase() === decodedTrimmed.toLowerCase()) {
      continue;
    }

    const replace = window.confirm(
      `"${field.label}" is currently "${field.current}". Replace it with the decoded value "${decodedTrimmed}"?`
    );

    if (replace) {
      updates[field.key] = decodedTrimmed;
    }
  }

  return updates;
}
