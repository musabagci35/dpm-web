"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PartPhotoManager from "@/components/admin/PartPhotoManager";

export default function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    partNumber: "",
    oemNumber: "",
    ebayUrl: "",
    category: "other",
    condition: "used",
    compatibility: "",
    price: "",
    quantity: "1",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    async function load() {
      const resolved = await params;
      setId(resolved.id);

      const res = await fetch(`/api/parts/${resolved.id}`);
      const data = await res.json();

      if (data.success) {
        const part = data.part;

        setForm({
          title: part.title || "",
          partNumber: part.partNumber || "",
          oemNumber: part.oemNumber ||
           "",
           ebayUrl: part.ebayUrl || "",
          category: part.category || "other",
          condition: part.condition || "used",
          compatibility: part.compatibility || "",
          price: String(part.price || ""),
          quantity: String(part.quantity || 1),
          description: part.description || "",
          isActive: Boolean(part.isActive),
        });

        setImages(part.images || []);
      } else {
        alert(data.error || "Part not found");
      }

      setLoading(false);
    }

    load();
  }, [params]);
  

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      price: Number(form.price || 0),
      quantity: Number(form.quantity || 1),
      images,
    };
    console.log("EDIT PAYLOAD:", payload);
    const res = await fetch(`/api/parts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      alert("Part updated ✅");
      router.push("/admin/parts");
    } else {
      alert(data.error || "Update failed");
    }
  }

  async function handleDelete() {
    const ok = confirm("Delete this part permanently?");
    if (!ok) return;

    const res = await fetch(`/api/parts/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      alert("Part deleted");
      router.push("/admin/parts");
    } else {
      alert(data.error || "Delete failed");
    }
  }

  if (loading) {
    return <div className="p-10">Loading part...</div>;
  }

  return (
    <div className="max-w-3xl p-10">

<div className="mb-4 flex gap-2">
  <button
    type="button"
    onClick={() => router.push("/admin/dashboard")}
    className="rounded-xl border px-4 py-2"
  >
    ← Dashboard
  </button>

  <button
    type="button"
    onClick={() => router.push("/admin/parts")}
    className="rounded-xl border px-4 py-2"
  >
    ← Parts
  </button>
</div>
      <h1 className="mb-6 text-2xl font-bold">Edit Part</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Part Title"
          className="w-full border p-2"
        />

        <input
          value={form.partNumber}
          onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
          placeholder="Part Number"
          className="w-full border p-2"
        />

        <input
          value={form.oemNumber}
          onChange={(e) => setForm({ ...form, oemNumber: e.target.value })}
          placeholder="OEM Number"
          className="w-full border p-2"
        />
        <input
  value={form.ebayUrl}
  onChange={(e) =>
    setForm({ ...form, ebayUrl: e.target.value })
  }
  placeholder="eBay Listing URL"
  className="w-full border p-2"
/>

        <input
          value={form.compatibility}
          onChange={(e) =>
            setForm({ ...form, compatibility: e.target.value })
          }
          placeholder="Fits: 2017-2020 Chevy Colorado"
          className="w-full border p-2"
        />

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border p-2"
        >
          <option value="other">Other</option>
          <option value="engine">Engine</option>
          <option value="transmission">Transmission</option>
          <option value="body">Body</option>
          <option value="lighting">Lighting</option>
          <option value="wheels">Wheels</option>
          <option value="interior">Interior</option>
          <option value="electronics">Electronics</option>
          <option value="suspension">Suspension</option>
        </select>

        <select
          value={form.condition}
          onChange={(e) => setForm({ ...form, condition: e.target.value })}
          className="w-full border p-2"
        >
          <option value="used">Used</option>
          <option value="new">New</option>
          <option value="rebuilt">Rebuilt</option>
          <option value="unknown">Unknown</option>
        </select>

        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          type="number"
          placeholder="Price"
          className="w-full border p-2"
        />

        <input
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          type="number"
          placeholder="Quantity"
          className="w-full border p-2"
        />

        <label className="flex items-center gap-2 rounded border p-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active / Show on public parts page
        </label>

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          className="w-full border p-2"
          rows={6}
        />

        <PartPhotoManager value={images} onChange={setImages} />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-full bg-red-600 px-4 py-2 text-white"
        >
          Delete Part
        </button>
      </form>
    </div>
  );
}