import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CompareProvider } from "@/components/CompareContext";
import FloatingCompareBar from "@/components/FloatingCompareBar";
import Navbar from "@/components/Navbar"

export const metadata = {
  title: "Drive Prime Motors LLC | Quality Used Cars in California",
  description:
    "Browse quality used vehicles at Drive Prime Motors LLC. Easy financing, transparent pricing, and trusted service in California.",

  keywords: [
    "used cars California",
    "Sacramento used cars",
    "Drive Prime Motors",
    "car dealership California",
    "auto financing",
  ],

  openGraph: {
    title: "Drive Prime Motors LLC",
    description:
      "Quality used vehicles with easy financing options.",
    url: "https://driveprimemotorsllc.com",
    siteName: "Drive Prime Motors LLC",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900">

        <CompareProvider>

          {/* NAVBAR */}
          <Navbar />

          {/* PAGE CONTENT */}
          <main className="flex-1">
            {children}
          </main>

          {/* FOOTER */}
          <Footer />
          <FloatingCompareBar />

        </CompareProvider>

      </body>

    </html>
  );
}