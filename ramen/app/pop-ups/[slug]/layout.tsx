import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: event } = await supabaseServer
    .from("events")
    .select("title, description, date, location, image_url")
    .eq("slug", slug)
    .single();

  if (!event) return { title: "Event" };

  const title = event.title;
  const description = event.description
    ? event.description.substring(0, 155)
    : `Boka din plats på ${event.title} – ett exklusivt ramen pop-up i ${event.location || "Skåne"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.image_url ? [{ url: event.image_url, width: 1200, height: 630 }] : [{ url: "/og-default.jpg", width: 1200, height: 630 }],
      type: "website",
    },
  };
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
