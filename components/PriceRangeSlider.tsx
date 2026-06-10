"use client";

type Props = {
  min?: number;
  max?: number;
  onChange?: (range: [number, number]) => void;
};

export default function PriceRangeSlider({
  min = 0,
  max = 100000,
  onChange,
}: Props) {
  return (
    <div className="p-4 border rounded">
      <p className="text-sm text-gray-500 mb-2">
        Price Range: ${min} - ${max}
      </p>

      <input
        type="range"
        min={min}
        max={max}
        onChange={(e) => {
          const value = Number(e.target.value);
          onChange?.([min, value]);
        }}
        className="w-full"
      />
    </div>
  );
}