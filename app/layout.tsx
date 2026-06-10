import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export const metadata = {
  metadataBase: new URL("https://driveprimemotors.com"),

  title: {
    default: "Drive Prime Motors",
    template: "%s | Drive Prime Motors",
  },

  description: "Premium used cars in California",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "Drive Prime Motors",
    description: "Premium used cars in California",
    url: "https://driveprimemotors.com",
    siteName: "Drive Prime Motors",
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
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-900">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}