import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import LeadsTable from "@/components/LeadsTable";

export default async function AdminLeadsPage() {

  await connectDB();

  const leads = await Lead.find({})
    .sort({ createdAt: -1 })
    .lean();

  const safeLeads = leads.map((lead: any) => ({
    ...lead,
    _id: lead._id.toString(),
    dealerId: lead.dealerId?.toString?.() || "",
    carId: lead.carId?.toString?.() || "",
  }));

  return (

    <div className="mx-auto max-w-7xl px-6 py-10">

      <h1 className="text-3xl font-bold">
        Dealer CRM
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        Manage customer inquiries and track deal status.
      </p>

      <div className="mt-6">
        <LeadsTable leads={safeLeads} />
      </div>

    </div>

  );
}