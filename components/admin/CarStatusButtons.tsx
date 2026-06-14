"use client";

export default function CarStatusButtons({ carId }: { carId: string }) {
  async function markSold() {
    const ok = confirm("Mark this vehicle as SOLD and hide it from website?");
    if (!ok) return;

    const res = await fetch(`/api/admin/cars/${carId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "sold",
        isActive: false,
      }),
    });

    if (res.ok) {
      alert("Vehicle marked as sold ✅");
      window.location.reload();
    } else {
      alert("Failed to update vehicle");
    }
  }

  async function hideVehicle() {
    const ok = confirm("Hide this vehicle from public website?");
    if (!ok) return;

    const res = await fetch(`/api/admin/cars/${carId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "archived",
        isActive: false,
      }),
    });

    if (res.ok) {
      alert("Vehicle hidden ✅");
      window.location.reload();
    } else {
      alert("Failed to hide vehicle");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={markSold}
        className="bg-red-600 text-white px-4 py-2 rounded-xl text-center"
      >
        Mark Sold
      </button>

      <button
        type="button"
        onClick={hideVehicle}
        className="border border-gray-400 px-4 py-2 rounded-xl text-center"
      >
        Hide
      </button>
    </>
  );
}