import Link from "next/link";

export const metadata = {
  title: "Support | Drive Prime Motors",
  description:
    "Get help with Drive Prime Motors — vehicle inquiries, your account, in-app messaging, listings and auctions, and VIN scanning.",
};

function HelpTopic({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-gray-900">{title}</h3>
      <div className="mt-2 space-y-2 text-gray-700 leading-6">{children}</div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-zinc-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-400">
            Support
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            How can we help?
          </h1>
          <p className="mt-4 max-w-xl text-white/70 leading-7">
            Reach a real person for anything about a vehicle, your account,
            or the Drive Prime Motors app — or check the common topics
            below first.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="tel:+19162618880"
              className="rounded-2xl bg-red-600 px-6 py-5 text-center font-black hover:bg-red-700"
            >
              Call (916) 261-8880
            </a>
            <a
              href="mailto:sales@driveprimemotors.com"
              className="rounded-2xl border border-white/20 px-6 py-5 text-center font-black hover:bg-white hover:text-black"
            >
              sales@driveprimemotors.com
            </a>
          </div>

          <div className="mt-6 text-sm text-white/60">
            <p>Mon – Fri: 9:00 AM – 6:00 PM</p>
            <p>Saturday: By Appointment</p>
            <p>Sunday: 10:00 AM – 5:00 PM</p>
            <p className="mt-1">Rancho Cordova, California</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-2xl font-black text-gray-900">Common topics</h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <HelpTopic title="Signing in or resetting your password">
            <p>
              Use &quot;Forgot Password&quot; on the sign-in screen, or
              sign in with a one-time text code if you&apos;ve verified a
              phone number. Still stuck? Contact us and we&apos;ll help
              verify your account.
            </p>
          </HelpTopic>

          <HelpTopic title="Deleting your account">
            <p>
              In the mobile app: Sell → Account → Delete Account. You&apos;ll
              be asked to confirm and re-enter your password — this
              immediately hides any listings or auctions you own and signs
              you out everywhere. This can&apos;t be undone from the app,
              so contact us first if you&apos;re not sure.
            </p>
          </HelpTopic>

          <HelpTopic title="Messaging a dealer or seller">
            <p>
              Sign in, then use &quot;Message Dealer&quot; on a vehicle
              page or &quot;Message Seller&quot; on a live marketplace
              listing or auction. Conversations and unread messages are
              under Sell → Messages.
            </p>
          </HelpTopic>

          <HelpTopic title="Listing or auctioning your vehicle">
            <p>
              &quot;Sell My Car&quot; lets you list a vehicle for a flat
              fee or start an auction. If your listing was rejected or you
              have a billing question about a listing fee, contact us with
              your listing details.
            </p>
          </HelpTopic>

          <HelpTopic title="Scanning a VIN">
            <p>
              The in-app VIN scanner reads a VIN from your camera to
              decode factory specifications and check for open safety
              recalls. If it won&apos;t read a VIN, you can always type it
              in manually instead.
            </p>
          </HelpTopic>

          <HelpTopic title="Vehicle inquiries and appointments">
            <p>
              Call, message a vehicle directly, or use the{" "}
              <Link href="/contact" className="font-bold text-red-600 hover:text-red-700">
                Contact page
              </Link>{" "}
              to request an appointment or more information — we&apos;ll
              follow up to confirm a time.
            </p>
          </HelpTopic>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          See also our{" "}
          <Link href="/privacy" className="font-bold text-red-600 hover:text-red-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
