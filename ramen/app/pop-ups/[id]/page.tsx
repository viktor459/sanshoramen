"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root { --bg:#F5F1E8; --ink:#1D1D1D; --muted:#6B6560; --red:#C0392B; --r:100px; }
  body { background:var(--bg); color:var(--ink); font-family:'Quicksand',sans-serif; font-weight:300; }
  .page-wrap { padding: 120px 80px 80px; max-width: 680px; margin: 0 auto; width: 100%; }
  .back-btn { background:none; border:none; cursor:pointer; font-family:'Quicksand',sans-serif; font-size:14px; color:var(--muted); display:flex; align-items:center; gap:6px; margin-bottom:32px; padding:0; transition:color 0.2s; text-decoration:none; }
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
  .price-sum { border-top:1.5px solid #DDD8CE; padding-top:20px; margin:24px 0; }
  .price-row { display:flex; justify-content:space-between; font-size:14px; color:var(--muted); margin-bottom:8px; }
  .price-total { display:flex; justify-content:space-between; font-size:16px; font-weight:600; margin-top:12px; }
  .submit-btn { width:100%; background:var(--ink); color:var(--bg); border:none; padding:18px; border-radius:var(--r); font-family:'Quicksand',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:opacity 0.2s; margin-top:8px; }
  .submit-btn:hover { opacity:0.82; }
  .submit-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .err { color:var(--red); font-size:14px; margin-top:12px; text-align:center; }
  @media(max-width:768px){
    .page-wrap{padding:100px 24px 60px;}
    .bk-title{font-size:28px;}
    .form-grid{grid-template-columns:1fr;}
  }
`;

type Event = { id: number; title: string; date: string; time: string; location: string; spots: number; spots_left: number; price: number | null; description: string; active: boolean; image_url?: string; booking_type: "internal" | "on_site" | "external"; external_url?: string; require_card: boolean; };
type Timeslot = { id: number; event_id: number; time: string; spots: number; spots_left: number; };

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ fname: "", lname: "", email: "", phone: "", guests: "2", note: "" });
  const [vegetarianCount, setVegetarianCount] = useState(0);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("events").select("*").eq("id", id).eq("active", true).single()
      .then(({ data }) => {
        if (!data) { router.replace("/pop-ups"); return; }
        setEvent(data);
        supabase.from("timeslots").select("*").eq("event_id", data.id).order("time")
          .then(({ data: slots }) => { if (slots) setTimeslots(slots); });
      });
  }, [id]);

  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return { full: "" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr + "T12:00:00");
      return { full: d.toLocaleDateString("en-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) };
    }
    return { full: dateStr };
  };

  const handleBook = async () => {
    if (!event) return;
    if (timeslots.length > 0 && !selectedSlot) { setError("Please select a time to continue."); return; }
    if (!form.fname || !form.lname || !form.email.includes("@") || !form.phone) { setError("Please fill in all required fields."); return; }
    setLoading(true);
    setError("");
    const slot = timeslots.find(t => t.id === Number(selectedSlot));
    const res = await fetch("/api/setup-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: event.title,
        price: event.price,
        guests: Number(form.guests),
        vegetarian_count: vegetarianCount,
        event_id: event.id,
        timeslot_id: slot?.id || null,
        timeslot_time: slot?.time || null,
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        phone: form.phone,
        note: form.note,
        newsletter_consent: newsletterConsent,
        date: event.date,
        location: event.location,
        time: event.time,
      }),
    });
    const { url, error: err } = await res.json();
    if (url) window.location.href = url;
    else { setError(err || "Something went wrong. Please try again."); setLoading(false); }
  };

  if (!event) return (
    <>
      <style>{S}</style>
      <div className="page-wrap" style={{ color: "var(--muted)" }}>Loading...</div>
    </>
  );

  const full = event.spots_left <= 0;
  const isExternal = event.booking_type === "external";
  const isOnSite = event.booking_type === "on_site";
  const { full: fullDate } = parseDateParts(event.date);

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        <a href="/pop-ups" className="back-btn">← Back to pop-ups</a>

        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="bk-event-img" />
        )}

        <h1 className="bk-title">{event.title}</h1>
        <p className="bk-meta">
          {fullDate || event.date}
          {event.time ? ` · ${event.time}` : ""}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.description && <p className="bk-desc">{event.description}</p>}

        {isExternal ? (
          <a href={event.external_url || "#"} target="_blank" rel="noreferrer"
            style={{ display: "inline-block", background: "var(--ink)", color: "var(--bg)", padding: "16px 32px", borderRadius: "var(--r)", textDecoration: "none", fontSize: 15, fontWeight: 500 }}>
            Book here ↗
          </a>
        ) : full ? (
          <p style={{ color: "var(--red)", fontWeight: 600, fontSize: 16 }}>This event is sold out.</p>
        ) : (
          <>
            {event.require_card && (
              <div className="notice">
                <strong>Free to book — card verification required.</strong> We save your card details and charge <strong>250 SEK</strong> for no-shows if you don't cancel at least 48 hours before the event.
              </div>
            )}

            {timeslots.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p className="sec-label">Select time</p>
                <div className="timeslots-grid">
                  {timeslots.map(slot => {
                    const slotFull = slot.spots_left <= 0;
                    return (
                      <button key={slot.id} className={`ts-btn${selectedSlot === String(slot.id) ? " sel" : ""}${slotFull ? " full" : ""}`}
                        onClick={() => !slotFull && setSelectedSlot(String(slot.id))} disabled={slotFull}>
                        <div>{slot.time}</div>
                        <div className="ts-sub">{slotFull ? "Sold out" : `${slot.spots_left} spots`}</div>
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
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className="sec-label" style={{ marginBottom: 10 }}>Vegetarian / plant-based</div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>How many guests want a vegetarian option?</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from({ length: Number(form.guests) + 1 }, (_, i) => i).map(n => (
                  <button key={n} onClick={() => setVegetarianCount(n)}
                    style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid", fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer",
                      background: vegetarianCount === n ? "var(--ink)" : "transparent",
                      color: vegetarianCount === n ? "var(--bg)" : "var(--ink)",
                      borderColor: vegetarianCount === n ? "var(--ink)" : "#DDD8CE" }}>
                    {n === 0 ? "None" : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="f-field"><label>Allergies / requests</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Gluten free, lactose intolerant..." /></div>

            {event.price != null && (
              <div className="price-sum">
                <div className="price-row"><span>{form.guests} × {event.price} SEK</span><span>{Number(form.guests) * event.price} SEK</span></div>
                <div className="price-row"><span>Booking fee</span><span>0 SEK</span></div>
                <div className="price-total"><span>Due today</span><span>0 SEK</span></div>
              </div>
            )}

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "#6B6560", lineHeight: 1.5, marginTop: 4, marginBottom: 16 }}>
              <input type="checkbox" checked={newsletterConsent} onChange={e => setNewsletterConsent(e.target.checked)} style={{ marginTop: 2, accentColor: "#1D1D1D", flexShrink: 0 }} />
              <span>I want to receive news about upcoming Sanshō Ramen events by email. You can unsubscribe at any time. <a href="/integritetspolicy" target="_blank" style={{ color: "#1D1D1D" }}>Privacy policy.</a></span>
            </label>

            {error && <p className="err">{error}</p>}
            <button className="submit-btn"
              disabled={!form.fname || !form.lname || !form.email.includes("@") || !form.phone || loading || (timeslots.length > 0 && !selectedSlot)}
              onClick={handleBook}>
              {loading ? "Sending..." : isOnSite ? "Confirm booking →" : event.require_card ? "Verify card & confirm booking →" : "Confirm booking →"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
