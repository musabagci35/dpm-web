import DealerDashboard from "@/components/DealerDashboard";

export default function DealerPage() {

  const latestCars = [
    { year: 2021, make: "BMW", model: "X5", price: 45000 },
    { year: 2019, make: "Audi", model: "A6", price: 32000 },
  ];

  const vinHistory = [
    { year: 2020, make: "Toyota", model: "Camry" }
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">

      <h1 className="text-3xl font-bold mb-2">
        Dealer Dashboard
      </h1>

      <p className="text-gray-500 mb-6">
        Quick overview of inventory
      </p>

      <DealerDashboard
        totalCars={12}
        liveCars={10}
        latestCars={latestCars}
        vinHistory={vinHistory}
      />

    </main>
  );
}