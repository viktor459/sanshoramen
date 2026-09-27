import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: posts } = await supabaseServer.from("posts").select("slug, created_at").eq("published", true);
  return [
    { url: "https://sanshoramen.se", lastModified: new Date(), priority: 1 },
    { url: "https://sanshoramen.se/pop-ups", lastModified: new Date(), priority: 0.9 },
    { url: "https://sanshoramen.se/blogg", lastModified: new Date(), priority: 0.7 },
    ...(posts ?? []).map(p => ({ url: `https://sanshoramen.se/blogg/${p.slug}`, lastModified: new Date(p.created_at), priority: 0.6 })),
  ];
}
