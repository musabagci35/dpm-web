import "./globals.css";
import Footer from "../components/Footer";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Drive Prime Motors LLC",
  description:
    "Browse quality used vehicles at Drive Prime Motors LLC. Easy financing, transparent pricing, and trusted service in California.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900">

        <Navbar />

        <main className="flex-1">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}