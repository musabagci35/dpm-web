import CRMClient from "@/components/admin/CRMClient";

export default function AdminCRMPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="mt-2 text-gray-600">
            Track leads, prioritize follow-up, and manage your sales pipeline.
          </p>
        </div>

        <CRMClient />
      </div>
    </main>
  );
}