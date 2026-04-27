"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Page = "home" | "pop-ups" | "om-oss" | "kontakt" | "blogg" | "webbshop";

type Event = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  spots_left: number;
  price: number;
  description: string;
  active: boolean;
};

type Timeslot = {
  id: number;
  event_id: number;
  time: string;
  spots: number;
  spots_left: number;
};

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("");
  const [booking, setBooking] = useState({ fname: "", lname: "", email: "", guests: "2", note: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").eq("active", true).order("id");
    if (data) setEvents(data);
  };

  const fetchTimeslots = async (eventId: number) => {
    const { data } = await supabase.from("timeslots").select("*").eq("event_id", eventId).order("time");
    if (data) setTimeslots(data);
  };

  useEffect(() => { fetchEvents(); }, []);

  const nav = (p: Page) => {
    setPage(p);
    setSelectedEvent(null);
    setConfirmed(false);
    setError("");
    setTimeslots([]);
    setSelectedTimeslot("");
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const selectEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedTimeslot("");
    fetchTimeslots(event.id);
  };

const handleBook = async () => {
  if (!selectedEvent) return;
  if (timeslots.length > 0 && !selectedTimeslot) { setError("Välj en tid för att fortsätta."); return; }
  if (!booking.fname || !booking.lname || !booking.email.includes("@")) return;
  setLoading(true);
  setError("");

  const slot = timeslots.find(t => t.id === Number(selectedTimeslot));

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_name: selectedEvent.title,
      price: selectedEvent.price,
      guests: Number(booking.guests),
      event_id: selectedEvent.id,
      timeslot_id: slot?.id || null,
      timeslot_time: slot?.time || null,
      fname: booking.fname,
      lname: booking.lname,
      email: booking.email,
      note: booking.note,
    }),
  });

  const { url } = await res.json();
  if (url) window.location.href = url;
  else { setError("Något gick fel. Försök igen."); setLoading(false); }
};    if (!selectedEvent) return;
    if (timeslots.length > 0 && !selectedTimeslot) { setError("Välj en tid för att fortsätta."); return; }
    setLoading(true);
    setError("");

    const code = "RMN-" + Math.floor(1000 + Math.random() * 9000);
    const slot = timeslots.find(t => t.id === Number(selectedTimeslot));

    const { error: dbError } = await supabase.from("bookings").insert([{
      event_id: selectedEvent.id,
      event_name: selectedEvent.title,
      fname: booking.fname,
      lname: booking.lname,
      email: booking.email,
      guests: Number(booking.guests),
      note: booking.note,
      total_price: Number(booking.guests) * selectedEvent.price,
      status: "paid",
      booking_code: code,
      timeslot_id: slot?.id || null,
      timeslot_time: slot?.time || null,
    }]);

    setLoading(false);

    if (dbError) {
      setError("Något gick fel. Försök igen eller kontakta oss.");
      console.error("Supabase error:", JSON.stringify(dbError));
      return;
    }

    if (slot) {
      await supabase.from("timeslots").update({ spots_left: slot.spots_left - Number(booking.guests) }).eq("id", slot.id);
    }

    setConfirmCode(code);

    await fetch("/api/send-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fname: booking.fname,
        email: booking.email,
        event_name: selectedEvent.title,
        date: selectedEvent.date,
        location: selectedEvent.location,
        time: slot?.time || selectedEvent.time,
        guests: Number(booking.guests),
        total_price: Number(booking.guests) * selectedEvent.price,
        booking_code: code,
      }),
    });

    setConfirmed(true);
    fetchEvents();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #F5F1E8; --ink: #1D1D1D; --ink-light: #6B6560; --radius: 100px; }
        body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }
        .wrap { min-height: 100vh; display: flex; flex-direction: column; }

        /* NAV */
        nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); }
        .nav-logo { cursor: pointer; }
        .nav-logo img { height: 32px; }
        .nav-links { display: flex; gap: 36px; list-style: none; }
        .nav-links a { font-family: 'Quicksand', sans-serif; font-weight: 400; font-size: 15px; color: var(--ink); text-decoration: none; letter-spacing: 0.02em; cursor: pointer; transition: opacity 0.2s; }
        .nav-links a:hover { opacity: 0.5; }
        .nav-links a.active { border-bottom: 1.5px solid var(--ink); }
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .hamburger span { display: block; width: 24px; height: 2px; background: var(--ink); border-radius: 2px; }
        .mobile-menu { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); z-index: 99; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
        .mobile-menu.open { display: flex; }
        .mobile-menu a { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; color: var(--ink); cursor: pointer; text-transform: uppercase; }

        /* HERO */
        .hero { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; padding-top: 88px; overflow: hidden; }
        .hero-left { display: flex; flex-direction: column; justify-content: center; padding: 0 48px 80px 48px; gap: 40px; }
        .hero-logo img { width: 320px; }
        .hero-btn { display: inline-flex; align-items: center; background: var(--ink); color: var(--bg); font-family: 'Quicksand', sans-serif; font-weight: 400; font-size: 16px; padding: 16px 36px; border-radius: var(--radius); border: none; cursor: pointer; width: fit-content; transition: transform 0.2s, opacity 0.2s; }
        .hero-btn:hover { transform: scale(1.03); opacity: 0.85; }
        .hero-right { position: relative; overflow: hidden; display: flex; align-items: flex-end; justify-content: flex-end; }
        .hero-right img { width: 120%; max-width: 900px; object-fit: contain; transform: translateX(20px); animation: floatIn 1.2s ease forwards; }
        @keyframes floatIn { from { opacity: 0; transform: translateX(60px) translateY(20px); } to { opacity: 1; transform: translateX(20px) translateY(0); } }

        /* SECTIONS */
        .sections { display: flex; flex-direction: column; }
        .section { padding: 100px 80px; }
        .section-dark { background: #1D1D1D; color: #F5F1E8; }
        .section-split { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .section-split img { width: 100%; border-radius: 8px; }
        .manifesto { text-align: center; max-width: 700px; margin: 0 auto; }
        .manifesto-text { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 42px; letter-spacing: 0.05em; line-height: 1.3; margin-bottom: 32px; }
        .three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; margin-top: 64px; }
        .three-col-item h3 { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }
        .three-col-item p { font-size: 15px; line-height: 1.8; color: var(--ink-light); }
        .next-event { text-align: center; }
        .next-event-label { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 16px; }
        .next-event-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 52px; letter-spacing: 0.1em; margin-bottom: 12px; }
        .next-event-meta { font-size: 16px; color: var(--ink-light); margin-bottom: 40px; line-height: 1.8; }
        .hero-btn-light { display: inline-flex; align-items: center; background: #F5F1E8; color: #1D1D1D; font-family: 'Quicksand', sans-serif; font-weight: 400; font-size: 16px; padding: 16px 36px; border-radius: var(--radius); border: none; cursor: pointer; transition: transform 0.2s, opacity 0.2s; }
        .hero-btn-light:hover { transform: scale(1.03); opacity: 0.85; }
        .insta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 48px; }
        .insta-cell { aspect-ratio: 1; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 32px; overflow: hidden; }
        .divider-line { width: 40px; height: 2px; background: currentColor; margin: 24px 0; opacity: 0.3; }

        /* FOOTER */
        footer { background: #1D1D1D; color: #F5F1E8; padding: 60px 80px 40px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
        .footer-logo img { height: 28px; filter: invert(1); margin-bottom: 20px; }
        .footer-desc { font-size: 14px; color: #aaa; line-height: 1.8; max-width: 280px; }
        .footer-col h4 { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #aaa; margin-bottom: 16px; }
        .footer-col a { display: block; font-size: 14px; color: #F5F1E8; text-decoration: none; margin-bottom: 10px; cursor: pointer; transition: opacity 0.2s; }
        .footer-col a:hover { opacity: 0.5; }
        .footer-col p { font-size: 14px; color: #aaa; line-height: 1.8; }
        .footer-bottom { border-top: 0.5px solid #333; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #555; }

        /* PAGES */
        .page { padding: 120px 48px 80px; max-width: 900px; margin: 0 auto; width: 100%; }
        .page-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 52px; letter-spacing: 0.18em; margin-bottom: 48px; text-transform: uppercase; }
        .events-grid { display: flex; flex-direction: column; gap: 20px; }
        .event-card { border: 1.5px solid var(--ink); border-radius: 16px; padding: 32px; cursor: pointer; transition: background 0.2s, transform 0.15s; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
        .event-card:hover { background: var(--ink); color: var(--bg); transform: translateY(-2px); }
        .event-card:hover .event-meta { color: #ccc; }
        .event-card:hover .event-btn { background: var(--bg); color: var(--ink); }
        .event-name { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; margin-bottom: 8px; }
        .event-meta { font-size: 14px; color: var(--ink-light); line-height: 1.8; transition: color 0.2s; }
        .event-btn { background: var(--ink); color: var(--bg); border: none; padding: 14px 28px; border-radius: var(--radius); font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; white-space: nowrap; transition: background 0.2s, color 0.2s; }
        .spots-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
        .spots-bar { flex: 1; max-width: 160px; height: 3px; background: #ccc; border-radius: 2px; }
        .spots-fill { height: 3px; background: var(--ink); border-radius: 2px; }
        .event-card:hover .spots-bar { background: #555; }
        .event-card:hover .spots-fill { background: var(--bg); }
        .timeslots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .timeslot-btn { border: 1.5px solid var(--ink); border-radius: 10px; padding: 12px 16px; cursor: pointer; background: transparent; font-family: 'Quicksand', sans-serif; font-size: 14px; text-align: center; transition: all 0.15s; }
        .timeslot-btn:hover { background: var(--ink); color: var(--bg); }
        .timeslot-btn.selected { background: var(--ink); color: var(--bg); }
        .timeslot-btn.full { opacity: 0.4; cursor: not-allowed; border-style: dashed; }
        .timeslot-spots { font-size: 11px; color: var(--ink-light); margin-top: 3px; }
        .timeslot-btn.selected .timeslot-spots { color: #ccc; }
        .timeslot-btn:hover .timeslot-spots { color: #ccc; }
        .booking-back { background: none; border: none; cursor: pointer; font-family: 'Quicksand', sans-serif; font-size: 14px; color: var(--ink-light); margin-bottom: 32px; display: flex; align-items: center; gap: 6px; }
        .booking-back:hover { color: var(--ink); }
        .booking-event-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 36px; letter-spacing: 0.1em; margin-bottom: 6px; }
        .booking-event-sub { font-size: 14px; color: var(--ink-light); margin-bottom: 40px; }
        .section-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 12px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-field label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); }
        .form-field input, .form-field select, .form-field textarea { background: transparent; border: 1.5px solid var(--ink); border-radius: 8px; padding: 12px 16px; font-family: 'Quicksand', sans-serif; font-size: 15px; color: var(--ink); outline: none; transition: border-color 0.2s; }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #888; }
        .form-field textarea { resize: vertical; min-height: 80px; }
        .price-summary { border-top: 1.5px solid var(--ink); padding-top: 20px; margin: 24px 0; }
        .price-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-light); margin-bottom: 8px; }
        .price-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 500; margin-top: 12px; }
        .pay-btn { width: 100%; background: var(--ink); color: var(--bg); border: none; padding: 18px; border-radius: var(--radius); font-family: 'Quicksand', sans-serif; font-size: 16px; cursor: pointer; transition: opacity 0.2s; margin-top: 8px; }
        .pay-btn:hover { opacity: 0.8; }
        .pay-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .error-msg { color: #c0392b; font-size: 14px; margin-top: 12px; text-align: center; }
        .confirm { text-align: center; padding: 60px 0; }
        .confirm-circle { width: 72px; height: 72px; border: 2px solid var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .confirm-code { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 36px; letter-spacing: 0.15em; margin: 12px 0; }
        .confirm-sub { font-size: 15px; color: var(--ink-light); line-height: 1.7; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .about-text { font-size: 16px; line-height: 1.9; }
        .about-text p { margin-bottom: 20px; }
        .contact-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .contact-info { font-size: 15px; line-height: 2; }
        .contact-info a { color: var(--ink); }
        .blog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .blog-card { border: 1.5px solid var(--ink); border-radius: 12px; padding: 28px; cursor: pointer; transition: background 0.2s; }
        .blog-card:hover { background: var(--ink); color: var(--bg); }
        .blog-tag { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
        .blog-card:hover .blog-tag { color: #aaa; }
        .blog-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: 0.06em; margin-bottom: 10px; }
        .blog-excerpt { font-size: 14px; color: var(--ink-light); line-height: 1.7; }
        .blog-card:hover .blog-excerpt { color: #ccc; }
        .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .shop-card { border: 1.5px solid var(--ink); border-radius: 12px; overflow: hidden; }
        .shop-img { background: #E8E3D8; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 48px; }
        .shop-info { padding: 16px 20px; }
        .shop-name { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 18px; letter-spacing: 0.06em; margin-bottom: 4px; }
        .shop-price { font-size: 14px; color: var(--ink-light); }
        .shop-btn { width: 100%; background: var(--ink); color: var(--bg); border: none; padding: 12px; font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; transition: opacity 0.2s; margin-top: 12px; border-radius: 6px; }
        .shop-btn:hover { opacity: 0.8; }

        @media (max-width: 768px) {
          nav { padding: 20px 24px; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .hero { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: 0 24px 60px; }
          .hero-logo img { width: 220px; }
          .page { padding: 100px 24px 60px; }
          .page-title { font-size: 36px; }
          .form-grid { grid-template-columns: 1fr; }
          .about-grid, .contact-layout { grid-template-columns: 1fr; }
          .blog-grid, .shop-grid { grid-template-columns: 1fr; }
          .section { padding: 60px 24px; }
          .section-split { grid-template-columns: 1fr; gap: 40px; }
          .manifesto-text { font-size: 28px; }
          .three-col { grid-template-columns: 1fr; gap: 32px; }
          .next-event-title { font-size: 32px; }
          .insta-grid { grid-template-columns: repeat(2, 1fr); }
          footer { padding: 48px 24px 32px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }
      `}</style>

      <div className="wrap">
        <nav>
          <div className="nav-logo" onClick={() => nav("home")}>
            <img src="/logotype.png" alt="Sanshō" />
          </div>
          <ul className="nav-links">
            {[
              { key: "pop-ups", label: "pop-ups." },
              { key: "blogg", label: "blogg." },
              { key: "om-oss", label: "om oss." },
              { key: "kontakt", label: "kontakt." },
              { key: "webbshop", label: "webbshop." },
            ].map(({ key, label }) => (
              <li key={key}>
                <a className={page === key ? "active" : ""} onClick={() => nav(key as Page)}>{label}</a>
              </li>
            ))}
          </ul>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </nav>

        <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", fontSize: 28, cursor: "pointer" }}>×</button>
          {[
            { key: "pop-ups", label: "pop-ups." },
            { key: "blogg", label: "blogg." },
            { key: "om-oss", label: "om oss." },
            { key: "kontakt", label: "kontakt." },
            { key: "webbshop", label: "webbshop." },
          ].map(({ key, label }) => (
            <a key={key} onClick={() => nav(key as Page)}>{label}</a>
          ))}
        </div>

        {/* HOME */}
        {page === "home" && (
          <>
            <div className="hero">
              <div className="hero-left">
                <div className="hero-logo"><img src="/logotype.png" alt="Sanshō Ramen" /></div>
                <button className="hero-btn" onClick={() => nav("pop-ups")}>Next pop-up.</button>
              </div>
              <div className="hero-right">
                <img src="/illustration.png" alt="Ramen illustration" />
              </div>
            </div>

            <div className="sections">
              {/* OM OSS */}
              <div className="section">
                <div className="section-split">
                  <div>
                    <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 20 }}>Om Sanshō</p>
                    <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 38, letterSpacing: "0.05em", lineHeight: 1.2, marginBottom: 24 }}>Ramen är mer än mat. Det är en ritual.</h2>
                    <div className="divider-line" />
                    <p style={{ fontSize: 16, lineHeight: 1.9, color: "var(--ink-light)", marginBottom: 20 }}>Vi kokar buljongen i 18 timmar. Vi drar nudlarna för hand. Vi väljer varje topping med omsorg. Det är inte för att vi måste — det är för att vi inte kan tänka oss att göra det på något annat sätt.</p>
                    <p style={{ fontSize: 16, lineHeight: 1.9, color: "var(--ink-light)" }}>Sanshō är ett ramen pop-up projekt grundat i Skåne. Vi tar med oss köket till utvalda restauranger och skapar tillfälliga upplevelser som inte går att återuppleva.</p>
                  </div>
                  <div>
                    <img src="/illustration.png" alt="Sanshō" style={{ filter: "invert(1)", background: "#1D1D1D", padding: "32px" }} />
                  </div>
                </div>
                <div className="three-col">
                  <div className="three-col-item">
                    <h3>Buljong</h3>
                    <p>18 timmars kokning. Fläskben, kombu, katsuobushi. Vi stoppar inte förrän smaken är exakt som den ska vara.</p>
                  </div>
                  <div className="three-col-item">
                    <h3>Nudlar</h3>
                    <p>Handdragna samma dag som de serveras. Aldrig från förra veckan. Aldrig från en påse.</p>
                  </div>
                  <div className="three-col-item">
                    <h3>Tare</h3>
                    <p>Ramenens hemliga vapen. Vår shio tare är under ständig utveckling — alltid på jakt efter mer djup.</p>
                  </div>
                </div>
              </div>

              {/* MANIFESTO */}
              <div className="section section-dark">
                <div className="manifesto">
                  <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: 20 }}>Vår filosofi</p>
                  <div className="manifesto-text">"Vi gör inte kompromisser med buljongen. Aldrig."</div>
                  <p style={{ fontSize: 15, color: "#aaa", lineHeight: 1.8 }}>Varje pop-up är ett engångsevent. Samma lokal, samma kväll — aldrig igen. Det är det som gör det värt att vara där.</p>
                  <button className="hero-btn-light" style={{ marginTop: 40 }} onClick={() => nav("pop-ups")}>Se kommande pop-ups</button>
                </div>
              </div>

              {/* NÄSTA POP-UP */}
              {events.length > 0 && (
                <div className="section">
                  <div className="next-event">
                    <div className="next-event-label">Nästa pop-up</div>
                    <div className="next-event-title">{events[0].title}</div>
                    <div className="next-event-meta">
                      {events[0].date} · {events[0].time}<br />
                      {events[0].location} · {events[0].price} kr / pers
                    </div>
                    <button className="hero-btn" onClick={() => nav("pop-ups")}>Boka din plats</button>
                  </div>
                </div>
              )}

              {/* INSTAGRAM */}
              <div className="section section-dark">
                <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>Instagram</p>
                <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", marginBottom: 24, color: "#F5F1E8" }}>@sanshoramen</h2>
                <div className="insta-grid">
                  {["🍜", "🥢", "🔥", "🫙", "🍳", "🌿", "🫧", "🥩"].map((e, i) => (
                    <div key={i} className="insta-cell">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* POP-UPS */}
        {page === "pop-ups" && !selectedEvent && !confirmed && (
          <div className="page">
            <h1 className="page-title">Pop-ups.</h1>
            <div className="events-grid">
              {events.length === 0 && <p style={{ color: "var(--ink-light)", fontSize: 15 }}>Inga kommande pop-ups just nu. Följ oss på Instagram!</p>}
              {events.map((event) => {
                const pct = ((event.spots - event.spots_left) / event.spots) * 100;
                const full = event.spots_left <= 0;
                return (
                  <div key={event.id} className="event-card" style={full ? { opacity: 0.5, cursor: "default" } : {}} onClick={() => !full && selectEvent(event)}>
                    <div>
                      <div className="event-name">{event.title}</div>
                      <div className="event-meta">{event.date} · {event.time}<br />{event.location}</div>
                      <div className="spots-row">
                        <div className="spots-bar"><div className="spots-fill" style={{ width: `${pct}%` }} /></div>
                        <span style={{ fontSize: 13 }}>{full ? "Fullbokat" : `${event.spots_left} platser kvar`} · {event.price} kr</span>
                      </div>
                    </div>
                    {!full && <button className="event-btn">Boka</button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOOKING FORM */}
        {page === "pop-ups" && selectedEvent && !confirmed && (
          <div className="page" style={{ maxWidth: 600 }}>
            <button className="booking-back" onClick={() => { setSelectedEvent(null); setTimeslots([]); setSelectedTimeslot(""); }}>← Tillbaka</button>
            <div className="booking-event-title">{selectedEvent.title}</div>
            <div className="booking-event-sub">{selectedEvent.date} · {selectedEvent.location}</div>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 36, color: "var(--ink-light)" }}>{selectedEvent.description}</p>
            {timeslots.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div className="section-label">Välj tid</div>
                <div className="timeslots-grid">
                  {timeslots.map(slot => {
                    const full = slot.spots_left <= 0;
                    return (
                      <button key={slot.id} className={`timeslot-btn${selectedTimeslot === String(slot.id) ? " selected" : ""}${full ? " full" : ""}`} onClick={() => !full && setSelectedTimeslot(String(slot.id))} disabled={full}>
                        <div>{slot.time}</div>
                        <div className="timeslot-spots">{full ? "Fullbokat" : `${slot.spots_left} platser`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="form-grid">
              <div className="form-field"><label>Förnamn</label><input value={booking.fname} onChange={e => setBooking({ ...booking, fname: e.target.value })} placeholder="Johan" /></div>
              <div className="form-field"><label>Efternamn</label><input value={booking.lname} onChange={e => setBooking({ ...booking, lname: e.target.value })} placeholder="Svensson" /></div>
            </div>
            <div className="form-field"><label>E-post</label><input type="email" value={booking.email} onChange={e => setBooking({ ...booking, email: e.target.value })} placeholder="johan@exempel.se" /></div>
            <div className="form-field">
              <label>Antal gäster</label>
              <select value={booking.guests} onChange={e => setBooking({ ...booking, guests: e.target.value })}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "personer"}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Allergier / önskemål</label><textarea value={booking.note} onChange={e => setBooking({ ...booking, note: e.target.value })} placeholder="Glutenfri, laktosintolerant..." /></div>
            <div className="price-summary">
              <div className="price-row"><span>{booking.guests} × {selectedEvent.price} kr</span><span>{Number(booking.guests) * selectedEvent.price} kr</span></div>
              {selectedTimeslot && <div className="price-row"><span>Tid</span><span>{timeslots.find(t => t.id === Number(selectedTimeslot))?.time}</span></div>}
              <div className="price-row"><span>Bokningsavgift</span><span>0 kr</span></div>
              <div className="price-total"><span>Totalt</span><span>{Number(booking.guests) * selectedEvent.price} kr</span></div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="pay-btn" disabled={!booking.fname || !booking.lname || !booking.email.includes("@") || loading || (timeslots.length > 0 && !selectedTimeslot)} onClick={handleBook}>
              {loading ? "Sparar bokning..." : "Betala via Stripe"}
            </button>
          </div>
        )}

        {/* CONFIRM */}
        {page === "pop-ups" && confirmed && (
          <div className="page">
            <div className="confirm">
              <div className="confirm-circle">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14.5L11 19.5L22 8.5" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Bokning bekräftad!</div>
              <div className="confirm-code">{confirmCode}</div>
              <div className="confirm-sub">Bekräftelse skickas till {booking.email}<br />Vi ses snart. 🍜</div>
              <button className="hero-btn" style={{ margin: "40px auto 0" }} onClick={() => { setConfirmed(false); setSelectedEvent(null); setTimeslots([]); setSelectedTimeslot(""); setBooking({ fname: "", lname: "", email: "", guests: "2", note: "" }); }}>
                Se fler pop-ups
              </button>
            </div>
          </div>
        )}

        {/* OM OSS */}
        {page === "om-oss" && (
          <div className="page">
            <h1 className="page-title">Om oss.</h1>
            <div className="about-grid">
              <div className="about-text">
                <p>Sanshō är ett ramen pop-up projekt grundat av Viktor och [kompanjon] i Skåne. Vi tror att ramen är mer än mat — det är en ritual. 18 timmars buljong, handdragna nudlar, och omgivningar som känns som något annat.</p>
                <p>Vi tar med oss köket till utvalda restauranger runt om i Skåne och skapar tillfälliga upplevelser som inte går att återuppleva. Varje pop-up är ett engångsevent.</p>
                <p>Sanshō är japonska för pepparträdet vars bär ger en unik, elektriserande hetta. Precis som vi vill att vår mat ska kännas.</p>
              </div>
              <div>
                <img src="/illustration.png" alt="Sanshō" style={{ width: "100%", filter: "invert(1)", background: "#1D1D1D", padding: "20px", borderRadius: 12 }} />
              </div>
            </div>
          </div>
        )}

        {/* KONTAKT */}
        {page === "kontakt" && (
          <div className="page">
            <h1 className="page-title">Kontakt.</h1>
            <div className="contact-layout">
              <div className="contact-info">
                <p style={{ marginBottom: 32, fontSize: 16, lineHeight: 1.9 }}>Frågor om bokningar, samarbeten eller press? Hör av er.</p>
                <p>✉ <a href="mailto:hej@sanshoramen.se">hej@sanshoramen.se</a></p>
                <p>📍 Skåne, Sverige</p>
                <p style={{ marginTop: 32 }}>
                  <a href="https://instagram.com/sanshoramen" style={{ marginRight: 20 }}>Instagram</a>
                  <a href="#">TikTok</a>
                </p>
              </div>
              <div>
                <div className="form-field"><label>Namn</label><input placeholder="Ditt namn" /></div>
                <div className="form-field"><label>E-post</label><input type="email" placeholder="din@email.se" /></div>
                <div className="form-field"><label>Meddelande</label><textarea placeholder="Hej! Vi vill..." style={{ minHeight: 120 }} /></div>
                <button className="pay-btn">Skicka</button>
              </div>
            </div>
          </div>
        )}

        {/* BLOGG */}
        {page === "blogg" && (
          <div className="page">
            <h1 className="page-title">Blogg.</h1>
            <div className="blog-grid">
              {[
                { tag: "Teknik", title: "Tonkotsu på 18 timmar", excerpt: "Varför vi kokar buljongen i nästan ett dygn och vad som händer i kastrullen under natten." },
                { tag: "Ingredienser", title: "Vad är egentligen tare?", excerpt: "Tare är ramenens hemliga vapen — den smaksättning som definierar om det är shio, shoyu eller miso." },
                { tag: "Bakom kulisserna", title: "Vår första pop-up", excerpt: "Allt som gick fel, allt som gick rätt och varför vi redan planerade nästa dagen efter." },
                { tag: "Guide", title: "Skånes bästa ramen", excerpt: "Vi har ätit oss igenom stan. Här är vår ärliga lista — inklusive platser som förtjänar mer kärlek." },
              ].map((post) => (
                <div key={post.title} className="blog-card">
                  <div className="blog-tag">{post.tag}</div>
                  <div className="blog-title">{post.title}</div>
                  <div className="blog-excerpt">{post.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBBSHOP */}
        {page === "webbshop" && (
          <div className="page">
            <h1 className="page-title">Webbshop.</h1>
            <div className="shop-grid">
              {[
                { name: "Sanshō Tote", price: "249 kr", emoji: "🛍️" },
                { name: "Logo T-shirt", price: "399 kr", emoji: "👕" },
                { name: "Tonkotsu Kit", price: "299 kr", emoji: "🍜" },
                { name: "Tare Set", price: "199 kr", emoji: "🫙" },
                { name: "Kepsar", price: "349 kr", emoji: "🧢" },
                { name: "Presentkort", price: "från 390 kr", emoji: "🎁" },
              ].map((item) => (
                <div key={item.name} className="shop-card">
                  <div className="shop-img">{item.emoji}</div>
                  <div className="shop-info">
                    <div className="shop-name">{item.name}</div>
                    <div className="shop-price">{item.price}</div>
                    <button className="shop-btn">Lägg i varukorg</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <img src="/logotype.png" alt="Sanshō" />
            </div>
            <p className="footer-desc">Ramen pop-up i Skåne. Vi kokar buljongen i 18 timmar, drar nudlarna för hand och skapar upplevelser som inte går att återuppleva.</p>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <a onClick={() => nav("pop-ups")}>Pop-ups</a>
            <a onClick={() => nav("om-oss")}>Om oss</a>
            <a onClick={() => nav("blogg")}>Blogg</a>
            <a onClick={() => nav("webbshop")}>Webbshop</a>
            <a onClick={() => nav("kontakt")}>Kontakt</a>
          </div>
          <div className="footer-col">
            <h4>Kontakt</h4>
            <p>hej@sanshoramen.se</p>
            <p style={{ marginTop: 16 }}>
              <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Instagram</a>
              <a href="#" target="_blank" rel="noreferrer">TikTok</a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sanshō Ramen. Alla rättigheter förbehållna.</span>
          <span>Skåne, Sverige</span>
        </div>
      </footer>
    </>
  );
}