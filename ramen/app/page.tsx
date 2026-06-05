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

        /* NAV */
        nav { display: flex; align-items: center; justify-content: space-between; padding: 24px 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); }
        .nav-logo { cursor: pointer; }
        .nav-logo img { height: 30px; }
        .nav-links { display: flex; gap: 12px; list-style: none; align-items: center; }
        .nav-links a {
          font-family: 'Quicksand', sans-serif;
          font-weight: 400;
          font-size: 14px;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.2s;
          padding: 8px 16px;
          border-radius: var(--radius);
        }
        .nav-links a:hover { opacity: 0.6; }
        .nav-links a.highlighted {
          background: var(--ink);
          color: var(--bg);
          font-weight: 500;
        }
        .nav-links a.highlighted:hover { opacity: 0.85; }
        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .hamburger span { display: block; width: 24px; height: 2px; background: var(--ink); border-radius: 2px; }
        .mobile-menu { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg); z-index: 99; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
        .mobile-menu.open { display: flex; }
        .mobile-menu a { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; color: var(--ink); cursor: pointer; text-transform: uppercase; text-decoration: none; }

        /* HERO */
        .hero { min-height: 100vh; padding-top: 80px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; overflow: hidden; }
        .hero-left { padding: 60px 64px 60px 80px; display: flex; flex-direction: column; gap: 28px; }
        .hero-tag { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-light); }
        .hero-headline { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: clamp(36px, 4vw, 54px); line-height: 1.15; letter-spacing: -0.01em; }
        .hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
        .btn-dark { background: var(--ink); color: var(--bg); border: none; padding: 15px 28px; border-radius: var(--radius); font-family: 'Quicksand', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity 0.2s, transform 0.2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-dark:hover { opacity: 0.8; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--ink); border: 1.5px solid #ccc; padding: 14px 28px; border-radius: var(--radius); font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-ghost:hover { border-color: var(--ink); }
        .hero-right { height: 100vh; overflow: hidden; display: flex; align-items: flex-end; justify-content: flex-end; }
        .hero-right img { width: 110%; max-width: 820px; object-fit: contain; transform: translateX(40px) translateY(20px); animation: floatIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes floatIn { from { opacity: 0; transform: translateX(80px) translateY(40px); } to { opacity: 1; transform: translateX(40px) translateY(20px); } }

        /* BOOKING */
        .booking-section { background: var(--ink); color: var(--bg); padding: 100px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .booking-left h2 { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 42px; letter-spacing: 0.05em; margin-bottom: 32px; line-height: 1.2; }
        .booking-details { display: flex; flex-direction: column; gap: 12px; }
        .booking-detail-row { display: flex; gap: 12px; align-items: center; font-size: 14px; color: #ccc; }
        .booking-detail-row span:first-child { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #555; min-width: 80px; }
        .luma-wrapper { background: #F5F1E8; border-radius: 12px; overflow: hidden; width: 100%; }

        /* ABOUT */
        .about-section { padding: 100px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .about-text h2 { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 38px; letter-spacing: 0.03em; line-height: 1.2; margin-bottom: 24px; }
        .about-text p { font-size: 16px; color: var(--ink-light); line-height: 1.9; margin-bottom: 16px; }
        .about-img { border-radius: 8px; overflow: hidden; }
        .about-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* SOCIAL */
        .social-section { background: var(--ink); color: var(--bg); padding: 100px 80px; text-align: center; }
        .social-section h2 { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 48px; letter-spacing: 0.06em; margin-bottom: 12px; }
        .social-section p { font-size: 16px; color: #aaa; margin-bottom: 48px; }
        .social-icons { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .social-link { display: flex; align-items: center; gap: 10px; color: var(--bg); text-decoration: none; border: 1.5px solid #333; border-radius: var(--radius); padding: 14px 24px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
        .social-link:hover { border-color: var(--bg); background: rgba(255,255,255,0.05); }
        .social-link svg { width: 18px; height: 18px; fill: currentColor; flex-shrink: 0; }

        /* FOOTER */
        footer { background: #111; color: #F5F1E8; padding: 60px 80px 40px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
        .footer-logo img { height: 28px; filter: invert(1); margin-bottom: 20px; }
        .footer-desc { font-size: 14px; color: #555; line-height: 1.8; max-width: 280px; }
        .footer-col h4 { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin-bottom: 16px; }
        .footer-col a { display: block; font-size: 14px; color: #888; text-decoration: none; margin-bottom: 10px; cursor: pointer; transition: color 0.2s; }
        .footer-col a:hover { color: #F5F1E8; }
        .footer-col p { font-size: 14px; color: #555; line-height: 1.8; }
        .footer-bottom { border-top: 0.5px solid #222; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #333; }

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

        @media (max-width: 768px) {
          nav { padding: 18px 24px; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 40px 24px 32px; gap: 20px; }
          .hero-headline { font-size: 36px; }
          .hero-right { height: 300px; }
          .hero-right img { width: 100%; transform: translateX(20px) translateY(10px); }
          .booking-section { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
          .about-section { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
          .social-section { padding: 60px 24px; }
          .social-section h2 { font-size: 32px; }
          .social-icons { gap: 12px; }
          footer { padding: 48px 24px 32px; }
          .footer-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
          .page { padding: 100px 24px 60px; }
          .page-title { font-size: 36px; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">
        <nav>
          <div className="nav-logo" onClick={() => nav("home")}>
            <img src="/logotype.png" alt="Sanshō" />
          </div>
          <ul className="nav-links">
            <li><a href="#boka" className="highlighted">Book your spot</a></li>
            <li><a href="#om">About us</a></li>
            <li><a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Follow us</a></li>
          </ul>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </nav>

        <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", fontSize: 28, cursor: "pointer" }}>×</button>
          <a onClick={() => { setMenuOpen(false); document.getElementById("boka")?.scrollIntoView({ behavior: "smooth" }); }}>Book your spot</a>
          <a onClick={() => { setMenuOpen(false); document.getElementById("om")?.scrollIntoView({ behavior: "smooth" }); }}>About us</a>
          <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Follow us</a>
        </div>

        {page === "home" && (
          <>
            {/* HERO */}
            <div className="hero">
              <div className="hero-left">
                <p className="hero-tag">Ramen pop-ups in Skåne</p>
                <h1 className="hero-headline">High quality ramen pop-ups in Skåne.</h1>
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
                <h2>Book the next<br />pop-up here.</h2>
                {events.length > 0 && (
                  <div className="booking-details">
                    <div className="booking-detail-row"><span>Event</span><span>{events[0].title}</span></div>
                    <div className="booking-detail-row"><span>Date</span><span>{events[0].date}</span></div>
                    <div className="booking-detail-row"><span>Time</span><span>{events[0].time}</span></div>
                    <div className="booking-detail-row"><span>Location</span><span>{events[0].location}</span></div>
                    <div className="booking-detail-row"><span>Price</span><span>{events[0].price} kr / person</span></div>
                  </div>
                )}
              </div>
              <div>
                <div className="luma-wrapper">
                  <iframe
                    src="https://luma.com/embed/calendar/cal-S5nOlEyL95gYAMY/events?compact=true"
                    width="600"
                    height="450"
                    frameBorder="0"
                    style={{ border: '1px solid #bfcbda88', borderRadius: '4px' }}
                    allowFullScreen
                    aria-hidden="false"
                    tabIndex={0}
                  ></iframe>
                </div>
              </div>
            </div>

            {/* ABOUT */}
            <div className="about-section" id="om">
              <div className="about-text">
                <h2>Who runs Sansho Ramen?</h2>
                <p>We are two ramen nerds who live in Skåne. Our concept is that we take over a restaurant, café or bar for an evening and try to serve really high-end ramen.</p>
                <p>Every event is exclusive and only has 50–100 spots and the menu always changes.</p>
                <p>If you want to book us for an evening don't hesitate to reach out to us.</p>
                <a href="mailto:contact@sanshoramen.se" className="btn-dark" style={{ marginTop: 8 }}>Get in touch →</a>
              </div>
              <div className="about-img">
                <img src="/team.jpg" alt="Sanshō Ramen team" />
              </div>
            </div>

            {/* SOCIAL */}
            <div className="social-section">
              <h2>@sanshoramen</h2>
              <p>Follow our journey.</p>
              <div className="social-icons">
                <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </a>
                <a href="https://www.tiktok.com/@sansho.ramen" target="_blank" rel="noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>
                  TikTok
                </a>
                <a href="https://youtube.com/@sanshoramen" target="_blank" rel="noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                  YouTube
                </a>
              </div>
            </div>
          </>
        )}

        {/* HIDDEN PAGES */}
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
      </div>

      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-logo"><img src="/logotype.png" alt="Sanshō" /></div>
            <p className="footer-desc">Two ramen nerds in Skåne.</p>
          </div>
          <div className="footer-col">
            <h4>Links</h4>
            <a href="#boka">Book your spot</a>
            <a href="#om">About us</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <p>contact@sanshoramen.se</p>
            <p style={{ marginTop: 12 }}>
              <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://www.tiktok.com/@sansho.ramen" target="_blank" rel="noreferrer">TikTok</a>
              <a href="https://youtube.com/@sanshoramen" target="_blank" rel="noreferrer">YouTube</a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sanshō Ramen.</span>
          <span>Skåne, Sweden</span>
        </div>
      </footer>
    </>
  );
}
