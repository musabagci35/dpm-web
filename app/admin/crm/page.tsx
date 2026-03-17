import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import LeadsBoard from "@/components/LeadsBoard";

export default async function CRMPage() {

  await connectDB();

  const leads = await Lead.find({})
    .sort({ createdAt: -1 })
    .lean();

  const safeLeads = leads.map((lead: any) => ({
    ...lead,
    _id: lead._id.toString(),
  }));

  return (

    <div className="mx-auto max-w-7xl px-6 py-10">

      <h1 className="text-3xl font-bold mb-6">
        Dealer CRM Board
      </h1>

      <LeadsBoard leads={safeLeads} />

    </div>

  );
}