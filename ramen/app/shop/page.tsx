"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; --r:100px; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; }
  .page-wrap { padding:120px 80px 80px; max-width:1100px; margin:0 auto; width:100%; }
  .page-tag { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  .page-title { font-weight:700; font-size:52px; letter-spacing:0.06em; margin-bottom:16px; }
  .page-sub { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:56px; max-width:480px; }
  .products-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .product-card { border:1.5px solid #DDD8CE; border-radius:16px; overflow:hidden; transition:transform 0.15s, box-shadow 0.15s; }
  .product-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.08); }
  .product-img { aspect-ratio:1; background:#E8E3D8; display:flex; align-items:center; justify-content:center; font-size:56px; }
  .product-body { padding:20px 24px 24px; }
  .product-cat { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
  .product-name { font-weight:700; font-size:18px; letter-spacing:0.03em; margin-bottom:8px; }
  .product-desc { font-size:13px; color:var(--muted); line-height:1.7; margin-bottom:20px; }
  .product-footer { display:flex; justify-content:space-between; align-items:center; }
  .product-price { font-size:18px; font-weight:700; }
  .buy-btn { background:var(--ink); color:var(--bg); border:none; padding:11px 22px; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:opacity 0.2s; }
  .buy-btn:hover { opacity:0.82; }
  .buy-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .empty-state { text-align:center; padding:80px 0; color:var(--muted); }
  @media(max-width:900px){ .products-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:600px){ .page-wrap{padding:100px 24px 60px;} .page-title{font-size:36px;} .products-grid{grid-template-columns:1fr;} }
`;

type Product = { id: number; name: string; description: string; price: number; image_url: string; category: string; active: boolean; };

const EMOJIS: Record<string, string> = {
  Headwear: "🧢", Accessories: "🎉", Kläder: "👕",
};

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("products").select("*").eq("active", true).order("id").then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const buy = async (product: Product) => {
    setLoading(product.id);
    const res = await fetch("/api/shop-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name: product.name, quantity: 1 }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(null);
  };

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        <p className="page-tag">Merch</p>
        <h1 className="page-title">Shop.</h1>
        <p className="page-sub">Caps, stickers and clothes from Sanshō Ramen. Wear the brand with pride.</p>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products right now — check back soon.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-img">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span>{EMOJIS[p.category] || "🍜"}</span>
                  }
                </div>
                <div className="product-body">
                  <p className="product-cat">{p.category}</p>
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-footer">
                    <span className="product-price">{p.price} kr</span>
                    <button className="buy-btn" onClick={() => buy(p)} disabled={loading === p.id}>
                      {loading === p.id ? "..." : "Buy →"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
