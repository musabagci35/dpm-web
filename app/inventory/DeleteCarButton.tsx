"use client";

import { useRouter } from "next/navigation";

export default function DeleteCarButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const ok = confirm("Are you sure you want to delete this car?");
    if (!ok) return;

    const res = await fetch(`/api/admin/cars?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete car");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 underline"
    >
      Delete
    </button>
  );
}
