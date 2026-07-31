import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "./GoogleAnalytics";
import CookieConsent from "./CookieConsent";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Sanshō Ramen – Pop-ups in Skåne",
    template: "%s – Sanshō Ramen",
  },
  description: "Exclusive ramen pop-ups in Skåne. Book your spot and experience high quality ramen in unique venues.",
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
