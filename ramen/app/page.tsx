"use client";
import { useState } from "react";

const PAGES = ["pop-ups", "om-oss", "kontakt", "blogg", "webbshop"] as const;
type Page = (typeof PAGES)[number] | "home";

const EVENTS = [
  {
    id: 1,
    title: "Tonkotsu Night",
    date: "Onsdag 7 maj",
    time: "18:00 – 22:00",
    location: "Restaurang Nook, Södermalm",
    spots: 20,
    spotsLeft: 5,
    price: 390,
    description: "En kväll dedikerad till den rika, krämiga tonkotsu-buljongen. 18 timmars kokt fläskben, handdragna nudlar och noggrant utvalda toppings.",
  },
  {
    id: 2,
    title: "Shio & Sake Evening",
    date: "Tisdag 21 maj",
    time: "19:00 – 23:00",
    location: "Restaurang Pelikan, Södermalm",
    spots: 24,
    spotsLeft: 14,
    price: 450,
    description: "Shio — den renaste av ramen-stilarna. Klar buljong, havssalt och umami på djupet. Paras med ett kurerat sake-urval från Japan.",
  },
];

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [selectedEvent, setSelectedEvent] = useState<(typeof EVENTS)[0] | null>(null);
  const [booking, setBooking] = useState({ fname: "", lname: "", email: "", guests: "2", note: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");

  const nav = (p: Page) => { setPage(p); setSelectedEvent(null); setConfirmed(false); };

  const handleBook = () => {
    const code = "RMN-" + Math.floor(1000 + Math.random() * 9000);
    setConfirmCode(code);
    setConfirmed(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Freckle+One&family=Quicksand:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F5F1E8;
          --ink: #1D1D1D;
          --ink-light: #6B6560;
          --accent: #1D1D1D;
          --radius: 100px;
        }

        body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }

        .wrap { min-height: 100vh; display: flex; flex-direction: column; }

        /* NAV */
        nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 48px;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: var(--bg);
        }
        .nav-logo { cursor: pointer; }
        .nav-logo img { height: 32px; }
        .nav-links { display: flex; gap: 36px; list-style: none; }
        .nav-links a {
          font-family: 'Quicksand', sans-serif;
          font-weight: 400;
          font-size: 15px;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .nav-links a:hover { opacity: 0.5; }
        .nav-links a.active { border-bottom: 1.5px solid var(--ink); }

        /* HERO */
        .hero {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          padding-top: 88px;
          overflow: hidden;
        }
        .hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 48px 80px 48px;
          gap: 40px;
        }
        .hero-logo img { width: 320px; }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          background: var(--ink);
          color: var(--bg);
          font-family: 'Quicksand', sans-serif;
          font-weight: 400;
          font-size: 16px;
          padding: 16px 36px;
          border-radius: var(--radius);
          border: none;
          cursor: pointer;
          width: fit-content;
          transition: transform 0.2s, opacity 0.2s;
          letter-spacing: 0.01em;
        }
        .hero-btn:hover { transform: scale(1.03); opacity: 0.85; }
        .hero-right {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }
        .hero-right img {
          width: 100%;
          max-width: 1500px;
          object-fit: contain;
          transform: translateX(60px);
          animation: floatIn 1.2s ease forwards;
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateX(80px) translateY(20px); }
          to { opacity: 1; transform: translateX(60px) translateY(0); }
        }

        /* PAGE */
        .page { padding: 120px 48px 80px; max-width: 900px; margin: 0 auto; width: 100%; }
        .page-title {
          font-family: 'Quicksand', sans-serif; font-weight: 700;          
          font-size: 52px;
          letter-spacing: 0.18em;
          margin-bottom: 48px;
          text-transform: uppercase;
        }

        /* EVENTS */
        .events-grid { display: flex; flex-direction: column; gap: 20px; }
        .event-card {
          border: 1.5px solid var(--ink);
          border-radius: 16px;
          padding: 32px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
        }
        .event-card:hover { background: var(--ink); color: var(--bg); transform: translateY(-2px); }
        .event-card:hover .event-meta { color: #ccc; }
        .event-card:hover .event-btn { background: var(--bg); color: var(--ink); }
        .event-name { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; margin-bottom: 8px; }
        .event-meta { font-size: 14px; color: var(--ink-light); line-height: 1.8; transition: color 0.2s; }
        .event-btn {
          background: var(--ink);
          color: var(--bg);
          border: none;
          padding: 14px 28px;
          border-radius: var(--radius);
          font-family: 'Quicksand', sans-serif;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, color 0.2s;
        }
        .spots-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
        .spots-bar { flex: 1; max-width: 160px; height: 3px; background: #ccc; border-radius: 2px; }
        .spots-fill { height: 3px; background: var(--ink); border-radius: 2px; transition: background 0.2s; }
        .event-card:hover .spots-bar { background: #555; }
        .event-card:hover .spots-fill { background: var(--bg); }

        /* BOOKING FORM */
        .booking-back { background: none; border: none; cursor: pointer; font-family: 'Quicksand', sans-serif; font-size: 14px; color: var(--ink-light); margin-bottom: 32px; display: flex; align-items: center; gap: 6px; }
        .booking-back:hover { color: var(--ink); }
        .booking-event-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 36px; letter-spacing: 0.1em; margin-bottom: 6px; }
        .booking-event-sub { font-size: 14px; color: var(--ink-light); margin-bottom: 40px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-field label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-light); }
        .form-field input, .form-field select, .form-field textarea {
          background: transparent;
          border: 1.5px solid var(--ink);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Quicksand', sans-serif;
          font-size: 15px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s;
        }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #888; }
        .form-field textarea { resize: vertical; min-height: 80px; }
        .price-summary { border-top: 1.5px solid var(--ink); padding-top: 20px; margin: 24px 0; }
        .price-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--ink-light); margin-bottom: 8px; }
        .price-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 500; margin-top: 12px; }
        .pay-btn {
          width: 100%;
          background: var(--ink);
          color: var(--bg);
          border: none;
          padding: 18px;
          border-radius: var(--radius);
          font-family: 'Quicksand', sans-serif;
          font-size: 16px;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 8px;
        }
        .pay-btn:hover { opacity: 0.8; }
        .pay-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* CONFIRM */
        .confirm { text-align: center; padding: 60px 0; }
        .confirm-circle { width: 72px; height: 72px; border: 2px solid var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .confirm-code { font-family: 'Quicksand', cursive; font-size: 36px; letter-spacing: 0.15em; margin: 12px 0; }
        .confirm-sub { font-size: 15px; color: var(--ink-light); line-height: 1.7; }

        /* OM OSS */
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
        .about-text { font-size: 16px; line-height: 1.9; }
        .about-text p { margin-bottom: 20px; }
        .about-img { border-radius: 12px; overflow: hidden; }
        .about-img img { width: 100%; object-fit: cover; }

        /* KONTAKT */
        .contact-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
        .contact-info { font-size: 15px; line-height: 2; }
        .contact-info a { color: var(--ink); }

        /* BLOGG */
        .blog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .blog-card { border: 1.5px solid var(--ink); border-radius: 12px; padding: 28px; cursor: pointer; transition: background 0.2s; }
        .blog-card:hover { background: var(--ink); color: var(--bg); }
        .blog-tag { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 10px; }
        .blog-card:hover .blog-tag { color: #aaa; }
        .blog-title { font-family: 'Quicksand', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: 0.06em; margin-bottom: 10px; }
        .blog-excerpt { font-size: 14px; color: var(--ink-light); line-height: 1.7; }
        .blog-card:hover .blog-excerpt { color: #ccc; }

        /* SHOP */
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
          .nav-links { gap: 20px; }
          .nav-links a { font-size: 13px; }
          .hero { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: 0 24px 60px; }
          .hero-logo img { width: 220px; }
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
            {[
              { key: "pop-ups", label: "pop-ups." },
              { key: "blogg", label: "blogg." },
              { key: "om-oss", label: "om oss." },
              { key: "kontakt", label: "kontakt." },
              { key: "webbshop", label: "webbshop." },
            ].map(({ key, label }) => (
              <li key={key}>
                <a
                  className={page === key ? "active" : ""}
                  onClick={() => nav(key as Page)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* HOME */}
        {page === "home" && (
          <div className="hero">
            <div className="hero-left">
              <div className="hero-logo">
                <img src="/logotype.png" alt="Sanshō Ramen" />
              </div>
              <button className="hero-btn" onClick={() => nav("pop-ups")}>
                Next pop-up.
              </button>
            </div>
            <div className="hero-right">
              <img src="/illustration.png" alt="Ramen illustration" />
            </div>
          </div>
        )}

        {/* POP-UPS */}
        {page === "pop-ups" && !selectedEvent && !confirmed && (
          <div className="page">
            <h1 className="page-title">Pop-ups.</h1>
            <div className="events-grid">
              {EVENTS.map((event) => {
                const pct = ((event.spots - event.spotsLeft) / event.spots) * 100;
                return (
                  <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                    <div>
                      <div className="event-name">{event.title}</div>
                      <div className="event-meta">
                        {event.date} · {event.time}<br />
                        {event.location}
                      </div>
                      <div className="spots-row">
                        <div className="spots-bar">
                          <div className="spots-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 13 }}>{event.spotsLeft} platser kvar · {event.price} kr</span>
                      </div>
                    </div>
                    <button className="event-btn">Boka</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOOKING FORM */}
        {page === "pop-ups" && selectedEvent && !confirmed && (
          <div className="page" style={{ maxWidth: 600 }}>
            <button className="booking-back" onClick={() => setSelectedEvent(null)}>← Tillbaka</button>
            <div className="booking-event-title">{selectedEvent.title}</div>
            <div className="booking-event-sub">{selectedEvent.date} · {selectedEvent.location}</div>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 36, color: "var(--ink-light)" }}>{selectedEvent.description}</p>

            <div className="form-grid">
              <div className="form-field">
                <label>Förnamn</label>
                <input value={booking.fname} onChange={e => setBooking({ ...booking, fname: e.target.value })} placeholder="Johan" />
              </div>
              <div className="form-field">
                <label>Efternamn</label>
                <input value={booking.lname} onChange={e => setBooking({ ...booking, lname: e.target.value })} placeholder="Svensson" />
              </div>
            </div>
            <div className="form-field">
              <label>E-post</label>
              <input type="email" value={booking.email} onChange={e => setBooking({ ...booking, email: e.target.value })} placeholder="johan@exempel.se" />
            </div>
            <div className="form-field">
              <label>Antal gäster</label>
              <select value={booking.guests} onChange={e => setBooking({ ...booking, guests: e.target.value })}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "personer"}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Allergier / önskemål</label>
              <textarea value={booking.note} onChange={e => setBooking({ ...booking, note: e.target.value })} placeholder="Glutenfri, laktosintolerant..." />
            </div>

            <div className="price-summary">
              <div className="price-row"><span>{booking.guests} × {selectedEvent.price} kr</span><span>{Number(booking.guests) * selectedEvent.price} kr</span></div>
              <div className="price-row"><span>Bokningsavgift</span><span>0 kr</span></div>
              <div className="price-total"><span>Totalt</span><span>{Number(booking.guests) * selectedEvent.price} kr</span></div>
            </div>

            <button
              className="pay-btn"
              disabled={!booking.fname || !booking.lname || !booking.email.includes("@")}
              onClick={handleBook}
            >
              Betala via Stripe
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
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontSize: 18, fontWeight: 500 }}>Bokning bekräftad!</div>
              <div className="confirm-code">{confirmCode}</div>
              <div className="confirm-sub">Bekräftelse skickas till {booking.email}<br />Vi ses snart. 🍜</div>
              <button className="hero-btn" style={{ margin: "40px auto 0" }} onClick={() => { setConfirmed(false); setSelectedEvent(null); setBooking({ fname: "", lname: "", email: "", guests: "2", note: "" }); }}>
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
                <p>Sanshō är ett ramen pop-up projekt grundat av Viktor och [kompanjon] i Stockholm. Vi tror att ramen är mer än mat — det är en ritual. 18 timmars buljong, handdragna nudlar, och omgivningar som känns som något annat.</p>
                <p>Vi tar med oss köket till utvalda restauranger runt om i Stockholm och skapar tillfälliga upplevelser som inte går att återuppleva. Varje pop-up är ett engångsevent.</p>
                <p>Sanshō är japonska för pepparträdet vars bär ger en unik, elektriserande hetta. Precis som vi vill att vår mat ska kännas.</p>
              </div>
              <div className="about-img">
<img src="/illustration.png" alt="Sanshō" style={{ filter: "invert(1)", background: "#1D1D1D", minWidth: "1500px", padding: "20px", borderRadius: 12 }} />              </div>
            </div>
          </div>
        )}

        {/* KONTAKT */}
        {page === "kontakt" && (
          <div className="page">
            <h1 className="page-title">Kontakt.</h1>
            <div className="contact-layout">
              <div>
                <div className="contact-info">
                  <p style={{ marginBottom: 32, fontSize: 16, lineHeight: 1.9 }}>Frågor om bokningar, samarbeten eller press? Hör av er.</p>
                  <p>✉ <a href="mailto:hej@sanshoramen.se">hej@sanshoramen.se</a></p>
                  <p>📍 Stockholm, Sverige</p>
                  <p style={{ marginTop: 32 }}>
                    <a href="https://instagram.com/sanshoramen" style={{ marginRight: 20 }}>Instagram</a>
                    <a href="#">TikTok</a>
                  </p>
                </div>
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
                { tag: "Guide", title: "Stockholms bästa ramen", excerpt: "Vi har ätit oss igenom stan. Här är vår ärliga lista — inklusive platser som förtjänar mer kärlek." },
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
    </>
  );
}
