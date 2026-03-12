
const isDev = process.env.NODE_ENV === "development";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight hover:opacity-80 transition"
        >
          Drive Prime Motors
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          <Link href="/inventory" className="hover:text-black transition">
            Inventory
          </Link>
          <Link href="/marketplace" className="hover:text-black transition">
            Marketplace
          </Link>
          <Link href="/sell-your-car" className="hover:text-black transition">
            Sell Your Car
          </Link>
          <Link href="/financing" className="hover:text-black transition">
            Financing
          </Link>
          <Link href="/contact" className="hover:text-black transition">
            Contact
          </Link>
        </nav>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <Link
            href="/sell-your-car"
            className="rounded-full bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 transition"
          >
            List Your Car
          </Link>

          {isDev && (
  <Link
    href="/admin"
    className="rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
  >
    Admin
  </Link>
)}
        </div>
      </div>
    </header>
  );
}
