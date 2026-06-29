import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Lead from "@/models/Lead";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function Dashboard() {
  await connectDB();

  const [
    totalCars,
    activeCars,
    soldCars,
    featuredCars,
    totalLeads,
    hotLeads,
    newLeads,
    appointments,
    wonLeads,
    cars,
  ] = await Promise.all([
    Car.countDocuments(),
    Car.countDocuments({ isActive: true }),
    Car.countDocuments({ status: "sold" }),
    Car.countDocuments({ isFeatured: true }),
    Lead.countDocuments(),
    Lead.countDocuments({ priority: "hot" }),
    Lead.countDocuments({ status: "new" }),
    Lead.countDocuments({ status: "appointment" }),
    Lead.countDocuments({ status: "won" }),
    Car.find({}).lean(),
  ]);

  const inventoryValue = cars.reduce(
    (sum: number, car: any) => sum + Number(car.price || 0),
    0
  );

  const estimatedProfit = cars.reduce((sum: number, car: any) => {
    const price = Number.isFinite(Number(car.price)) ? Number(car.price) : 0;
    const cost = Number.isFinite(Number(car.cost)) ? Number(car.cost) : 0;
    const recon = Number.isFinite(Number(car.recon)) ? Number(car.recon) : 0;
    const marketing = Number.isFinite(Number(car.marketing)) ? Number(car.marketing) : 0;
    const docFee = Number.isFinite(Number(car.docFee)) ? Number(car.docFee) : 0;
  
    const profit = price - cost - recon - marketing - docFee;
  
    return sum + Math.max(profit, 0);
  }, 0);

  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Drive Prime Motors business overview
          </p>
        </div>

        <LogoutButton />
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Cars" value={totalCars} />
        <StatCard title="Active Cars" value={activeCars} />
        <StatCard title="Sold Cars" value={soldCars} />
        <StatCard title="Featured Cars" value={featuredCars} />

        <StatCard title="Total Leads" value={totalLeads} />
        <StatCard title="Hot Leads" value={hotLeads} />
        <StatCard title="New Leads" value={newLeads} />
        <StatCard title="Appointments" value={appointments} />

        <StatCard
          title="Inventory Value"
          value={`$${inventoryValue.toLocaleString()}`}
        />

        <StatCard
          title="Estimated Profit"
          value={`$${estimatedProfit.toLocaleString()}`}
        />

        <StatCard title="Closed Deals" value={wonLeads} />

        <StatCard title="Conversion Rate" value={`${conversionRate}%`} />
      </div>
      

   {/* QUICK ACTIONS */}
<div className="grid md:grid-cols-4 gap-6">

<Link
  href="/admin/add-car"
  className="bg-black text-white p-6 rounded-xl hover:opacity-90"
>
  <h2 className="font-bold text-lg">➕ Add Vehicle</h2>
  <p className="text-sm text-white/70 mt-2">
    Create a new inventory listing
  </p>
</Link>

<Link
  href="/admin/inventory"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🚗 Manage Inventory</h2>
  <p className="text-sm text-gray-500 mt-2">
    Edit vehicles, prices, photos and status
  </p>
</Link>

<Link
  href="/admin/add-part"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🔧 Add Part</h2>
  <p className="text-sm text-gray-500 mt-2">
    Add engines, transmissions, wheels and more
  </p>
</Link>

<Link
  href="/admin/parts"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🧰 Manage Parts</h2>
  <p className="text-sm text-gray-500 mt-2">
    Edit parts inventory and pricing
  </p>
</Link>

<Link
  href="/admin/leads"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">📞 Lead CRM</h2>
  <p className="text-sm text-gray-500 mt-2">
    Customer follow up and appointments
  </p>
</Link>

<Link
  href="/admin/vehicle-leads"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🚘 Vehicle Leads</h2>
  <p className="text-sm text-gray-500 mt-2">
    Sell Your Car submissions
  </p>
</Link>

<Link
  href="/admin/ebay"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🛒 eBay Tools</h2>
  <p className="text-sm text-gray-500 mt-2">
    Publish inventory to eBay
  </p>
</Link>

<Link
  href="/admin/photo-tools"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🖼️ Photo Tools</h2>
  <p className="text-sm text-gray-500 mt-2">
    Watermark and image tools
  </p>
</Link>

<Link
  href="/inventory"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🌐 Public Inventory</h2>
  <p className="text-sm text-gray-500 mt-2">
    Customer vehicle inventory
  </p>
</Link>

<Link
  href="/parts"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">🛍️ Public Parts</h2>
  <p className="text-sm text-gray-500 mt-2">
    Customer parts catalog
  </p>
</Link>

<Link
  href="/sell-your-car"
  className="bg-white border p-6 rounded-xl hover:bg-gray-100"
>
  <h2 className="font-bold text-lg">💰 Sell Your Car</h2>
  <p className="text-sm text-gray-500 mt-2">
    Test customer vehicle offers
  </p>
</Link>
<Link
  href="/admin/auction-center"
  className="border border-slate-900 rounded-xl p-6 hover:bg-gray-50 transition"
>
  <h3 className="text-lg font-bold">🏁 Auction Center</h3>
  <p className="text-sm text-gray-500 mt-2">
    Import and manage auction vehicles
  </p>
</Link>

</div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}