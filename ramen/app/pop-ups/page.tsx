"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; --r:100px; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; }

  .page-wrap { padding: 120px 80px 80px; max-width: 1000px; margin: 0 auto; width: 100%; }
  .page-tag { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  .page-title { font-weight:700; font-size:52px; letter-spacing:0.06em; margin-bottom:16px; }
  .page-sub { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:56px; max-width:480px; }

  /* EVENT LIST */
  .events-list { display:flex; flex-direction:column; gap:16px; }
  .event-row { display:grid; grid-template-columns:80px 1fr auto; gap:24px; align-items:center; border:1.5px solid #DDD8CE; border-radius:16px; padding:28px 32px; cursor:pointer; transition:background 0.2s, border-color 0.2s, transform 0.15s; }
  .event-row:hover { background:var(--ink); color:var(--bg); border-color:var(--ink); transform:translateY(-2px); }
  .event-row:hover .er-sub, .event-row:hover .er-tag, .event-row:hover .er-right-sub { color:#aaa; }
  .er-date { text-align:center; }
  .er-day { font-size:32px; font-weight:700; line-height:1; }
  .er-month { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-top:4px; transition:color 0.2s; }
  .er-tag { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; transition:color 0.2s; }
  .er-title { font-weight:700; font-size:20px; letter-spacing:0.04em; margin-bottom:6px; }
  .er-sub { font-size:14px; color:var(--muted); line-height:1.7; transition:color 0.2s; }
  .er-right { text-align:right; flex-shrink:0; }
  .er-price { font-size:16px; font-weight:700; margin-bottom:6px; }
  .er-right-sub { font-size:12px; color:var(--muted); transition:color 0.2s; }
  .spots-bar { width:100%; height:2px; background:#E0DBD0; border-radius:2px; margin-top:8px; }
  .spots-fill { height:2px; background:var(--ink); border-radius:2px; transition:background 0.2s; }
  .event-row:hover .spots-bar { background:#444; }
  .event-row:hover .spots-fill { background:#F5F1E8; }
  .boka-btn { background:var(--ink); color:var(--bg); border:none; padding:12px 24px; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:opacity 0.15s; white-space:nowrap; margin-top:12px; }
  .event-row:hover .boka-btn { background:var(--bg); color:var(--ink); }
  .empty-state { text-align:center; padding:80px 0; color:var(--muted); }
  .empty-state h3 { font-size:20px; font-weight:500; margin-bottom:12px; }

  /* BOOKING PANEL */
  .booking-panel { max-width:600px; }
  .back-btn { background:none; border:none; cursor:pointer; font-family:'Quicksand',sans-serif; font-size:14px; color:var(--muted); display:flex; align-items:center; gap:6px; margin-bottom:32px; padding:0; transition:color 0.2s; }
  .back-btn:hover { color:var(--ink); }
  .bk-title { font-weight:700; font-size:36px; letter-spacing:0.05em; margin-bottom:6px; }
  .bk-meta { font-size:14px; color:var(--muted); margin-bottom:8px; }
  .bk-desc { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:36px; }
  .notice { background:#FFF8E7; border:1.5px solid #F0D97A; border-radius:10px; padding:16px 20px; margin-bottom:28px; font-size:13px; color:#856F30; line-height:1.6; }
  .sec-label { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:12px; }
  .timeslots-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-bottom:24px; }
  .ts-btn { border:1.5px solid #DDD8CE; border-radius:10px; padding:12px 16px; cursor:pointer; background:transparent; font-family:'Quicksand',sans-serif; font-size:14px; text-align:center; transition:all 0.15s; }
  .ts-btn:hover, .ts-btn.sel { background:var(--ink); color:var(--bg); border-color:var(--ink); }
  .ts-btn.full { opacity:0.4; cursor:not-allowed; border-style:dashed; }
  .ts-sub { font-size:11px; color:var(--muted); margin-top:3px; }
  .ts-btn.sel .ts-sub { color:#ccc; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
  .f-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .f-field label { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); }
  .f-field input, .f-field select, .f-field textarea { background:transparent; border:1.5px solid #DDD8CE; border-radius:8px; padding:12px 16px; font-family:'Quicksand',sans-serif; font-size:14px; color:var(--ink); outline:none; transition:border-color 0.2s; }
  .f-field input:focus, .f-field select:focus, .f-field textarea:focus { border-color:var(--ink); }
  .f-field textarea { resize:vertical; min-height:80px; }
  .price-sum { border-top:1.5px solid #DDD8CE; padding-top:20px; margin:24px 0; }
  .price-row { display:flex; justify-content:space-between; font-size:14px; color:var(--muted); margin-bottom:8px; }
  .price-total { display:flex; justify-content:space-between; font-size:16px; font-weight:600; margin-top:12px; }
  .submit-btn { width:100%; background:var(--ink); color:var(--bg); border:none; padding:18px; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:opacity 0.2s; margin-top:8px; }
  .submit-btn:hover { opacity:0.82; }
  .submit-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .err { color:#c0392b; font-size:14px; margin-top:12px; text-align:center; }

  @media(max-width:768px){
    .page-wrap{padding:100px 24px 60px;}
    .page-title{font-size:36px;}
    .event-row{grid-template-columns:1fr; gap:12px; padding:20px 24px;}
    .er-date{display:none;}
    .er-right{text-align:left;}
    .form-grid{grid-template-columns:1fr;}
  }
`;

type Event = { id: number; title: string; date: string; time: string; location: string; spots: number; spots_left: number; price: number; description: string; active: boolean; };
type Timeslot = { id: number; event_id: number; time: string; spots: number; spots_left: number; };

export default function PopUps() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ fname: "", lname: "", email: "", guests: "2", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("events").select("*").eq("active", true).order("id").then(({ data }) => {
      if (data) setEvents(data);
    });
  }, []);

  const pickEvent = (ev: Event) => {
    setSelected(ev);
    setSelectedSlot("");
    setError("");
    window.scrollTo(0, 0);
    supabase.from("timeslots").select("*").eq("event_id", ev.id).order("time").then(({ data }) => {
      if (data) setTimeslots(data);
    });
  };

  const back = () => { setSelected(null); setTimeslots([]); setSelectedSlot(""); setError(""); };

  const handleBook = async () => {
    if (!selected) return;
    if (timeslots.length > 0 && !selectedSlot) { setError("Välj en tid för att fortsätta."); return; }
    if (!form.fname || !form.lname || !form.email.includes("@")) { setError("Please fill in all required fields."); return; }
    setLoading(true);
    setError("");
    const slot = timeslots.find(t => t.id === Number(selectedSlot));
    const res = await fetch("/api/setup-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: selected.title,
        price: selected.price,
        guests: Number(form.guests),
        event_id: selected.id,
        timeslot_id: slot?.id || null,
        timeslot_time: slot?.time || null,
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        note: form.note,
      }),
    });
    const { url, error: err } = await res.json();
    if (url) window.location.href = url;
    else { setError(err || "Något gick fel. Försök igen."); setLoading(false); }
  };

  // Parse date string to get day/month
  const parseDateParts = (dateStr: string) => {
    const parts = dateStr.split(" ");
    if (parts.length >= 3) return { day: parts[1]?.replace(/\D/g, ""), month: parts[2]?.substring(0, 3) };
    return { day: "—", month: "" };
  };

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        {!selected ? (
          <>
            <p className="page-tag">Events</p>
            <h1 className="page-title">Pop-ups.</h1>
            <p className="page-sub">Exclusive ramen evenings in Skåne. Every event is unique — new menu, new venue. Spots are limited.</p>
            <div className="events-list">
              {events.length === 0 && (
                <div className="empty-state">
                  <h3>Inga kommande pop-ups just nu.</h3>
                  <p>Sign up for the <a href="/" style={{ color: "var(--ink)" }}>newsletter</a> to be the first to know when the next event drops.</p>
                </div>
              )}
              {events.map(ev => {
                const full = ev.spots_left <= 0;
                const pct = ((ev.spots - ev.spots_left) / ev.spots) * 100;
                const { day, month } = parseDateParts(ev.date);
                return (
                  <div key={ev.id} className="event-row" style={full ? { opacity: 0.55, cursor: "default" } : {}} onClick={() => !full && pickEvent(ev)}>
                    <div className="er-date">
                      <div className="er-day">{day}</div>
                      <div className="er-month">{month}</div>
                    </div>
                    <div>
                      <div className="er-tag">{ev.location}</div>
                      <div className="er-title">{ev.title}</div>
                      <div className="er-sub">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</div>
                    </div>
                    <div className="er-right">
                      <div className="er-price">{ev.price} kr</div>
                      <div className="er-right-sub">per person</div>
                      <div className="spots-bar"><div className="spots-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="er-right-sub" style={{ marginTop: 4 }}>{full ? "Sold out" : `${ev.spots_left} spots left`}</div>
                      {!full && <button className="boka-btn">Book →</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="booking-panel">
            <button className="back-btn" onClick={back}>← Back to pop-ups</button>
            <h1 className="bk-title">{selected.title}</h1>
            <p className="bk-meta">{selected.date}{selected.time ? ` · ${selected.time}` : ""} · {selected.location}</p>
            {selected.description && <p className="bk-desc">{selected.description}</p>}

            <div className="notice">
              <strong>Free to book — card verification required.</strong> We save your card details and charge <strong>250 SEK</strong> for no-shows if you don't cancel at least 48 hours before the event.
            </div>

            {timeslots.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p className="sec-label">Select time</p>
                <div className="timeslots-grid">
                  {timeslots.map(slot => {
                    const full = slot.spots_left <= 0;
                    return (
                      <button key={slot.id} className={`ts-btn${selectedSlot === String(slot.id) ? " sel" : ""}${full ? " full" : ""}`}
                        onClick={() => !full && setSelectedSlot(String(slot.id))} disabled={full}>
                        <div>{slot.time}</div>
                        <div className="ts-sub">{full ? "Sold out" : `${slot.spots_left} spots`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="sec-label">Your details</p>
            <div className="form-grid">
              <div className="f-field"><label>First name *</label><input value={form.fname} onChange={e => setForm({ ...form, fname: e.target.value })} placeholder="Johan" /></div>
              <div className="f-field"><label>Last name *</label><input value={form.lname} onChange={e => setForm({ ...form, lname: e.target.value })} placeholder="Svensson" /></div>
            </div>
            <div className="f-field"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" /></div>
            <div className="f-field">
              <label>Number of guests</label>
              <select value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
              </select>
            </div>
            <div className="f-field"><label>Allergies / requests</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Gluten free, lactose intolerant..." /></div>

            <div className="price-sum">
              <div className="price-row"><span>{form.guests} × {selected.price} SEK</span><span>{Number(form.guests) * selected.price} SEK</span></div>
              <div className="price-row"><span>Booking fee</span><span>0 SEK</span></div>
              <div className="price-total"><span>Due today</span><span>0 SEK</span></div>
            </div>

            {error && <p className="err">{error}</p>}
            <button className="submit-btn"
              disabled={!form.fname || !form.lname || !form.email.includes("@") || loading || (timeslots.length > 0 && !selectedSlot)}
              onClick={handleBook}>
              {loading ? "Sending..." : "Verify card & confirm booking →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
