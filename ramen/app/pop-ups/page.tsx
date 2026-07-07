"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; --red:#C0392B; --r:100px; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; }

  .page-wrap { padding: 120px 80px 80px; max-width: 1000px; margin: 0 auto; width: 100%; }
  .page-tag { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--red); margin-bottom:12px; }
  .page-title { font-weight:700; font-size:52px; letter-spacing:0.06em; margin-bottom:16px; }
  .page-sub { font-size:15px; color:var(--muted); line-height:1.8; margin-bottom:56px; max-width:480px; }

  /* CALENDAR LIST */
  .month-group { margin-bottom: 48px; }
  .month-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); padding-bottom: 12px; border-bottom: 1.5px solid #DDD8CE; margin-bottom: 16px; }
  .events-list { display: flex; flex-direction: column; gap: 16px; }
  .event-card { display: grid; grid-template-columns: 180px 1fr auto; gap: 0; border: 1.5px solid #DDD8CE; border-radius: 16px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, transform 0.15s; }
  .event-card:hover { border-color: var(--ink); transform: translateY(-2px); }
  .ec-image { width: 180px; min-height: 160px; background: #E8E3D8; overflow: hidden; flex-shrink: 0; position: relative; }
  .ec-image img { width: 100%; height: 100%; object-fit: cover; }
  .ec-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; }
  .ec-date-badge { position: absolute; top: 12px; left: 12px; background: var(--ink); color: #F5F1E8; border-radius: 8px; padding: 8px 12px; text-align: center; }
  .ec-badge-day { font-size: 20px; font-weight: 700; line-height: 1; }
  .ec-badge-month { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; color: #aaa; }
  .ec-body { padding: 28px 32px; display: flex; flex-direction: column; justify-content: center; }
  .ec-location { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red); margin-bottom: 8px; }
  .ec-title { font-weight: 700; font-size: 22px; letter-spacing: 0.03em; margin-bottom: 8px; }
  .ec-meta { font-size: 14px; color: var(--muted); line-height: 1.7; }
  .ec-right { padding: 28px 28px 28px 0; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; flex-shrink: 0; }
  .ec-price { font-size: 18px; font-weight: 700; }
  .ec-price-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .spots-wrap { text-align: right; }
  .spots-bar { width: 80px; height: 4px; background: #E0DBD0; border-radius: 4px; margin-bottom: 6px; margin-left: auto; }
  .spots-fill { height: 4px; border-radius: 4px; transition: width 0.3s; }
  .spots-text { font-size: 12px; color: var(--muted); }
  .urgency-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 99px; margin-bottom: 6px; }
  .urgency-hot { background: #FEE2E2; color: var(--red); }
  .urgency-low { background: #FEF3C7; color: #92400E; }
  .urgency-ok { background: #F0FDF4; color: #166534; }
  .boka-btn { background: var(--ink); color: var(--bg); border: none; padding: 12px 22px; border-radius: var(--r); font-family: 'Quicksand', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .empty-state { text-align:center; padding:80px 0; color:var(--muted); }
  .empty-state h3 { font-size:20px; font-weight:500; margin-bottom:12px; }

  /* BOOKING PANEL */
  .booking-panel { max-width: 600px; }
  .back-btn { background:none; border:none; cursor:pointer; font-family:'Quicksand',sans-serif; font-size:14px; color:var(--muted); display:flex; align-items:center; gap:6px; margin-bottom:32px; padding:0; transition:color 0.2s; }
  .back-btn:hover { color:var(--ink); }
  .bk-event-img { width: 100%; aspect-ratio: 16/6; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
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
  .veg-row { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
  .veg-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .veg-toggle { display: flex; gap: 0; border: 1.5px solid #DDD8CE; border-radius: 8px; overflow: hidden; }
  .veg-opt { padding: 10px 16px; font-family: 'Quicksand', sans-serif; font-size: 13px; cursor: pointer; background: transparent; border: none; transition: background 0.15s, color 0.15s; color: var(--ink); }
  .veg-opt.active { background: var(--ink); color: var(--bg); }
  .price-sum { border-top:1.5px solid #DDD8CE; padding-top:20px; margin:24px 0; }
  .price-row { display:flex; justify-content:space-between; font-size:14px; color:var(--muted); margin-bottom:8px; }
  .price-total { display:flex; justify-content:space-between; font-size:16px; font-weight:600; margin-top:12px; }
  .submit-btn { width:100%; background:var(--ink); color:var(--bg); border:none; padding:18px; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:opacity 0.2s; margin-top:8px; }
  .submit-btn:hover { opacity:0.82; }
  .submit-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .err { color:var(--red); font-size:14px; margin-top:12px; text-align:center; }

  @media(max-width:768px){
    .page-wrap{padding:100px 24px 60px;}
    .page-title{font-size:36px;}
    .event-card{grid-template-columns:1fr; grid-template-rows:auto 1fr auto;}
    .ec-image{width:100%; min-height:180px;}
    .ec-right{flex-direction:row; padding:0 20px 20px; align-items:center;}
    .form-grid{grid-template-columns:1fr;}
  }
`;

type Event = { id: number; title: string; date: string; time: string; location: string; spots: number; spots_left: number; price: number | null; description: string; active: boolean; image_url?: string; booking_type: "internal" | "on_site" | "external"; external_url?: string; };
type Timeslot = { id: number; event_id: number; time: string; spots: number; spots_left: number; };

export default function PopUps() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ fname: "", lname: "", email: "", phone: "", guests: "2", note: "" });
  const [vegetarianCount, setVegetarianCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("events").select("*").eq("active", true).order("date").then(({ data }) => {
      if (data) setEvents(data);
    });
  }, []);

  const pickEvent = (ev: Event) => {
    setSelected(ev);
    setSelectedSlot("");
    setError("");
    setVegetarianCount(0);
    window.scrollTo(0, 0);
    supabase.from("timeslots").select("*").eq("event_id", ev.id).order("time").then(({ data }) => {
      if (data) setTimeslots(data);
    });
  };

  const back = () => { setSelected(null); setTimeslots([]); setSelectedSlot(""); setError(""); };

  const handleBook = async () => {
    if (!selected) return;
    if (timeslots.length > 0 && !selectedSlot) { setError("Please select a time to continue."); return; }
    if (!form.fname || !form.lname || !form.email.includes("@") || !form.phone) { setError("Please fill in all required fields."); return; }
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
        vegetarian_count: vegetarianCount,
        event_id: selected.id,
        timeslot_id: slot?.id || null,
        timeslot_time: slot?.time || null,
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        phone: form.phone,
        note: form.note,
        date: selected.date,
        location: selected.location,
        time: selected.time,
      }),
    });
    const { url, error: err } = await res.json();
    if (url) window.location.href = url;
    else { setError(err || "Något gick fel. Försök igen."); setLoading(false); }
  };

  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return { day: "—", month: "", full: "" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr + "T12:00:00");
      return {
        day: String(d.getDate()),
        month: d.toLocaleDateString("en-SE", { month: "short" }).toLowerCase(),
        full: d.toLocaleDateString("en-SE", { weekday: "long", day: "numeric", month: "long" }),
      };
    }
    const parts = dateStr.split(" ");
    if (parts.length >= 3) return { day: parts[1]?.replace(/\D/g, ""), month: parts[2]?.substring(0, 3), full: dateStr };
    return { day: "—", month: "", full: dateStr };
  };

  const getMonthYear = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("en-SE", { month: "long", year: "numeric" });
    }
    return "";
  };

  const grouped = events.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = getMonthYear(ev.date) || "Upcoming";
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        {!selected ? (
          <>
            <p className="page-tag">Events</p>
            <h1 className="page-title">Pop-ups.</h1>
            <p className="page-sub">Exclusive ramen evenings in Skåne. Every event is unique — new menu, new venue. Spots are limited.</p>
            {events.length === 0 ? (
              <div className="empty-state">
                <h3>Inga kommande pop-ups just nu.</h3>
                <p>Sign up for the <a href="/" style={{ color: "var(--ink)" }}>newsletter</a> to be the first to know when the next event drops.</p>
              </div>
            ) : (
              <div>
                {Object.entries(grouped).map(([month, evs]) => (
                  <div key={month} className="month-group">
                    {month && <div className="month-label">{month}</div>}
                    <div className="events-list">
                      {evs.map(ev => {
                        const full = ev.spots_left <= 0;
                        const pct = ((ev.spots - ev.spots_left) / ev.spots) * 100;
                        const { day, month: mon } = parseDateParts(ev.date);
                        const urgency = full ? "sold" : pct >= 80 ? "hot" : pct >= 50 ? "low" : "ok";
                        const barColor = urgency === "hot" || urgency === "sold" ? "#C0392B" : urgency === "low" ? "#D97706" : "#16A34A";
                        const isExternal = ev.booking_type === "external";
                        const isOnSite = ev.booking_type === "on_site";
                        const handleClick = () => {
                          if (full) return;
                          if (isExternal && ev.external_url) { window.open(ev.external_url, "_blank"); return; }
                          if (!isExternal) pickEvent(ev);
                        };
                        return (
                          <div key={ev.id} className="event-card" style={full ? { opacity: 0.55, cursor: "default" } : {}} onClick={handleClick}>
                            <div className="ec-image">
                              {ev.image_url
                                ? <img src={ev.image_url} alt={ev.title} />
                                : <div className="ec-image-placeholder">🍜</div>
                              }
                              <div className="ec-date-badge">
                                <div className="ec-badge-day">{day}</div>
                                <div className="ec-badge-month">{mon}</div>
                              </div>
                            </div>
                            <div className="ec-body">
                              <div className="ec-location">{ev.location}</div>
                              <div className="ec-title">{ev.title}</div>
                              <div className="ec-meta">
                                {ev.time && <span>{ev.time}</span>}
                                {ev.description && <span style={{ display: "block", marginTop: 6 }}>{ev.description.substring(0, 100)}{ev.description.length > 100 ? "..." : ""}</span>}
                              </div>
                            </div>
                            <div className="ec-right">
                              <div>
                                {ev.price != null ? (
                                  <>
                                    <div className="ec-price">{ev.price} kr</div>
                                    <div className="ec-price-sub">per person</div>
                                  </>
                                ) : isOnSite ? (
                                  <div className="ec-price" style={{ fontSize: 13 }}>Pay on site</div>
                                ) : isExternal ? (
                                  <div className="ec-price" style={{ fontSize: 13 }}>External booking</div>
                                ) : null}
                              </div>
                              {!isExternal && (
                                <div className="spots-wrap">
                                  {urgency === "hot" && <div className="urgency-badge urgency-hot">🔥 Almost full!</div>}
                                  {urgency === "low" && <div className="urgency-badge urgency-low">⚡ Few spots left</div>}
                                  {urgency === "ok" && <div className="urgency-badge urgency-ok">✓ {ev.spots_left} spots left</div>}
                                  {urgency === "sold" && <div className="urgency-badge urgency-hot">Sold out</div>}
                                  <div className="spots-bar"><div className="spots-fill" style={{ width: `${pct}%`, background: barColor }} /></div>
                                  <div className="spots-text">{ev.spots - ev.spots_left} of {ev.spots} booked</div>
                                </div>
                              )}
                              {!full && (
                                <button className="boka-btn">
                                  {isExternal ? "Book here ↗" : isOnSite ? "Sign up →" : "Book →"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="booking-panel">
            <button className="back-btn" onClick={back}>← Back to pop-ups</button>
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.title} className="bk-event-img" />
            )}
            <h1 className="bk-title">{selected.title}</h1>
            <p className="bk-meta">{parseDateParts(selected.date).full || selected.date}{selected.time ? ` · ${selected.time}` : ""}{selected.location ? ` · ${selected.location}` : ""}</p>
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
            <div className="f-field"><label>Phone number *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+46 70 123 45 67" /></div>
            <div className="f-field">
              <label>Number of guests</label>
              <select value={form.guests} onChange={e => { setForm({ ...form, guests: e.target.value }); setVegetarianCount(Math.min(vegetarianCount, Number(e.target.value))); }}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="sec-label" style={{ marginBottom: 10 }}>Vegetarian / plant-based</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>How many guests want a vegetarian option?</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {Array.from({ length: Number(form.guests) + 1 }, (_, i) => i).map(n => (
                  <button
                    key={n}
                    onClick={() => setVegetarianCount(n)}
                    style={{
                      padding: "10px 16px", borderRadius: 8, border: "1.5px solid", fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer",
                      background: vegetarianCount === n ? "var(--ink)" : "transparent",
                      color: vegetarianCount === n ? "var(--bg)" : "var(--ink)",
                      borderColor: vegetarianCount === n ? "var(--ink)" : "#DDD8CE",
                    }}
                  >
                    {n === 0 ? "None" : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="f-field"><label>Allergies / requests</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Gluten free, lactose intolerant..." /></div>

            {selected.price != null && (
              <div className="price-sum">
                <div className="price-row"><span>{form.guests} × {selected.price} SEK</span><span>{Number(form.guests) * selected.price} SEK</span></div>
                <div className="price-row"><span>Booking fee</span><span>0 SEK</span></div>
                <div className="price-total"><span>Due today</span><span>0 SEK</span></div>
              </div>
            )}

            {error && <p className="err">{error}</p>}
            <button className="submit-btn"
              disabled={!form.fname || !form.lname || !form.email.includes("@") || !form.phone || loading || (timeslots.length > 0 && !selectedSlot)}
              onClick={handleBook}>
              {loading ? "Sending..." : "Verify card & confirm booking →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
