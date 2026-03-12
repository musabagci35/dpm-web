import Link from "next/link";

export default async function AdminInboxPage() {
  const res = await fetch("http://localhost:3000/api/conversations", {
    cache: "no-store",
  });
  const convos = await res.json();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Inbox</h1>

      <div className="space-y-3">
        {convos.map((c: any) => (
          <Link
            key={c._id}
            href={`/admin/inbox/${c._id}`}
            className="block rounded-2xl border p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {c.buyerName} • {c.buyerPhone}
                </p>
                <p className="text-sm text-gray-600">
                  Car: {c.carId?.year} {c.carId?.make} {c.carId?.model}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(c.lastMessageAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}

        {convos.length === 0 && (
          <p className="text-gray-600">No conversations yet.</p>
        )}
      </div>
    </div>
  );
}