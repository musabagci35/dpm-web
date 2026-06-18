"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminPartsClient({ parts }: { parts: any[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [stock, setStock] = useState("all");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filteredParts = parts.filter((part) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      part.title?.toLowerCase().includes(searchText) ||
      part.partNumber?.toLowerCase().includes(searchText) ||
      part.oemNumber?.toLowerCase().includes(searchText) ||
      part.compatibility?.toLowerCase().includes(searchText);

    const matchesCategory = category === "all" || part.category === category;
    const matchesCondition = condition === "all" || part.condition === condition;

    const qty = Number(part.quantity || 0);

    const matchesStock =
      stock === "all" ||
      (stock === "soldout" && qty <= 0) ||
      (stock === "low" && qty > 0 && qty <= 2) ||
      (stock === "instock" && qty > 2);

    return matchesSearch && matchesCategory && matchesCondition && matchesStock;
  });

  async function publishToEbay(partId: string) {
    if (!confirm("Publish this part to eBay?")) return;
  
    setPublishingId(partId);
  
    try {
      const res = await fetch("/api/ebay/publish-part", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ partId }),
      });
  
      const data = await res.json();
  
      if (data.success) {
        alert(`Part listed on eBay ✅ Item ID: ${data.ebayItemId || "N/A"}`);
        window.location.reload();
      } else {
        alert(data.error || "eBay publish failed");
      }
    } catch (error) {
      console.error(error);
      alert("eBay error");
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, part #, OEM..."
          className="rounded-xl border p-3"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Categories</option>
          <option value="engine">Engine</option>
          <option value="transmission">Transmission</option>
          <option value="body">Body</option>
          <option value="lighting">Lighting</option>
          <option value="wheels">Wheels</option>
          <option value="interior">Interior</option>
          <option value="electronics">Electronics</option>
          <option value="suspension">Suspension</option>
          <option value="other">Other</option>
        </select>

        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Conditions</option>
          <option value="used">Used</option>
          <option value="new">New</option>
          <option value="rebuilt">Rebuilt</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="all">All Stock</option>
          <option value="instock">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="soldout">Sold Out</option>
        </select>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        Showing {filteredParts.length} of {parts.length} parts
      </div>

      {filteredParts.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
          No matching parts found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4">Part</th>
                <th className="p-4">Category</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Compatibility</th>
                <th className="p-4">Price</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Status</th>
                <th className="p-4">eBay</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredParts.map((part) => (
                <tr key={part._id.toString()} className="border-t">
                  <td className="p-4">
                    <div className="font-bold">{part.title}</div>
                    <div className="text-xs text-gray-500">
                      Part #: {part.partNumber || "N/A"} | OEM:{" "}
                      {part.oemNumber || "N/A"}
                    </div>
                  </td>

                  <td className="p-4 capitalize">{part.category || "other"}</td>

                  <td className="p-4 capitalize">{part.condition || "used"}</td>

                  <td className="p-4 text-gray-600">
                    {part.compatibility || "N/A"}
                  </td>

                  <td className="p-4 font-bold">
                    ${Number(part.price || 0).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {Number(part.quantity || 0) <= 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                        Sold Out
                      </span>
                    ) : Number(part.quantity || 0) <= 2 ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
                        Low Stock ({part.quantity})
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        In Stock ({part.quantity})
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    {part.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        Hidden
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    {part.ebayStatus === "listed" ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                        Listed
                      </span>
                    ) : part.ebayStatus === "error" ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                        Error
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        Not Listed
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-3">
                      <Link
                        href={`/parts/${part.slug}`}
                        className="text-red-600 hover:underline"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/edit-part/${part._id.toString()}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      {part.ebayStatus === "listed" ? (
  <div className="text-xs font-semibold text-green-600">
    <div>Published</div>
    {part.ebayItemId && (
      <a
        href={`https://www.ebay.com/itm/${part.ebayItemId}`}
        target="_blank"
        className="text-blue-600 hover:underline"
      >
        View eBay
      </a>
    )}
  </div>
) : (
  <button
    type="button"
    disabled={publishingId === part._id.toString()}
    onClick={() => publishToEbay(part._id.toString())}
    className="text-purple-600 hover:underline disabled:opacity-50"
  >
    {publishingId === part._id.toString()
      ? "Publishing..."
      : "Publish to eBay"}
  </button>
)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}