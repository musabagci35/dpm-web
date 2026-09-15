import Link from "next/link";
import {
  Car as CarIcon,
  Clock,
  CheckCircle2,
  Archive,
  Star,
  Users,
  MessageSquare,
  HandCoins,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Megaphone,
} from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Lead from "@/models/Lead";
import VehicleLead from "@/models/VehicleLead";
import Offer from "@/models/Offer";

type Activity = {
  type: "lead" | "vehicle-lead" | "offer";
  title: string;
  subtitle: string;
  href: string;
  createdAt: Date;
};

export default async function Dashboard() {
  await connectDB();

  const [
    activeCars,
    pendingCars,
    soldCars,
    archivedCars,
    featuredCars,
    activeCarDocs,
    totalLeads,
    newLeads,
    totalVehicleLeads,
    newVehicleLeads,
    pendingOffers,
    recentLeads,
    recentVehicleLeads,
    recentOffers,
  ] = await Promise.all([
    Car.countDocuments({ status: "available" }),
    Car.countDocuments({ status: "pending" }),
    Car.countDocuments({ status: "sold" }),
    Car.countDocuments({ status: "archived" }),
    Car.countDocuments({ isFeatured: true }),
    Car.find({ status: { $ne: "archived" } })
      .select("price cost recon docFee expectedProfit status")
      .lean(),
    Lead.countDocuments(),
    Lead.countDocuments({ status: "new" }),
    VehicleLead.countDocuments(),
    VehicleLead.countDocuments({ status: "new" }),
    Offer.countDocuments({ status: "pending" }),
    Lead.find().sort({ createdAt: -1 }).limit(5).lean(),
    VehicleLead.find().sort({ createdAt: -1 }).limit(5).lean(),
    Offer.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const inventoryValue = activeCarDocs
    .filter((car: any) => car.status !== "sold")
    .reduce((sum: number, car: any) => sum + Number(car.price || 0), 0);

  const estimatedProfit = activeCarDocs.reduce((sum: number, car: any) => {
    const price = Number(car.price || 0);
    const cost = Number(car.cost || 0);
    const recon = Number(car.recon || 0);
    const docFee = Number(car.docFee || 0);
    const profit = price - cost - recon - docFee;
    return sum + Math.max(profit, 0);
  }, 0);

  const activity: Activity[] = [
    ...recentLeads.map((lead: any) => ({
      type: "lead" as const,
      title: lead.name || "New lead",
      subtitle: lead.carTitle || lead.message?.slice(0, 60) || "Website inquiry",
      href: "/admin/leads",
      createdAt: lead.createdAt,
    })),
    ...recentVehicleLeads.map((lead: any) => ({
      type: "vehicle-lead" as const,
      title: lead.name || "Sell / trade submission",
      subtitle: `${lead.year || ""} ${lead.make || ""} ${lead.model || ""}`.trim() || "Vehicle details pending",
      href: "/admin/vehicle-leads",
      createdAt: lead.createdAt,
    })),
    ...recentOffers.map((offer: any) => ({
      type: "offer" as const,
      title: offer.buyerName || "New offer",
      subtitle: `Offered $${Number(offer.amount || 0).toLocaleString()}`,
      href: "/admin/offers",
      createdAt: offer.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Drive Prime Motors business overview</p>
      </div>

      <SectionLabel>Inventory</SectionLabel>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={CarIcon}
          label="Available"
          value={activeCars}
          accent="text-green-600 bg-green-100"
          href="/admin/inventory"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingCars}
          accent="text-amber-600 bg-amber-100"
          href="/admin/inventory?status=pending"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sold"
          value={soldCars}
          accent="text-red-600 bg-red-100"
          href="/admin/inventory?status=sold"
        />
        <StatCard
          icon={Archive}
          label="Archived"
          value={archivedCars}
          accent="text-gray-600 bg-gray-200"
          href="/admin/inventory?status=archived"
        />
        <StatCard
          icon={Star}
          label="Featured"
          value={featuredCars}
          accent="text-blue-600 bg-blue-100"
          href="/admin/inventory?status=all"
        />
      </div>

      <SectionLabel>Leads &amp; Customers</SectionLabel>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Leads" value={totalLeads} accent="text-red-600 bg-red-100" href="/admin/leads" />
        <StatCard icon={Users} label="New Leads" value={newLeads} accent="text-amber-600 bg-amber-100" href="/admin/leads" />
        <StatCard icon={MessageSquare} label="Sell / Trade Inquiries" value={totalVehicleLeads} accent="text-blue-600 bg-blue-100" href="/admin/vehicle-leads" />
        <StatCard icon={HandCoins} label="Pending Offers" value={pendingOffers} accent="text-green-600 bg-green-100" href="/admin/offers" />
      </div>

      <SectionLabel>Business</SectionLabel>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={DollarSign} label="Inventory Value" value={`$${inventoryValue.toLocaleString()}`} accent="text-gray-700 bg-gray-100" />
        <StatCard icon={TrendingUp} label="Estimated Profit" value={`$${estimatedProfit.toLocaleString()}`} accent="text-green-600 bg-green-100" />
        <StatCard icon={MessageSquare} label="New Sell/Trade Leads" value={newVehicleLeads} accent="text-blue-600 bg-blue-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickAction
              href="/admin/add-car"
              icon={PlusCircle}
              title="Add Vehicle"
              text="Create a new inventory listing"
              dark
            />
            <QuickAction
              href="/admin/inventory"
              icon={CarIcon}
              title="Manage Inventory"
              text="Edit vehicles, prices, photos and status"
            />
            <QuickAction
              href="/admin/marketing"
              icon={Megaphone}
              title="Marketing Center"
              text="Publish and distribute vehicle listings"
            />
            <QuickAction
              href="/admin/leads"
              icon={Users}
              title="Leads"
              text="Follow up with customers"
            />
          </div>
        </div>

        <div>
          <SectionLabel>Recent Activity</SectionLabel>
          <div className="rounded-2xl border bg-white p-2 shadow-sm">
            {activity.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No recent activity yet.</p>
            ) : (
              <ul className="divide-y">
                {activity.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          item.type === "lead"
                            ? "bg-red-100 text-red-600"
                            : item.type === "vehicle-lead"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {item.type === "lead" && <Users className="h-4 w-4" aria-hidden="true" />}
                        {item.type === "vehicle-lead" && <MessageSquare className="h-4 w-4" aria-hidden="true" />}
                        {item.type === "offer" && <HandCoins className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-gray-900">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {item.subtitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
  href?: string;
}) {
  const content = (
    <>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-2xl border bg-white p-5 shadow-sm">{content}</div>;
}

function QuickAction({
  href,
  icon: Icon,
  title,
  text,
  dark = false,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-5 shadow-sm transition ${
        dark
          ? "bg-black text-white hover:bg-zinc-800"
          : "border bg-white hover:border-red-300 hover:shadow-md"
      }`}
    >
      <Icon
        className={`h-6 w-6 ${dark ? "text-red-400" : "text-red-600"}`}
        aria-hidden="true"
      />
      <h2 className="mt-3 font-bold">{title}</h2>
      <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-gray-500"}`}>
        {text}
      </p>
    </Link>
  );
}
