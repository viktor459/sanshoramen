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

  .month-group { margin-bottom: 48px; }
  .month-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); padding-bottom: 12px; border-bottom: 1.5px solid #DDD8CE; margin-bottom: 16px; }
  .events-list { display: flex; flex-direction: column; gap: 16px; }
  .event-card { display: grid; grid-template-columns: 180px 1fr auto; gap: 0; border: 1.5px solid #DDD8CE; border-radius: 16px; overflow: hidden; cursor: pointer; transition: border-color 0.2s, transform 0.15s; text-decoration: none; color: inherit; }
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

  @media(max-width:768px){
    .page-wrap{padding:100px 24px 60px;}
    .page-title{font-size:36px;}
    .event-card{grid-template-columns:1fr; grid-template-rows:auto 1fr auto;}
    .ec-image{width:100%; min-height:180px;}
    .ec-right{flex-direction:row; padding:0 20px 20px; align-items:center;}
  }
`;

type Event = { id: number; title: string; date: string; time: string; location: string; spots: number; spots_left: number; price: number | null; description: string; active: boolean; image_url?: string; booking_type: "internal" | "on_site" | "external"; external_url?: string; };

export default function PopUps() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    supabase.from("events").select("*").eq("active", true).order("date").then(({ data }) => {
      if (data) setEvents(data);
    });
  }, []);

  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return { day: "—", month: "" };
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const d = new Date(dateStr + "T12:00:00");
      return { day: String(d.getDate()), month: d.toLocaleDateString("en-SE", { month: "short" }).toLowerCase() };
    }
    const parts = dateStr.split(" ");
    return { day: parts[1]?.replace(/\D/g, "") || "—", month: parts[2]?.substring(0, 3) || "" };
  };

  const getMonthYear = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("en-SE", { month: "long", year: "numeric" });
    }
    return "Upcoming";
  };

  const grouped = events.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = getMonthYear(ev.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <>
      <style>{S}</style>
      <div className="page-wrap">
        <p className="page-tag">Events</p>
        <h1 className="page-title">Pop-ups.</h1>
        <p className="page-sub">Exclusive ramen evenings in Skåne. Every event is unique — new menu, new venue. Spots are limited.</p>

        {events.length === 0 ? (
          <div className="empty-state">
            <h3>No upcoming pop-ups right now.</h3>
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
                    const href = isExternal && ev.external_url ? ev.external_url : `/pop-ups/${ev.id}`;
                    const target = isExternal ? "_blank" : undefined;

                    return (
                      <a key={ev.id} href={href} target={target} rel={isExternal ? "noreferrer" : undefined}
                        className="event-card" style={full ? { opacity: 0.55, pointerEvents: "none" } : {}}>
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
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
