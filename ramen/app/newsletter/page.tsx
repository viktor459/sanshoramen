"use client";
import { useState } from "react";
import Link from "next/link";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  :root { --bg: #F5F1E8; --ink: #1D1D1D; --muted: #6B6560; --red: #C0392B; --r: 100px; }

  .nlp { min-height: calc(100vh - 72px); margin-top: 72px; background: #2A2520; color: var(--bg); display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; overflow: hidden; font-family: 'Quicksand', sans-serif; font-weight: 300; }
  .nlp-left { padding: 80px 64px 80px 80px; max-width: 640px; }
  .nlp-tag { display: inline-flex; background: var(--red); color: #fff; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border-radius: 99px; margin-bottom: 24px; }
  .nlp-title { font-weight: 700; font-size: clamp(38px,4.5vw,60px); letter-spacing: 0.02em; line-height: 1.1; margin-bottom: 20px; }
  .nlp-title span { color: var(--red); }
  .nlp-sub { font-size: 16px; color: #aaa; line-height: 1.8; margin-bottom: 28px; max-width: 460px; }
  .nlp-perks { display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
  .nlp-perk { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: #ccc; line-height: 1.5; }
  .nlp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); flex-shrink: 0; margin-top: 7px; }
  .nlp-form { display: flex; gap: 12px; max-width: 460px; }
  .nlp-input { flex: 1; min-width: 0; background: transparent; border: 1.5px solid #3a3530; border-radius: var(--r); padding: 15px 22px; font-family: 'Quicksand', sans-serif; font-size: 15px; color: var(--bg); outline: none; transition: border-color 0.2s; }
  .nlp-input::placeholder { color: #555; }
  .nlp-input:focus { border-color: #777; }
  .nlp-btn { background: var(--red); color: #fff; border: none; padding: 15px 26px; border-radius: var(--r); font-family: 'Quicksand', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: opacity 0.2s, transform 0.15s; }
  .nlp-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .nlp-btn:disabled { opacity: 0.6; cursor: default; transform: none; }
  .nlp-note { font-size: 12px; color: #666; margin-top: 14px; }
  .nlp-note a { color: #888; }
  .nlp-success { font-size: 18px; font-weight: 500; color: var(--bg); }
  .nlp-success-sub { font-size: 14px; color: #999; margin-top: 8px; line-height: 1.7; }
  .nlp-success-sub a { color: var(--bg); }
  .nlp-error { font-size: 14px; color: #f87171; margin-top: 14px; }
  .nlp-right { height: 100%; min-height: 520px; position: relative; }
  .nlp-right img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.9; }

  @media(max-width:768px){
    .nlp { grid-template-columns: 1fr; min-height: auto; }
    .nlp-left { padding: 48px 24px 40px; }
    .nlp-form { flex-direction: column; }
    .nlp-btn { width: 100%; }
    .nlp-right { min-height: 240px; }
  }
`;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const subscribe = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (res.ok) { setStatus("done"); setEmail(""); }
    else setStatus(data.error === "Du är redan anmäld!" ? "done" : "error");
  };

  return (
    <>
      <style>{S}</style>
      <section className="nlp">
        <div className="nlp-left">
          <p className="nlp-tag">Newsletter</p>
          <h1 className="nlp-title">Know first.<br /><span>Eat first.</span></h1>
          <p className="nlp-sub">Our pop-ups sell out fast. Subscribers get access to bookings and news before we announce on social media.</p>
          <div className="nlp-perks">
            <div className="nlp-perk"><span className="nlp-dot" />Early access to pop-up bookings</div>
            <div className="nlp-perk"><span className="nlp-dot" />News about the ramen bar at Saluhallen Lund</div>
            <div className="nlp-perk"><span className="nlp-dot" />No spam — only when there&apos;s something worth slurping</div>
          </div>
          {status === "done" ? (
            <div>
              <p className="nlp-success">✓ You&apos;re in — welcome!</p>
              <p className="nlp-success-sub">Check your inbox for a welcome email. Meanwhile, see our <Link href="/pop-ups">upcoming pop-ups</Link>.</p>
            </div>
          ) : (
            <>
              <form className="nlp-form" onSubmit={e => { e.preventDefault(); subscribe(); }}>
                <input className="nlp-input" type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" />
                <button className="nlp-btn" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "..." : "Sign me up"}
                </button>
              </form>
              {status === "error" && <p className="nlp-error">Something went wrong. Try again.</p>}
              <p className="nlp-note">Unsubscribe anytime. Read our <Link href="/integritetspolicy">privacy policy</Link>.</p>
            </>
          )}
        </div>
        <div className="nlp-right">
          <img src="/shoyu_ramen.jpg" alt="Bowl of shoyu ramen" />
        </div>
      </section>
    </>
  );
}
