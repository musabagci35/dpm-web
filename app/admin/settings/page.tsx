import { Building2, Phone, Mail, MapPin, Clock } from "lucide-react";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">Business information and account.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Business Information</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow icon={Building2} label="Business Name" value="Drive Prime Motors LLC" />
          <InfoRow icon={MapPin} label="Location" value="Sacramento / Rancho Cordova, CA" />
          <InfoRow icon={Phone} label="Phone" value="(916) 261-8880" />
          <InfoRow icon={Mail} label="Email" value="sales@driveprimemotors.com" />
          <InfoRow
            icon={Clock}
            label="Hours"
            value="Mon–Fri 9am–6pm · Sat by appointment · Sun 10am–5pm"
          />
        </div>

        <p className="mt-5 text-xs text-gray-400">
          These details are shown on the public website. To change them, contact
          your developer to update the site content.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-gray-900">Account</h2>
        <p className="mb-4 text-sm text-gray-500">
          You are signed in to the Drive Prime Motors admin dashboard.
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
