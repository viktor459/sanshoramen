import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogg",
  description: "Nyheter, recept och tankar från Sanshō Ramen.",
  openGraph: {
    title: "Blogg – Sanshō Ramen",
    description: "Nyheter, recept och tankar från Sanshō Ramen.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
};

export default function BloggLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
