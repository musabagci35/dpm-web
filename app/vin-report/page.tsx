import VINProPanel from "@/components/VINProPanel";

export default function VinReportPage() {

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">

      <h1 className="text-3xl font-bold mb-4">
        VIN Report For Sale in Sacramento
      </h1>

      <p className="text-gray-600 mb-10">
        Browse available VIN report vehicles at Drive Prime Motors.
      </p>

      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <VINProPanel />
      </div>

    </div>
  );
}