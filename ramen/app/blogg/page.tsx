"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; }
  .page-wrap { padding:120px 80px 80px; max-width:1000px; margin:0 auto; width:100%; }
  .page-tag { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  .page-title { font-weight:700; font-size:52px; letter-spacing:0.06em; margin-bottom:56px; }
  .posts-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
  .post-card { border:1.5px solid #DDD8CE; border-radius:16px; padding:32px; transition:background 0.2s, transform 0.15s, border-color 0.2s; text-decoration:none; color:var(--ink); display:block; }
  .post-card:hover { background:var(--ink); color:var(--bg); border-color:var(--ink); transform:translateY(-3px); }
  .post-card:hover .pc-tag, .post-card:hover .pc-date, .post-card:hover .pc-excerpt { color:#aaa; }
  .pc-tag { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; transition:color 0.2s; }
  .pc-title { font-weight:700; font-size:22px; letter-spacing:0.03em; line-height:1.3; margin-bottom:12px; }
  .pc-excerpt { font-size:14px; color:var(--muted); line-height:1.8; margin-bottom:20px; transition:color 0.2s; }
  .pc-date { font-size:12px; color:var(--muted); transition:color 0.2s; }
  .post-card-featured { grid-column:span 2; display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; }
  .pf-content .pc-title { font-size:28px; margin-bottom:16px; }
  .pf-content .pc-excerpt { font-size:15px; }
  .pf-img { border-radius:8px; aspect-ratio:16/9; overflow:hidden; }
  .pf-img img { width:100%; height:100%; object-fit:cover; }
  .pf-img-placeholder { width:100%; height:100%; background:#E0DBD0; display:flex; align-items:center; justify-content:center; font-size:48px; }
  .empty-state { padding:80px 0; color:var(--muted); }
  .read-more { font-size:13px; font-weight:500; display:inline-flex; align-items:center; gap:4px; margin-top:8px; }
  @media(max-width:768px){ .page-wrap{padding:100px 24px 60px;} .page-title{font-size:36px;} .posts-grid{grid-template-columns:1fr;} .post-card-featured{grid-column:span 1; grid-template-columns:1fr;} .pf-img{display:none;} }
`;

type Post = { id: number; created_at: string; title: string; slug: string; tag: string; excerpt: string; published: boolean; };

export default function Blogg() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    supabase.from("posts").select("id,created_at,title,slug,tag,excerpt,published").eq("published", true).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setPosts(data);
    });
  }, []);

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        <p className="page-tag">Kunskap & Kultur</p>
        <h1 className="page-title">Blogg.</h1>
        {posts.length === 0 ? (
          <p className="empty-state">Inga inlägg publicerade än.</p>
        ) : (
          <div className="posts-grid">
            {posts.map((post, i) => {
              const dateStr = new Date(post.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
              if (i === 0) {
                return (
                  <a key={post.id} href={`/blogg/${post.slug}`} className="post-card post-card-featured">
                    <div className="pf-img">
                      <div className="pf-img-placeholder">🍜</div>
                    </div>
                    <div className="pf-content">
                      <div className="pc-tag">{post.tag || "Ramen"}</div>
                      <h2 className="pc-title">{post.title}</h2>
                      {post.excerpt && <p className="pc-excerpt">{post.excerpt}</p>}
                      <p className="pc-date">{dateStr}</p>
                      <p className="read-more">Läs mer →</p>
                    </div>
                  </a>
                );
              }
              return (
                <a key={post.id} href={`/blogg/${post.slug}`} className="post-card">
                  <div className="pc-tag">{post.tag || "Ramen"}</div>
                  <h2 className="pc-title">{post.title}</h2>
                  {post.excerpt && <p className="pc-excerpt">{post.excerpt}</p>}
                  <p className="pc-date">{dateStr}</p>
                  <p className="read-more">Läs mer →</p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
