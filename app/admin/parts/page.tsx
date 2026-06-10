import Link from "next/link";
import { connectDB } from "@/lib/db";
import Part from "@/models/Part";
import AdminPartsClient from "@/components/admin/AdminPartsClient";

export default async function AdminPartsPage() {
  await connectDB();

  const parts: any[] = await Part.find({})
    .sort({ createdAt: -1 })
    .lean();

  const safeParts = JSON.parse(JSON.stringify(parts));

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Parts</h1>
          <p className="mt-1 text-gray-500">
            Manage auto parts inventory, prices, stock, and status
          </p>
        </div>

        <Link
          href="/admin/add-part"
          className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
        >
          + Add Part
        </Link>
      </div>

      <AdminPartsClient parts={safeParts} />
    </main>
  );
}