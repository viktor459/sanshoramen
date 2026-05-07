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
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #F5F1E8; --ink: #1D1D1D; --ink-light: #6B6560; --radius: 100px; }
        body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }
        .wrap { min-height: 100vh; display: flex; flex-direction: column; }

        nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); }
        .nav-logo { cursor: pointer; }
        .nav-logo img { height: 32px; }
        .nav-links { display: flex; gap: 36px; list-style: none; }
        .nav-links a { font-family: 'Quicksand', sans-serif; font-weight: 400; font-size: 15px; color: var(--ink); text-decoration: none; letter-spacing: 0.02em; cursor: pointer; transition: opacity 0.2s; }
        .nav-links a:hover { opacity: 0.5; }
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .hamburger span { display: block; width: 24px; height: 2px; background: var(--ink); border-radius: 2px; }
        .mobile-menu { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); z-index: 99; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
        .mobile-menu.open { display: flex; }
        .mobile-menu a { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; color: var(--ink); cursor: pointer; text-transform: uppercase; }

        /* HERO */
        .hero {
          min-height: 100vh;
          padding-top: 88px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          overflow: hidden;
        }
        .hero-left {
          padding: 60px 64px 60px 80px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .hero-tag {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-light);
        }
        .hero-headline {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: clamp(36px, 4vw, 56px);
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .hero-sub {
          font-size: 17px;
          color: var(--ink-light);
          line-height: 1.7;
          max-width: 420px;
        }
        .hero-cta {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .btn-dark {
          background: var(--ink);
          color: var(--bg);
          border: none;
          padding: 16px 32px;
          border-radius: var(--radius);
          font-family: 'Quicksand', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-dark:hover { opacity: 0.8; transform: translateY(-1px); }
        .btn-ghost {
          background: transparent;
          color: var(--ink);
          border: 1.5px solid var(--ink);
          padding: 15px 32px;
          border-radius: var(--radius);
          font-family: 'Quicksand', sans-serif;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-ghost:hover { background: var(--ink); color: var(--bg); }
        .hero-right {
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }
        .hero-right img {
          width: 110%;
          max-width: 820px;
          object-fit: contain;
          transform: translateX(40px) translateY(20px);
          animation: floatIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateX(80px) translateY(40px); }
          to { opacity: 1; transform: translateX(40px) translateY(20px); }
        }

        /* BOOKING SECTION */
        .booking-section {
          background: var(--ink);
          color: var(--bg);
          padding: 100px 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        .booking-left h2 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 42px;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
          line-height: 1.2;
        }
        .booking-left p {
          font-size: 16px;
          color: #aaa;
          line-height: 1.8;
          margin-bottom: 32px;
        }
        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .booking-detail-row {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 14px;
          color: #ccc;
        }
        .booking-detail-row span:first-child {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #666;
          min-width: 80px;
        }
        .luma-wrapper {
          background: #F5F1E8;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
        }

        /* ABOUT SECTION */
        .about-section {
          padding: 100px 80px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .about-text h2 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 38px;
          letter-spacing: 0.03em;
          line-height: 1.2;
          margin-bottom: 24px;
        }
        .about-text p {
          font-size: 16px;
          color: var(--ink-light);
          line-height: 1.9;
          margin-bottom: 20px;
        }
        .three-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          margin-top: 80px;
          padding: 0 80px;
        }
        .three-col-item h3 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .three-col-item p {
          font-size: 15px;
          line-height: 1.8;
          color: var(--ink-light);
        }
        .divider-line { width: 40px; height: 2px; background: var(--ink); margin: 20px 0; opacity: 0.2; }

        /* INSTAGRAM */
        .insta-section { padding: 80px 80px; background: var(--ink); color: var(--bg); }
        .insta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 32px; }
        .insta-cell { aspect-ratio: 1; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 32px; overflow: hidden; }

        /* FOOTER */
        footer { background: #111; color: #F5F1E8; padding: 60px 80px 40px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
        .footer-logo img { height: 28px; filter: invert(1); margin-bottom: 20px; }
        .footer-desc { font-size: 14px; color: #666; line-height: 1.8; max-width: 280px; }
        .footer-col h4 { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-bottom: 16px; }
        .footer-col a { display: block; font-size: 14px; color: #aaa; text-decoration: none; margin-bottom: 10px; cursor: pointer; transition: color 0.2s; }
        .footer-col a:hover { color: #F5F1E8; }
        .footer-col p { font-size: 14px; color: #666; line-height: 1.8; }
        .footer-bottom { border-top: 0.5px solid #222; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #444; }

        /* HIDDEN PAGES */
        .page { padding: 120px 48px 80px; max-width: 900px; margin: 0 auto; width: 100%; }
        .page-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 52px; letter-spacing: 0.18em; margin-bottom: 48px; text-transform: uppercase; }
        .events-grid { display: flex; flex-direction: column; gap: 20px; }
        .event-card { border: 1.5px solid var(--ink); border-radius: 16px; padding: 32px; cursor: pointer; transition: background 0.2s, transform 0.15s; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
        .event-card:hover { background: var(--ink); color: var(--bg); transform: translateY(-2px); }
        .event-card:hover .event-meta { color: #ccc; }
        .event-card:hover .event-btn { background: var(--bg); color: var(--ink); }
        .event-name { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; margin-bottom: 8px; }
        .event-meta { font-size: 14px; color: var(--ink-light); line-height: 1.8; transition: color 0.2s; }
        .event-btn { background: var(--ink); color: var(--bg); border: none; padding: 14px 28px; border-radius: var(--radius); font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; white-space: nowrap; }
        .spots-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
        .spots-bar { flex: 1; max-width: 160px; height: 3px; background: #ccc; border-radius: 2px; }
        .spots-fill { height: 3px; background: var(--ink); border-radius: 2px; }
        .timeslots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .timeslot-btn { border: 1.5px solid var(--ink); border-radius: 10px; padding: 12px 16px; cursor: pointer; background: transparent; font-family: 'Quicksand', sans-serif; font-size: 14px; text-align: center; transition: all 0.15s; }
        .timeslot-btn:hover, .timeslot-btn.selected { background: var(--ink); color: var(--bg); }
        .timeslot-btn.full { opacity: 0.4; cursor: not-allowed; border-style: dashed; }
        .timeslot-spots { font-size: 11px; color: var(--ink-light); margin-top: 3px; }
        .timeslot-btn.selected .timeslot-spots, .timeslot-btn:hover .timeslot-spots { color: #ccc; }
        .booking-back { background: none; border: none; cursor: pointer; font-family: 'Quicksand', sans-serif; font-size: 14px; color: var(--ink-light); margin-bottom: 32px; display: flex; align-items: center; gap: 6px; }
        .booking-event-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 36px; letter-spacing: 0.1em; margin-bottom: 6px; }
        .booking-event-sub { font-size: 14px; color: var(--ink-light); margin-bottom: 40px; }
        .section-label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 12px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-field label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); }
        .form-field input, .form-field select, .form-field textarea { background: transparent; border: 1.5px solid var(--ink); border-radius: 8px; padding: 12px 16px; font-family: 'Quicksand', sans-serif; font-size: 15px; color: var(--ink); outline: none; }
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
        .about-text-page { font-size: 16px; line-height: 1.9; }
        .about-text-page p { margin-bottom: 20px; }
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

        @media (max-width: 768px) {
          nav { padding: 20px 24px; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .hero { grid-template-columns: 1fr; min-height: auto; padding-bottom: 0; }
          .hero-left { padding: 40px 24px; gap: 24px; }
          .hero-headline { font-size: 36px; }
          .hero-right { height: 320px; }
          .hero-right img { width: 100%; transform: translateX(20px) translateY(10px); }
          .booking-section { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
          .about-section { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
          .three-col { grid-template-columns: 1fr; gap: 32px; padding: 0 24px; margin-top: 40px; }
          .insta-section { padding: 60px 24px; }
          .insta-grid { grid-template-columns: repeat(2, 1fr); }
          footer { padding: 48px 24px 32px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
          .page { padding: 100px 24px 60px; }
          .page-title { font-size: 36px; }
          .form-grid { grid-template-columns: 1fr; }
          .about-grid, .contact-layout { grid-template-columns: 1fr; }
          .blog-grid, .shop-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">
        <nav>
          <div className="nav-logo" onClick={() => nav("home")}>
            <img src="/logotype.png" alt="Sanshō" />
          </div>
          <ul className="nav-links">
            <li><a href="#boka">boka.</a></li>
            <li><a href="#om">om oss.</a></li>
            <li><a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">instagram.</a></li>
          </ul>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </nav>

        <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", fontSize: 28, cursor: "pointer" }}>×</button>
          <a onClick={() => { setMenuOpen(false); document.getElementById("boka")?.scrollIntoView({ behavior: "smooth" }); }}>Boka</a>
          <a onClick={() => { setMenuOpen(false); document.getElementById("om")?.scrollIntoView({ behavior: "smooth" }); }}>Om oss</a>
          <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Instagram</a>
        </div>

        {/* HERO */}
        {page === "home" && (
          <>
            <div className="hero">
              <div className="hero-left">
                <p className="hero-tag">Ramen pop-up · Sverige</p>
                <h1 className="hero-headline">High quality<br />ramen pop-ups<br />in Sweden.</h1>
                <p className="hero-sub">We cook the broth for 18 hours, pull the noodles by hand, and create experiences you can't repeat.</p>
                <div className="hero-cta">
                  <a href="#boka" className="btn-dark">See upcoming pop-ups →</a>
                  <a href="#om" className="btn-ghost">About us</a>
                </div>
              </div>
              <div className="hero-right">
                <img src="/illustration.png" alt="Sanshō Ramen" />
              </div>
            </div>

            {/* BOOKING */}
            <div className="booking-section" id="boka">
              <div className="booking-left">
                <h2>Next<br />pop-up.</h2>
                {events.length > 0 && (
                  <div className="booking-details">
                    <div className="booking-detail-row">
                      <span>Event</span>
                      <span>{events[0].title}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span>Datum</span>
                      <span>{events[0].date}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span>Tid</span>
                      <span>{events[0].time}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span>Plats</span>
                      <span>{events[0].location}</span>
                    </div>
                    <div className="booking-detail-row">
                      <span>Pris</span>
                      <span>{events[0].price} kr / pers</span>
                    </div>
                  </div>
                )}
                <p style={{ marginTop: 32, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                  Bokning sker via Luma. Spots are limited — book early.
                </p>
              </div>
              <div>
                <div className="luma-wrapper">
                  <iframe
                    src="https://luma.com/embed/event/evt-77dZtaAzbhCrGtf/simple"
                    width="100%"
                    height="450"
                    frameBorder="0"
                    style={{ border: "none", display: "block" }}
                    allow="fullscreen; payment"
                    aria-hidden="false"
                    tabIndex={0}
                  />
                </div>
              </div>
            </div>

            {/* ABOUT */}
            <div className="about-section" id="om">
              <div className="about-text">
                <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 16 }}>Om Sanshō</p>
                <h2>Ramen är mer än mat.<br />Det är en ritual.</h2>
                <div className="divider-line" />
                <p>Vi kokar buljongen i 18 timmar. Vi drar nudlarna för hand. Vi väljer varje topping med omsorg — inte för att vi måste, utan för att vi inte kan tänka oss att göra det på något annat sätt.</p>
                <p>Sanshō är ett pop-up projekt grundat i Skåne. Vi tar med oss köket till utvalda restauranger och skapar tillfälliga upplevelser som inte går att återuppleva.</p>
              </div>
              <div>
                <img src="/illustration.png" alt="Sanshō" style={{ width: "100%", filter: "invert(1)", background: "#1D1D1D", padding: "40px", borderRadius: 8 }} />
              </div>
            </div>

            <div className="three-col">
              <div className="three-col-item">
                <h3>Buljong</h3>
                <p>18 timmars kokning. Fläskben, kombu, katsuobushi. Vi stoppar inte förrän smaken är exakt rätt.</p>
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

            {/* INSTAGRAM */}
            <div className="insta-section" style={{ marginTop: 80 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Följ oss</p>
              <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", color: "#F5F1E8" }}>@sanshoramen ↗</h2>
              </a>
              <div className="insta-grid">
                {["🍜", "🥢", "🔥", "🫙", "🍳", "🌿", "🫧", "🥩"].map((e, i) => (
                  <div key={i} className="insta-cell">{e}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* HIDDEN PAGES — under konstruktion */}
        {page === "pop-ups" && !selectedEvent && !confirmed && (
          <div className="page">
            <h1 className="page-title">Pop-ups.</h1>
            <div className="events-grid">
              {events.length === 0 && <p style={{ color: "var(--ink-light)", fontSize: 15 }}>Inga kommande pop-ups just nu.</p>}
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
              {loading ? "Skickar till betalning..." : "Betala via Stripe"}
            </button>
          </div>
        )}

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
              <button className="btn-dark" style={{ margin: "40px auto 0" }} onClick={() => { setConfirmed(false); setSelectedEvent(null); setTimeslots([]); setSelectedTimeslot(""); setBooking({ fname: "", lname: "", email: "", guests: "2", note: "" }); }}>
                Se fler pop-ups
              </button>
            </div>
          </div>
        )}

        {page === "om-oss" && (
          <div className="page">
            <h1 className="page-title">Om oss.</h1>
            <div className="about-grid">
              <div className="about-text-page">
                <p>Sanshō är ett ramen pop-up projekt grundat av Viktor och [kompanjon] i Skåne.</p>
                <p>Vi tar med oss köket till utvalda restauranger runt om i Skåne och skapar tillfälliga upplevelser som inte går att återuppleva.</p>
                <p>Sanshō är japonska för pepparträdet vars bär ger en unik, elektriserande hetta.</p>
              </div>
              <div>
                <img src="/illustration.png" alt="Sanshō" style={{ width: "100%", filter: "invert(1)", background: "#1D1D1D", padding: "20px", borderRadius: 12 }} />
              </div>
            </div>
          </div>
        )}

        {page === "kontakt" && (
          <div className="page">
            <h1 className="page-title">Kontakt.</h1>
            <div className="contact-layout">
              <div className="contact-info">
                <p style={{ marginBottom: 32, fontSize: 16, lineHeight: 1.9 }}>Frågor om bokningar, samarbeten eller press?</p>
                <p>✉ <a href="mailto:hej@sanshoramen.se">hej@sanshoramen.se</a></p>
                <p>📍 Skåne, Sverige</p>
              </div>
              <div>
                <div className="form-field"><label>Namn</label><input placeholder="Ditt namn" /></div>
                <div className="form-field"><label>E-post</label><input type="email" placeholder="din@email.se" /></div>
                <div className="form-field"><label>Meddelande</label><textarea placeholder="Hej!" style={{ minHeight: 120 }} /></div>
                <button className="pay-btn">Skicka</button>
              </div>
            </div>
          </div>
        )}

        {page === "blogg" && (
          <div className="page">
            <h1 className="page-title">Blogg.</h1>
            <div className="blog-grid">
              {[
                { tag: "Teknik", title: "Tonkotsu på 18 timmar", excerpt: "Varför vi kokar buljongen i nästan ett dygn." },
                { tag: "Ingredienser", title: "Vad är egentligen tare?", excerpt: "Tare är ramenens hemliga vapen." },
                { tag: "Bakom kulisserna", title: "Vår första pop-up", excerpt: "Allt som gick fel, allt som gick rätt." },
                { tag: "Guide", title: "Skånes bästa ramen", excerpt: "Vår ärliga lista." },
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

        {page === "webbshop" && (
          <div className="page">
            <h1 className="page-title">Webbshop.</h1>
            <div className="shop-grid">
              {[
                { name: "Sanshō Tote", price: "249 kr", emoji: "🛍️" },
                { name: "Logo T-shirt", price: "399 kr", emoji: "👕" },
                { name: "Tonkotsu Kit", price: "299 kr", emoji: "🍜" },
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
            <div className="footer-logo"><img src="/logotype.png" alt="Sanshō" /></div>
            <p className="footer-desc">High quality ramen pop-ups in Sweden. We cook the broth for 18 hours.</p>
          </div>
          <div className="footer-col">
            <h4>Links</h4>
            <a href="#boka">Boka</a>
            <a href="#om">Om oss</a>
            <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Instagram</a>
          </div>
          <div className="footer-col">
            <h4>Kontakt</h4>
            <p>hej@sanshoramen.se</p>
            <p style={{ marginTop: 8 }}>Skåne, Sverige</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sanshō Ramen.</span>
          <span>Sweden</span>
        </div>
      </footer>
    </>
  );
}
