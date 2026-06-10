export default function Stat({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
      </div>
    );
  }