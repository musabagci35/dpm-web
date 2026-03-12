import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-16">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 md:grid-cols-3 text-sm">

        {/* BRAND */}
        <div>
          <h3 className="font-bold text-gray-900">
            Drive Prime Motors LLC
          </h3>

          <p className="mt-2 text-gray-500">
            Quality pre-owned vehicles in California. 
            Easy financing and transparent pricing.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Quick Links
          </h4>

          <ul className="space-y-2 text-gray-500">

            <li>
              <Link href="/inventory" className="hover:text-red-600">
                Inventory
              </Link>
            </li>

            <li>
              <Link href="/financing" className="hover:text-red-600">
                Financing
              </Link>
            </li>

            <li>
              <Link href="/contact" className="hover:text-red-600">
                Contact
              </Link>
            </li>

          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">
            Contact
          </h4>

          <p className="text-gray-500">
            Sacramento, California
          </p>

          <a
            href="tel:+19162618880"
            className="text-gray-500 hover:text-red-600 block mt-1"
          >
            916-261-8880
          </a>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="border-t py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Drive Prime Motors LLC. All rights reserved.
      </div>
    </footer>
  );
}