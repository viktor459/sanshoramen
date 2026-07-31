import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pop-ups",
  description: "Kommande ramen pop-ups i Skåne. Boka din plats och upplev ramen på hög nivå i unika miljöer.",
  openGraph: {
    title: "Pop-ups – Sanshō Ramen",
    description: "Kommande ramen pop-ups i Skåne. Boka din plats och upplev ramen på hög nivå i unika miljöer.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
};

export default function PopUpsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
