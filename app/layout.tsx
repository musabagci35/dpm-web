import "./globals.css";
import Providers from "@/components/Providers";
import SiteChrome from "@/components/SiteChrome";

export const metadata = {
  metadataBase: new URL("https://driveprimemotorsllc.com"),

  title: {
    default: "Used Cars for Sale in Sacramento | Drive Prime Motors",
    template: "%s | Drive Prime Motors",
  },

  description:
    "Drive Prime Motors LLC offers quality pre-owned vehicles, financing options, trade-ins, and auto parts in the Sacramento and Rancho Cordova area.",

  keywords: [
    "used cars Sacramento",
    "used cars Rancho Cordova",
    "Drive Prime Motors",
    "Sacramento used car dealer",
    "car financing Sacramento",
    "sell my car Sacramento",
    "auto parts Sacramento",
  ],

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "Used Cars for Sale in Sacramento | Drive Prime Motors",
    description:
      "Quality pre-owned vehicles, financing options, trade-ins, and auto parts serving Sacramento and Rancho Cordova.",
    url: "https://driveprimemotorsllc.com",
    siteName: "Drive Prime Motors",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Drive Prime Motors",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-900">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
