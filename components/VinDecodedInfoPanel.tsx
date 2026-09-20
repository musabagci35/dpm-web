import { BadgeCheck, Clock } from "lucide-react";

export type VinDecodedFields = {
  year?: string | number;
  make?: string;
  model?: string;
  trim?: string;
  body?: string;
  engine?: string;
  transmission?: string;
  fuel?: string;
  driveType?: string;
  manufacturer?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  source?: string;
  decodedAt?: string;
  cached?: boolean;
};

function formatDecodedAt(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function plantLocation(fields: VinDecodedFields) {
  return [fields.plantCity, fields.plantState, fields.plantCountry]
    .filter(Boolean)
    .join(", ");
}

export default function VinDecodedInfoPanel({
  fields,
  className = "",
}: {
  fields: VinDecodedFields;
  className?: string;
}) {
  const rows: { label: string; value?: string }[] = [
    { label: "Year", value: fields.year ? String(fields.year) : "" },
    { label: "Make", value: fields.make },
    { label: "Model", value: fields.model },
    { label: "Trim", value: fields.trim },
    { label: "Body Class", value: fields.body },
    { label: "Engine", value: fields.engine },
    { label: "Transmission", value: fields.transmission },
    { label: "Drive Type", value: fields.driveType },
    { label: "Fuel Type", value: fields.fuel },
    { label: "Manufacturer", value: fields.manufacturer },
    { label: "Plant Location", value: plantLocation(fields) },
  ].filter((row) => row.value);

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-gray-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Source: {fields.source || "NHTSA vPIC"}
        </span>
        {fields.decodedAt && (
          <span className="inline-flex items-center gap-1.5 text-gray-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Looked up {formatDecodedAt(fields.decodedAt)}
            {fields.cached ? " (cached)" : ""}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No decoded data is available for this VIN.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                {row.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {row.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
