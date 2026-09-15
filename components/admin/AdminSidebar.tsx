"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  PlusCircle,
  CheckCircle2,
  Gavel,
  Users,
  MessageSquare,
  HandCoins,
  CreditCard,
  Wrench,
  Megaphone,
  FileSearch,
  Settings,
  ExternalLink,
} from "lucide-react";
import LogoutButton from "./LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
  matchQuery?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Inventory",
    items: [
      {
        href: "/admin/inventory?status=all",
        label: "All Vehicles",
        icon: Car,
        matchQuery: "status=all",
      },
      {
        href: "/admin/inventory?status=sold",
        label: "Sold Vehicles",
        icon: CheckCircle2,
        matchQuery: "status=sold",
      },
      { href: "/admin/add-car", label: "Add Vehicle", icon: PlusCircle },
      { href: "/admin/auction-center", label: "Auction Center", icon: Gavel },
    ],
  },
  {
    label: "Leads & Customers",
    items: [
      { href: "/admin/leads", label: "Leads", icon: Users },
      { href: "/admin/vehicle-leads", label: "Sell / Trade Leads", icon: MessageSquare },
      { href: "/admin/offers", label: "Offers", icon: HandCoins },
    ],
  },
  {
    label: "Sales Tools",
    items: [
      { href: "/financing", label: "Financing", icon: CreditCard, external: true },
      { href: "/admin/parts", label: "Parts", icon: Wrench },
      { href: "/admin/marketing", label: "Marketing Center", icon: Megaphone },
      { href: "/admin/vin-reports", label: "VIN Reports", icon: FileSearch },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  return (
    <div className="flex h-full flex-col">
      <div className="hidden border-b p-5 lg:block">
        <p className="text-lg font-black text-gray-900">Drive Prime Motors</p>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Admin
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onNavigate}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                    </a>
                  );
                }

                const basePath = item.href.split("?")[0];
                const active =
                  pathname === basePath &&
                  currentQuery === (item.matchQuery || "");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-red-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <LogoutButton />
      </div>
    </div>
  );
}
