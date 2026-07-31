import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Caps, stickers och kläder från Sanshō Ramen.",
  openGraph: {
    title: "Shop – Sanshō Ramen",
    description: "Caps, stickers och kläder från Sanshō Ramen.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
