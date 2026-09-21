export const metadata = {
  title: "Privacy Policy | Drive Prime Motors",
  description:
    "How Drive Prime Motors LLC collects, uses, and protects information across driveprimemotorsllc.com and the Drive Prime Motors mobile app.",
};

const EFFECTIVE_DATE = "September 21, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-gray-700 leading-7">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">
          Legal
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-500">Effective {EFFECTIVE_DATE}</p>

        <p className="mt-6 text-gray-700 leading-7">
          This Privacy Policy explains how Drive Prime Motors LLC
          (&quot;Drive Prime Motors,&quot; &quot;we,&quot; &quot;us&quot;)
          collects, uses, and shares information through
          driveprimemotorsllc.com and the Drive Prime Motors mobile app
          (together, the &quot;Services&quot;).
        </p>

        <Section title="Information We Collect">
          <p>
            <strong>Contact and inquiry information.</strong> When you
            submit the Contact form, request an appointment, or ask about a
            vehicle, we collect your name, phone number, email address, and
            the message or vehicle details you provide.
          </p>
          <p>
            <strong>Account information.</strong> Creating a buyer/seller
            account (for &quot;Sell My Car&quot; listings, auctions, or
            in-app messaging) collects your email, name, phone number, and
            a securely hashed password — we never store your password in
            plain text. If you enable Face ID / Touch ID sign-in, the
            biometric scan itself stays on your device; we only store a
            device-bound credential reference, never the biometric data.
          </p>
          <p>
            <strong>Listing and auction content.</strong> If you list a
            vehicle for sale or auction, we collect the vehicle details,
            photos, video, description, and contact preferences you
            submit.
          </p>
          <p>
            <strong>Messages.</strong> If you use in-app messaging to
            contact a dealer or another seller about a vehicle, listing, or
            auction, we store the messages you send so the conversation can
            be delivered and displayed.
          </p>
          <p>
            <strong>Vehicle Identification Numbers (VINs).</strong> VINs
            you enter or scan are used to look up factory vehicle
            specifications and open safety recalls. When you scan a VIN
            with your camera, the photo is processed only to read the VIN
            text and is not retained afterward.
          </p>
          <p>
            <strong>Payment information.</strong> Paid marketplace listing
            fees are processed directly by Stripe, our payment processor.
            We never receive or store your full card number — only
            confirmation that a payment was completed.
          </p>
          <p>
            <strong>Technical information.</strong> Like most websites and
            apps, our servers log standard technical information (such as
            IP address and request timing) used for security and to
            prevent abuse (for example, rate-limiting repeated requests).
          </p>
        </Section>

        <Section title="How We Use Information">
          <ul className="list-disc space-y-2 pl-5">
            <li>Respond to inquiries, appointment requests, and messages</li>
            <li>Create and secure your account, and let you sign back in</li>
            <li>Publish and manage vehicle listings and auctions you submit</li>
            <li>Decode VINs and check for open safety recalls</li>
            <li>Process paid listing and featured-listing fees</li>
            <li>Send transactional emails and text messages you&apos;d expect — appointment confirmations, account verification, password resets, and one-time sign-in codes</li>
            <li>Detect and prevent abuse, fraud, and spam</li>
          </ul>
          <p>
            We do not use your information for automated marketing
            profiling, and we do not sell your personal information to
            data brokers or third-party advertisers.
          </p>
        </Section>

        <Section title="How We Share Information">
          <p>
            We share information only as needed to operate the Services,
            with these service providers:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Stripe</strong> — payment processing for paid listings</li>
            <li><strong>Twilio</strong> — text message delivery (appointment confirmations, verification codes)</li>
            <li><strong>Cloudinary</strong> — hosting for photos and video you upload</li>
            <li><strong>OpenAI</strong> — reads the VIN text out of a scanned photo; the photo itself is not retained by us or, to our knowledge, used to train any model</li>
            <li><strong>NHTSA (National Highway Traffic Safety Administration)</strong> — the U.S. government&apos;s public vPIC and recalls database, used to decode VINs and check for open recalls</li>
            <li><strong>Email delivery infrastructure</strong> — used to send the transactional emails described above</li>
          </ul>
          <p>
            If you list a vehicle we choose to feature on our own Facebook
            page, only the vehicle&apos;s public listing details (price,
            photos, description) are posted — never your personal contact
            information beyond what you&apos;ve chosen to make public on
            the listing itself.
          </p>
          <p>
            We may also disclose information if required by law, or to
            protect the rights, property, or safety of Drive Prime Motors,
            our users, or the public.
          </p>
        </Section>

        <Section title="Data Retention and Account Deletion">
          <p>
            You can permanently delete your buyer/seller account at any
            time from within the mobile app (Sell → Account → Delete
            Account). Deleting your account immediately hides any listings
            or auctions you own from public view, signs you out of every
            device, and removes your personal information (name, email,
            phone) from the account record.
          </p>
          <p>
            Some records — such as payment records, moderation history,
            and security audit logs — are retained after account deletion
            as required for accounting, legal, and fraud-prevention
            purposes, but are no longer tied to an account you can access
            or control.
          </p>
        </Section>

        <Section title="Your Choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>You can review and update your account details, or delete your account, at any time from the app.</li>
            <li>You can decline to grant camera, photo library, or Face ID / Touch ID permissions — the app remains usable for browsing inventory; only vehicle photo capture, VIN scanning, and biometric sign-in require them.</li>
            <li>Text messages we send for verification and appointment purposes include opt-out instructions where applicable.</li>
          </ul>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The Services are not directed to children under 13, and we do
            not knowingly collect personal information from children under
            13.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Passwords are stored using industry-standard one-way hashing —
            never in plain text. Sign-in sessions use secure, HTTP-only
            cookies, and every password reset, account freeze/suspension,
            or deletion immediately revokes all active sessions on every
            device. No method of transmission or storage is 100% secure,
            but we work to protect your information using these and other
            reasonable safeguards.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The
            &quot;Effective&quot; date above reflects the last update. We
            encourage you to review this page periodically.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            Questions about this Privacy Policy or your information can be
            sent to{" "}
            <a href="mailto:sales@driveprimemotors.com" className="font-bold text-red-600 hover:text-red-700">
              sales@driveprimemotors.com
            </a>{" "}
            or by calling{" "}
            <a href="tel:+19162618880" className="font-bold text-red-600 hover:text-red-700">
              (916) 261-8880
            </a>
            .
          </p>
          <p className="text-sm text-gray-500">
            Drive Prime Motors LLC — Rancho Cordova, California
          </p>
        </Section>
      </div>
    </div>
  );
}
