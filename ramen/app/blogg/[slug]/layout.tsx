import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabaseServer
    .from("posts")
    .select("title, excerpt, cover_image_url")
    .eq("slug", slug)
    .single();

  if (!post) return { title: "Blogg" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url, width: 1200, height: 630 }] : [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
  };
}

export default function BloggSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
