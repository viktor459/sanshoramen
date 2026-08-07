"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; --red:#C0392B; --r:100px; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; min-height:100vh; }
  .wrap { max-width:560px; margin:0 auto; padding:80px 24px 80px; }
  .logo { height:26px; margin-bottom:48px; }
  .section { background:#fff; border-radius:20px; padding:36px 32px; margin-bottom:24px; box-shadow:0 2px 20px rgba(0,0,0,0.05); }
  .tag { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--red); margin-bottom:10px; }
  .section-title { font-weight:700; font-size:22px; letter-spacing:0.03em; margin-bottom:8px; }
  .section-sub { font-size:14px; color:var(--muted); line-height:1.7; margin-bottom:24px; }
  .field { margin-bottom:14px; }
  .field label { display:block; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .field input, .field select { width:100%; padding:12px 16px; border:1.5px solid #DDD8CE; border-radius:10px; font-family:'Quicksand',sans-serif; font-size:14px; background:#FAFAF8; color:var(--ink); outline:none; transition:border-color 0.2s; appearance:none; }
  .field input:focus, .field select:focus { border-color:var(--ink); }
  .btn { width:100%; padding:14px; background:var(--ink); color:var(--bg); border:none; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:15px; font-weight:600; cursor:pointer; margin-top:4px; transition:opacity 0.2s; }
  .btn:disabled { opacity:0.4; cursor:not-allowed; }
  .btn:hover:not(:disabled) { opacity:0.85; }
  .btn-red { background:var(--red); }
  .success { text-align:center; padding:8px 0; }
  .success-emoji { font-size:40px; margin-bottom:12px; }
  .success-title { font-weight:700; font-size:18px; margin-bottom:6px; }
  .success-sub { font-size:14px; color:var(--muted); line-height:1.6; }
  .perks { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
  .perk { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:var(--muted); line-height:1.5; }
  .perk-icon { color:var(--red); font-size:16px; flex-shrink:0; margin-top:1px; }
  .times-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:16px; }
  .time-btn { border:1.5px solid #DDD8CE; border-radius:10px; padding:10px; font-family:'Quicksand',sans-serif; font-size:14px; font-weight:500; text-align:center; cursor:pointer; background:transparent; transition:all 0.15s; }
  .time-btn:hover, .time-btn.sel { background:var(--ink); color:var(--bg); border-color:var(--ink); }
`;

const TIMES = ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30"];
const FULL_TIMES = ["16:00","20:00"];

export default function Community() {
  // Newsletter
  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState<"idle"|"loading"|"done"|"error">("idle");

  // Stallet
  const [stalletForm, setStalletForm] = useState({ name: "", email: "", time: "", guests: "1" });
  const [stalletStatus, setStalletStatus] = useState<"idle"|"loading"|"done">("idle");

  const submitNewsletter = async () => {
    if (!nlEmail.includes("@")) return;
    setNlStatus("loading");
    const res = await fetch("/api/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: nlEmail }) });
    setNlStatus(res.ok ? "done" : "error");
  };

  const submitStallet = async () => {
    if (!stalletForm.name || !stalletForm.email.includes("@") || !stalletForm.time) return;
    setStalletStatus("loading");
    await supabase.from("stallet_preferences").insert([{ name: stalletForm.name, email: stalletForm.email, preferred_time: stalletForm.time, guests: Number(stalletForm.guests) }]);
    setStalletStatus("done");
  };

  return (
    <>
      <style>{S}</style>
      <div className="wrap">
        <img src="/logotype.png" alt="Sanshō Ramen" className="logo" />

        {/* NEWSLETTER */}
        <div className="section">
          <p className="tag">Nyhetsbrev</p>
          <h2 className="section-title">Börja samla stämplar</h2>
          <p className="section-sub">Anmäl dig till vårt nyhetsbrev och starta ditt stämpelkort. Ju fler pop-ups du besöker, desto mer får du tillbaka.</p>
          {nlStatus === "done" ? (
            <div className="success">
              <div className="success-emoji">📬</div>
              <div className="success-title">Du är med!</div>
              <div className="success-sub">Du får ett mail när nästa pop-up släpps.</div>
            </div>
          ) : (
            <>
              <div className="field">
                <label>E-postadress</label>
                <input type="email" placeholder="din@email.se" value={nlEmail} onChange={e => setNlEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submitNewsletter()} />
              </div>
              {nlStatus === "error" && <p style={{ color:"var(--red)", fontSize:13, marginBottom:8 }}>Något gick fel, försök igen.</p>}
              <button className="btn" onClick={submitNewsletter} disabled={nlStatus === "loading" || !nlEmail.includes("@")}>
                {nlStatus === "loading" ? "Anmäler..." : "Anmäl mig →"}
              </button>
            </>
          )}
        </div>

        {/* STALLET BAR */}
        <div className="section">
          <p className="tag">12 aug · Stallet Bar</p>
          <h2 className="section-title">Välj din tid</h2>
          <p className="section-sub">Anmäl vilken tid du vill ha din ramen serverad på onsdagens pop-up på Stallet Bar. Vi serverar din skål inom 30 minuter från den valda tiden.</p>
          {stalletStatus === "done" ? (
            <div className="success">
              <div className="success-emoji">🕐</div>
              <div className="success-title">Tack, vi noterar {stalletForm.time}!</div>
              <div className="success-sub">Vi ses på Stallet Bar den 12 aug.</div>
            </div>
          ) : (
            <>
              <div className="field">
                <label>Välj tid</label>
                <div className="times-grid">
                  {TIMES.map(t => {
                    const full = FULL_TIMES.includes(t);
                    return (
                      <button key={t} className={`time-btn${stalletForm.time === t ? " sel" : ""}${full ? " full" : ""}`} onClick={() => !full && setStalletForm(f => ({...f, time: t}))} disabled={full} style={full ? { opacity:0.35, cursor:"not-allowed", textDecoration:"line-through" } : {}}>
                        {t}{full ? " •" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="field">
                <label>Namn</label>
                <input placeholder="Ditt namn" value={stalletForm.name} onChange={e => setStalletForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="field">
                <label>E-post</label>
                <input type="email" placeholder="din@email.se" value={stalletForm.email} onChange={e => setStalletForm(f => ({...f, email: e.target.value}))} />
              </div>
              <div className="field">
                <label>Antal i sällskapet</label>
                <select value={stalletForm.guests} onChange={e => setStalletForm(f => ({...f, guests: e.target.value}))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "personer"}</option>)}
                </select>
              </div>
              <button className="btn" onClick={submitStallet} disabled={stalletStatus === "loading" || !stalletForm.name || !stalletForm.email.includes("@") || !stalletForm.time}>
                {stalletStatus === "loading" ? "Skickar..." : "Skicka →"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
