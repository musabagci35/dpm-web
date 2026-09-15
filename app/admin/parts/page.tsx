import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Part from "@/models/Part";
import AdminPartsClient from "@/components/admin/AdminPartsClient";

export default async function AdminPartsPage() {
  await connectDB();

  const parts: any[] = await Part.find({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const safeParts = JSON.parse(JSON.stringify(parts));

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Parts</h1>
          <p className="mt-1 text-gray-500">
            Manage auto parts inventory, prices, stock, and status
          </p>
        </div>

        <Link
          href="/admin/add-part"
          className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800"
        >
          + Add Part
        </Link>
      </div>

      <AdminPartsClient parts={safeParts} />
    </div>
  );
}