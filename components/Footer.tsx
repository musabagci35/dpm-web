import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-xl font-black">Drive Prime Motors LLC</h3>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Quality pre-owned vehicles, transparent pricing, financing
              options, and trade-in assistance serving Sacramento and Rancho
              Cordova.
            </p>

            <div className="mt-5">
              <a
                href="tel:+19162618880"
                className="font-black text-red-400 hover:text-red-300"
              >
                (916) 261-8880
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-black uppercase tracking-wide">
              Inventory
            </h4>

            <ul className="space-y-3 text-zinc-400">
              <li>
                <Link href="/inventory" className="hover:text-white">
                  Browse Vehicles
                </Link>
              </li>
              <li>
                <Link href="/financing" className="hover:text-white">
                  Financing
                </Link>
              </li>
              <li>
                <Link href="/sell-your-car" className="hover:text-white">
                  Sell Your Car
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-black uppercase tracking-wide">
              Services
            </h4>

            <ul className="space-y-3 text-zinc-400">
              <li>
                <Link href="/parts" className="hover:text-white">
                  Auto Parts
                </Link>
              </li>
              <li>
                <Link href="/vin-report" className="hover:text-white">
                  VIN Reports
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-black uppercase tracking-wide">
              Location
            </h4>

            <div className="space-y-3 text-sm text-zinc-400">
              <p>Rancho Cordova, California</p>
              <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
              <p>Saturday: By Appointment</p>
              <p>Sunday: Closed</p>

              <a
                href="mailto:sales@driveprimemotors.com"
                className="block hover:text-white"
              >
                sales@driveprimemotors.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm text-zinc-500 md:flex-row">
          <p>
            © {new Date().getFullYear()} Drive Prime Motors LLC. All Rights
            Reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/financing" className="hover:text-white">
              Financing
            </Link>
            <Link href="/inventory" className="hover:text-white">
              Inventory
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
