import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function AdminDashboard() {

  await connectDB();

  const totalCars = await Car.countDocuments({});
  const liveCars = await Car.countDocuments({ isActive: true });

  const latestCars = await Car.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    const avgPrice =
  latestCars.reduce((t:any,c:any)=>t+(c.price||0),0) / latestCars.length;

const expectedProfit =
  latestCars.reduce((t:any,c:any)=>t+(c.price||0),0) * 0.15;

  return (
    <main className="min-h-screen bg-gray-50 p-10">

      <h1 className="text-3xl font-bold mb-6">
        Dealer Dashboard
      </h1>
      

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white border rounded-xl p-6">
          <p className="text-gray-500 text-sm">Total Cars</p>
          <p className="text-3xl font-bold">{totalCars}</p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <p className="text-gray-500 text-sm">Live Cars</p>
          <p className="text-3xl font-bold">{liveCars}</p>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <p className="text-gray-500 text-sm">Inventory Value</p>
          <p className="text-3xl font-bold">
            ${latestCars.reduce((t:any,c:any)=>t+(c.price||0),0).toLocaleString()}
          </p>
        </div>

      </div>

      {/* LATEST VEHICLES */}
      <div className="bg-white border rounded-xl p-6">

        <h2 className="text-xl font-bold mb-4">
          Latest Vehicles
        </h2>

        {latestCars.length === 0 && (
          <p className="text-gray-500">
            No cars yet
          </p>
        )}

        {latestCars.map((car:any)=>(
          <div
            key={car._id}
            className="flex justify-between border-b py-3"
          >
    
            <div>
              <p className="font-semibold">
                {car.year} {car.make} {car.model}
              </p>

              <p className="text-sm text-gray-500">
                VIN: {car.vin}
              </p>
            </div>

            <p className="font-bold">
              ${car.price?.toLocaleString() || "0"}
            </p>

          </div>
        ))}

      </div>

    </main>
  );
}