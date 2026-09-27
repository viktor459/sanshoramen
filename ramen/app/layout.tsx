import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "./GoogleAnalytics";
import CookieConsent from "./CookieConsent";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Sanshō Ramen – Ramen bar in Lund & pop-ups in Skåne",
    template: "%s – Sanshō Ramen",
  },
  description: "High quality ramen in Skåne. Visit our ramen bar at Saluhallen Lund (October–December) or book a spot at one of our exclusive pop-ups.",
  icons: {
    icon: "/logotype.png",
    apple: "/logotype.png",
  },
  openGraph: {
    siteName: "Sanshō Ramen",
    locale: "sv_SE",
    type: "website",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  verification: {
    google: "XDSNJZ2xB_iaofck2FEyMZSbu0WYCUDN7sJXZpGUHfA",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#F5F1E8", fontFamily: "'Quicksand', sans-serif" }}>
        <Nav />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <GoogleAnalytics />
        <CookieConsent />
      </body>
    </html>
  );
}
