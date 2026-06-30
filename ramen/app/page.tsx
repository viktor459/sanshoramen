"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --bg: #F5F1E8; --ink: #1D1D1D; --muted: #6B6560; --r: 100px; }
  body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }

  /* HERO */
  .hero { min-height: 100vh; padding-top: 72px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; overflow: hidden; }
  .hero-left { padding: 60px 64px 60px 80px; display: flex; flex-direction: column; gap: 28px; }
  .hero-tag { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
  .hero-h1 { font-weight: 700; font-size: clamp(36px,4vw,58px); line-height: 1.1; letter-spacing: -0.01em; }
  .hero-sub { font-size: 16px; color: var(--muted); line-height: 1.8; max-width: 380px; }
  .hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .btn-dark { background: var(--ink); color: var(--bg); border: none; padding: 15px 28px; border-radius: var(--r); font-family: 'Quicksand', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: opacity 0.2s, transform 0.15s; }
  .btn-dark:hover { opacity: 0.82; transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--ink); border: 1.5px solid #ccc; padding: 14px 28px; border-radius: var(--r); font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: border-color 0.2s; }
  .btn-ghost:hover { border-color: var(--ink); }
  .hero-right { height: 100vh; overflow: hidden; display: flex; align-items: flex-end; justify-content: flex-end; }
  .hero-right img { width: 110%; max-width: 820px; object-fit: contain; transform: translateX(40px) translateY(20px); animation: floatIn 1.4s cubic-bezier(0.16,1,0.3,1) forwards; }
  @keyframes floatIn { from { opacity:0; transform:translateX(80px) translateY(40px); } to { opacity:1; transform:translateX(40px) translateY(20px); } }

  /* EVENTS TEASER */
  .events-section { padding: 100px 80px; }
  .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; }
  .section-title { font-weight: 700; font-size: 38px; letter-spacing: 0.03em; line-height: 1.2; }
  .see-all { font-size: 14px; color: var(--muted); text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
  .see-all:hover { color: var(--ink); }
  .events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .event-card { border: 1.5px solid #DDD8CE; border-radius: 16px; padding: 28px; transition: background 0.2s, transform 0.15s, border-color 0.2s; cursor: pointer; text-decoration: none; color: var(--ink); }
  .event-card:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); transform: translateY(-3px); }
  .event-card:hover .ec-meta, .event-card:hover .ec-price { color: #bbb; }
  .ec-date { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; transition: color 0.2s; }
  .event-card:hover .ec-date { color: #aaa; }
  .ec-title { font-weight: 700; font-size: 20px; letter-spacing: 0.04em; margin-bottom: 8px; }
  .ec-meta { font-size: 13px; color: var(--muted); line-height: 1.7; transition: color 0.2s; }
  .ec-price { font-size: 13px; color: var(--muted); margin-top: 16px; font-weight: 500; transition: color 0.2s; }
  .ec-spots { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .ec-bar { flex:1; max-width:80px; height:2px; background:#E0DBD0; border-radius:2px; }
  .ec-fill { height:2px; background:var(--ink); border-radius:2px; transition: background 0.2s; }
  .event-card:hover .ec-bar { background: #444; }
  .event-card:hover .ec-fill { background: #F5F1E8; }
  .no-events { color: var(--muted); font-size: 15px; padding: 40px 0; }

  /* NEWSLETTER */
  .newsletter-section { background: var(--ink); color: var(--bg); padding: 100px 80px; }
  .nl-inner { max-width: 560px; }
  .nl-tag { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; margin-bottom: 16px; }
  .nl-title { font-weight: 700; font-size: 38px; letter-spacing: 0.03em; line-height: 1.2; margin-bottom: 16px; }
  .nl-sub { font-size: 15px; color: #999; line-height: 1.8; margin-bottom: 36px; }
  .nl-form { display: flex; gap: 12px; max-width: 440px; }
  .nl-input { flex:1; background: transparent; border: 1.5px solid #333; border-radius: var(--r); padding: 14px 20px; font-family:'Quicksand',sans-serif; font-size: 14px; color: var(--bg); outline:none; transition:border-color 0.2s; }
  .nl-input::placeholder { color: #555; }
  .nl-input:focus { border-color: #666; }
  .nl-btn { background: var(--bg); color: var(--ink); border: none; padding: 14px 24px; border-radius: var(--r); font-family:'Quicksand',sans-serif; font-size: 14px; font-weight:500; cursor:pointer; white-space:nowrap; transition:opacity 0.2s; }
  .nl-btn:hover { opacity: 0.85; }
  .nl-success { font-size:14px; color:#aaa; margin-top:16px; }

  /* ABOUT */
  .about-section { padding: 100px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
  .about-text .section-title { margin-bottom: 24px; }
  .about-text p { font-size: 15px; color: var(--muted); line-height: 1.9; margin-bottom: 16px; }
  .about-img { border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; }
  .about-img img { width:100%; height:100%; object-fit:cover; display:block; }

  /* SOCIAL */
  .social-section { background: var(--ink); color: var(--bg); padding: 80px; text-align: center; }
  .social-section h2 { font-weight:700; font-size:44px; letter-spacing:0.06em; margin-bottom:8px; }
  .social-section p { font-size:15px; color:#888; margin-bottom:40px; }
  .social-icons { display:flex; justify-content:center; gap:16px; flex-wrap:wrap; }
  .social-link { display:flex; align-items:center; gap:10px; color:var(--bg); text-decoration:none; border:1.5px solid #2a2a2a; border-radius:var(--r); padding:13px 22px; font-size:14px; font-weight:500; transition:border-color 0.2s, background 0.2s; }
  .social-link:hover { border-color:#555; background:rgba(255,255,255,0.04); }
  .social-link svg { width:16px; height:16px; fill:currentColor; flex-shrink:0; }

  @media(max-width:1024px){ .events-grid{grid-template-columns:1fr 1fr;} }
  @media(max-width:768px){
    .hero{grid-template-columns:1fr; min-height:auto;}
    .hero-left{padding:40px 24px 32px; gap:20px;}
    .hero-h1{font-size:36px;}
    .hero-right{height:260px;}
    .hero-right img{width:100%; transform:translateX(20px) translateY(10px);}
    .events-section,.about-section,.social-section{padding:60px 24px;}
    .newsletter-section{padding:60px 24px;}
    .events-grid{grid-template-columns:1fr;}
    .about-section{grid-template-columns:1fr;}
    .section-header{flex-direction:column; align-items:flex-start; gap:12px;}
    .social-section h2{font-size:32px;}
    .nl-form{flex-direction:column;}
    .nl-btn{width:100%;}
  }
`;

type Event = { id: number; title: string; date: string; time: string; location: string; spots: number; spots_left: number; price: number; active: boolean; };

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [email, setEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    supabase.from("events").select("*").eq("active", true).order("id").then(({ data }) => {
      if (data) setEvents(data.slice(0, 3));
    });
  }, []);

  const subscribe = async () => {
    if (!email.includes("@")) return;
    setNlStatus("loading");
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (res.ok) { setNlStatus("done"); setEmail(""); }
    else setNlStatus(data.error === "Du är redan anmäld!" ? "done" : "error");
  };

  return (
    <>
      <style>{S}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">Ramen pop-ups in Skåne</p>
          <h1 className="hero-h1">High quality ramen. Exclusive evenings.</h1>
          <p className="hero-sub">We take over restaurants and bars for a night and serve ramen at a high level. Every event is unique — the menu and venue change every time.</p>
          <div className="hero-cta">
            <a href="/pop-ups" className="btn-dark">See upcoming pop-ups →</a>
            <a href="#om" className="btn-ghost">About us</a>
          </div>
        </div>
        <div className="hero-right">
          <img src="/illustration.png" alt="Sanshō Ramen" />
        </div>
      </section>

      {/* EVENTS TEASER */}
      <section className="events-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming pop-ups.</h2>
          <a href="/pop-ups" className="see-all">See all events →</a>
        </div>
        {events.length === 0 ? (
          <p className="no-events">No upcoming pop-ups right now — sign up for the newsletter to be the first to know.</p>
        ) : (
          <div className="events-grid">
            {events.map(ev => {
              const pct = ((ev.spots - ev.spots_left) / ev.spots) * 100;
              const full = ev.spots_left <= 0;
              return (
                <a key={ev.id} href={full ? undefined : "/pop-ups"} className="event-card" style={full ? { opacity: 0.5, cursor: "default", pointerEvents: "none" } : {}}>
                  <div className="ec-date">{ev.date}</div>
                  <div className="ec-title">{ev.title}</div>
                  <div className="ec-meta">{ev.location}{ev.time ? ` · ${ev.time}` : ""}</div>
                  <div className="ec-price">{ev.price} kr / person</div>
                  <div className="ec-spots">
                    <div className="ec-bar"><div className="ec-fill" style={{ width: `${pct}%` }} /></div>
                    <span style={{ fontSize: 12 }}>{full ? "Sold out" : `${ev.spots_left} spots left`}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-section">
        <div className="nl-inner">
          <p className="nl-tag">Newsletter</p>
          <h2 className="nl-title">Know first.</h2>
          <p className="nl-sub">Subscribers get access to bookings and news before we announce on social media.</p>
          {nlStatus === "done" ? (
            <p className="nl-success">✓ You're in — welcome!</p>
          ) : (
            <>
              <div className="nl-form">
                <input className="nl-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && subscribe()} />
                <button className="nl-btn" onClick={subscribe} disabled={nlStatus === "loading"}>
                  {nlStatus === "loading" ? "..." : "Sign me up"}
                </button>
              </div>
              {nlStatus === "error" && <p className="nl-success" style={{ color: "#c0392b" }}>Something went wrong. Try again.</p>}
            </>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="om">
        <div className="about-text">
          <h2 className="section-title">Who are we?</h2>
          <p>We are two ramen nerds living in Skåne. Our concept is to take over restaurants, cafés or bars for a night and serve ramen at a seriously high level.</p>
          <p>Every event is exclusive with 50–100 seats and the menu changes every time.</p>
          <p>Want to book us for an evening? Don't hesitate to reach out.</p>
          <a href="mailto:contact@sanshoramen.se" className="btn-dark" style={{ marginTop: 24, display: "inline-flex" }}>Get in touch →</a>
        </div>
        <div className="about-img">
          <img src="/team.jpg" alt="Sanshō Ramen team" />
        </div>
      </section>

      {/* SOCIAL */}
      <section className="social-section">
        <h2>@sanshoramen</h2>
        <p>Follow our journey.</p>
        <div className="social-icons">
          <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer" className="social-link">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            Instagram
          </a>
          <a href="https://www.tiktok.com/@sansho.ramen" target="_blank" rel="noreferrer" className="social-link">
            <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>
            TikTok
          </a>
          <a href="https://youtube.com/@sanshoramen" target="_blank" rel="noreferrer" className="social-link">
            <svg viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
            YouTube
          </a>
        </div>
      </section>
    </>
  );
}
