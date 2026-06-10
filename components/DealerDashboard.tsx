

type Props = {
  totalCars: number;
  liveCars: number;
  latestCars: {
    year: number;
    make: string;
    model: string;
    price: number;
  }[];
  vinHistory: {
    year: number;
    make: string;
    model: string;
  }[];
};

export default function DealerDashboard({
  totalCars,
  liveCars,
  latestCars,
  vinHistory,
}: Props) {
  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <p className="text-gray-500">Total Cars</p>
          <h2 className="text-2xl font-bold">{totalCars}</h2>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <p className="text-gray-500">Live Cars</p>
          <h2 className="text-2xl font-bold">{liveCars}</h2>
        </div>
      </div>

      {/* Latest Cars */}
      <div>
        <h3 className="font-semibold mb-2">Latest Cars</h3>
        {latestCars.map((car, i) => (
          <div key={i} className="border-b py-2">
            {car.year} {car.make} {car.model} - ${car.price}
          </div>
        ))}
      </div>

      {/* VIN History */}
      <div>
        <h3 className="font-semibold mb-2">VIN History</h3>
        {vinHistory.map((car, i) => (
          <div key={i} className="border-b py-2">
            {car.year} {car.make} {car.model}
          </div>
        ))}
      </div>

    </div>
  );
}