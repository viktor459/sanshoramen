import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Sign up for the Sanshō Ramen newsletter and get access to pop-up bookings and news before we announce on social media.",
  alternates: { canonical: "https://sanshoramen.se/newsletter" },
  openGraph: {
    title: "Newsletter – Sanshō Ramen",
    description: "Get access to pop-up bookings and news before we announce on social media.",
    url: "https://sanshoramen.se/newsletter",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
};

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
