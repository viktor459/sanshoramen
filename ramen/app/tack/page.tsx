"use client";
import { useEffect, useState } from "react";

type BookingData = { booking_code?: string; event_name?: string; fname?: string; guests?: string; };

export default function Tack() {
  const [type, setType] = useState<"booking" | "shop" | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    if (t === "booking") {
      setType("booking");
      const session_id = params.get("session_id");
      if (session_id) {
        fetch(`/api/confirm-booking?session_id=${session_id}`)
          .then(r => r.json())
          .then(data => { setBooking(data); setLoading(false); })
          .catch(() => setLoading(false));
      } else setLoading(false);
    } else if (t === "shop") {
      setType("shop");
      setProduct(params.get("product") || "");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif", padding: "120px 24px 60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');`}</style>
      {loading ? (
        <p style={{ color: "#6B6560" }}>Bekräftar din bokning...</p>
      ) : (
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, border: "2px solid #1D1D1D", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14.5L11 19.5L22 8.5" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {type === "booking" && booking ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Bokning bekräftad!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 28, lineHeight: 1.7 }}>
                Välkommen, {booking.fname}! Vi ses snart på {booking.event_name}.
              </p>
              {booking.booking_code && (
                <div style={{ background: "#1D1D1D", color: "#F5F1E8", borderRadius: 12, padding: "24px 32px", marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>Bokningskod</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.1em" }}>{booking.booking_code}</div>
                </div>
              )}
              <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.7, marginBottom: 36 }}>
                Bekräftelse har skickats till din e-post. 🍜
              </p>
            </>
          ) : type === "shop" ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tack för din beställning!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 36, lineHeight: 1.7 }}>
                {product && <><strong>{product}</strong> är på väg. </>}Kvitto skickas till din e-post.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tack!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 36 }}>Bekräftelse skickas till din e-post.</p>
            </>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ background: "#1D1D1D", color: "#F5F1E8", padding: "14px 28px", borderRadius: "100px", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Till startsidan
            </a>
            <a href="/pop-ups" style={{ background: "transparent", color: "#1D1D1D", border: "1.5px solid #ccc", padding: "13px 28px", borderRadius: "100px", textDecoration: "none", fontSize: 14 }}>
              Fler pop-ups
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
