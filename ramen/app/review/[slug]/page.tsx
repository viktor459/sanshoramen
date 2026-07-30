"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { use } from "react";

export default function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [event, setEvent] = useState<{ title: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("events").select("title").eq("slug", slug).single().then(({ data }) => {
      if (data) setEvent(data);
      else setNotFound(true);
    });
  }, [slug]);

  const submit = async () => {
    if (!rating || !name.trim() || !event) return;
    setLoading(true);
    await supabase.from("reviews").insert([{ event_slug: slug, event_name: event.title, name: name.trim(), rating, comment: comment.trim() }]);
    setLoading(false);
    setDone(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F1E8; color: #1D1D1D; font-family: 'Quicksand', sans-serif; font-weight: 300; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 480px; width: 100%; box-shadow: 0 4px 40px rgba(0,0,0,0.08); }
        .logo { height: 28px; margin-bottom: 32px; }
        .tag { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6B6560; margin-bottom: 10px; }
        .title { font-weight: 700; font-size: 26px; letter-spacing: 0.03em; margin-bottom: 32px; line-height: 1.3; }
        .label { font-size: 13px; color: #6B6560; margin-bottom: 8px; }
        .stars { display: flex; gap: 6px; margin-bottom: 24px; }
        .star { font-size: 36px; cursor: pointer; transition: transform 0.1s; line-height: 1; }
        .star:hover { transform: scale(1.15); }
        .field { margin-bottom: 16px; }
        input, textarea { width: 100%; padding: 12px 16px; border: 1.5px solid #DDD8CE; border-radius: 10px; font-family: 'Quicksand', sans-serif; font-size: 14px; background: #FAFAF8; color: #1D1D1D; outline: none; transition: border-color 0.2s; }
        input:focus, textarea:focus { border-color: #1D1D1D; }
        textarea { min-height: 100px; resize: vertical; }
        .btn { width: 100%; padding: 14px; background: #1D1D1D; color: #F5F1E8; border: none; border-radius: 100px; font-family: 'Quicksand', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; transition: opacity 0.2s; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .done { text-align: center; padding: 20px 0; }
        .done-emoji { font-size: 52px; margin-bottom: 16px; }
        .done-title { font-weight: 700; font-size: 22px; margin-bottom: 8px; }
        .done-sub { font-size: 14px; color: #6B6560; line-height: 1.7; }
      `}</style>

      <div className="card">
        <img src="/logotype.png" alt="Sanshō" className="logo" />

        {notFound && (
          <p style={{ color: "#6B6560" }}>Event hittades inte.</p>
        )}

        {!notFound && !event && (
          <p style={{ color: "#6B6560" }}>Laddar...</p>
        )}

        {event && !done && (
          <>
            <p className="tag">Recension</p>
            <h1 className="title">{event.title}</h1>

            <p className="label">Betyg *</p>
            <div className="stars">
              {[1,2,3,4,5].map(n => (
                <span
                  key={n}
                  className="star"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                >
                  {n <= (hovered || rating) ? "★" : "☆"}
                </span>
              ))}
            </div>

            <div className="field">
              <p className="label">Namn *</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ditt namn" />
            </div>

            <div className="field">
              <p className="label">Kommentar</p>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Vad tyckte du om maten, stämningen, upplevelsen?" />
            </div>

            <button className="btn" onClick={submit} disabled={!rating || !name.trim() || loading}>
              {loading ? "Skickar..." : "Skicka recension →"}
            </button>
          </>
        )}

        {done && (
          <div className="done">
            <div className="done-emoji">🍜</div>
            <h2 className="done-title">Tack för din recension!</h2>
            <p className="done-sub">Det betyder mycket för oss. Vi ses på nästa pop-up!</p>
          </div>
        )}
      </div>
    </>
  );
}
