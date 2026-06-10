"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const suggestions = [
  "Toyota Camry",
  "Honda Civic",
  "BMW X5",
  "Mercedes C300",
  "Tesla Model 3",
  "Ford F-150",
  "Chevrolet Tahoe",
  "Nissan Altima",
];

export default function HomeSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  const handleChange = (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setFiltered([]);
      return;
    }

    const results = suggestions.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );

    setFiltered(results);
    setShow(true);
  };

  const handleSelect = (value: string) => {
    setSearch(value);
    setShow(false);
    router.push(`/inventory?search=${encodeURIComponent(value)}`);
  };

  const handleSearch = () => {
    if (!search.trim()) return;
    router.push(`/inventory?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="mt-10 relative w-full max-w-xl mx-auto">

      {/* INPUT */}
      <input
        type="text"
        value={search}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setShow(true)}
        placeholder="Search make, model, or year..."
        className="w-full px-4 py-3 rounded-xl text-black outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* BUTTON */}
      <button
        onClick={handleSearch}
        className="absolute right-1 top-1 bg-red-600 px-4 py-2 rounded-lg text-white font-semibold hover:bg-red-700"
      >
        Search
      </button>

      {/* DROPDOWN */}
      {show && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border z-50">

          {filtered.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-black"
            >
              {item}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}