import Image from "next/image";
import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="bg-gradient-to-b from-black to-gray-900 text-white">

      <div className="max-w-6xl mx-auto px-6 py-24 text-center">

        {/* BIG LOGO */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Drive Prime Motors"
            width={160}
            height={160}
            priority
          />
        </div>

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Drive Prime Motors LLC
        </h1>

        {/* SUBTITLE */}
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
          Quality used vehicles in California. Fast financing approvals,
          transparent pricing, and a dealership you can trust.
        </p>

        {/* BUTTONS */}
        <div className="flex justify-center gap-4">
          <Link
            href="/inventory"
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold"
          >
            Browse Inventory
          </Link>

          <Link
            href="/financing"
            className="border border-gray-400 px-6 py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Apply for Financing
          </Link>
        </div>

      </div>
    </section>
  );
}

