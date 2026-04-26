"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { use } from "react";

type Post = {
  id: number;
  created_at: string;
  title: string;
  slug: string;
  tag: string;
  excerpt: string;
  content: string;
  published: boolean;
};

export default function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("published", true).single();
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #F5F1E8; --ink: #1D1D1D; --ink-light: #6B6560; }
        body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }
        nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); }
        .nav-logo img { height: 32px; cursor: pointer; }
        .article { max-width: 680px; margin: 0 auto; padding: 140px 48px 80px; }
        .article-tag { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 16px; }
        .article-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 42px; letter-spacing: 0.05em; line-height: 1.2; margin-bottom: 16px; }
        .article-date { font-size: 13px; color: var(--ink-light); margin-bottom: 48px; }
        .article-content { font-size: 16px; line-height: 1.9; white-space: pre-wrap; }
        .back-btn { background: none; border: 1.5px solid var(--ink); padding: 10px 20px; border-radius: 100px; font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; color: var(--ink); margin-bottom: 48px; display: inline-block; text-decoration: none; transition: all 0.2s; }
        .back-btn:hover { background: var(--ink); color: var(--bg); }
        @media (max-width: 768px) { nav { padding: 20px 24px; } .article { padding: 100px 24px 60px; } .article-title { font-size: 28px; } }
      `}</style>
      <nav>
        <a href="/" className="nav-logo"><img src="/logotype.png" alt="Sanshō" /></a>
      </nav>
      <div className="article">
        {loading && <p style={{ color: "#6B6560" }}>Laddar...</p>}
        {!loading && !post && <p style={{ color: "#6B6560" }}>Inlägget hittades inte.</p>}
        {!loading && post && (
          <>
            <a href="/#blogg" className="back-btn">← Tillbaka till bloggen</a>
            <div className="article-tag">{post.tag}</div>
            <h1 className="article-title">{post.title}</h1>
            <div className="article-date">{new Date(post.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div className="article-content">{post.content}</div>
          </>
        )}
      </div>
    </>
  );
}