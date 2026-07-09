"use client";
import { useEffect, useState } from "react";

type BookingData = { booking_code?: string; event_name?: string; fname?: string; guests?: string; };

export default function Tack() {
  const [type, setType] = useState<"booking" | "shop" | "club" | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    if (t === "booking") {
      setType("booking");
      const session_id = params.get("session_id");
      const booking_code = params.get("booking_code");
      if (session_id) {
        fetch(`/api/confirm-booking?session_id=${session_id}`)
          .then(r => r.json())
          .then(data => { setBooking(data); setLoading(false); })
          .catch(() => setLoading(false));
      } else if (booking_code) {
        // Direct booking (no card required)
        setBooking({
          booking_code,
          fname: params.get("fname") || undefined,
          event_name: params.get("event_name") || undefined,
          guests: params.get("guests") || undefined,
        });
        setLoading(false);
      } else setLoading(false);
    } else if (t === "shop") {
      setType("shop");
      setProduct(params.get("product") || "");
      const session_id = params.get("session_id");
      if (session_id) {
        fetch(`/api/confirm-shop?session_id=${session_id}`).catch(() => {});
      }
      setLoading(false);
    } else if (t === "club") {
      setType("club");
      const session_id = params.get("session_id");
      if (session_id) {
        fetch(`/api/confirm-club?session_id=${session_id}`).catch(() => {});
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif", padding: "120px 24px 60px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');`}</style>
      {loading ? (
        <p style={{ color: "#6B6560" }}>Confirming your booking...</p>
      ) : (
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, border: "2px solid #1D1D1D", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14.5L11 19.5L22 8.5" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {type === "booking" && booking ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Booking confirmed!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 28, lineHeight: 1.7 }}>
                Welcome, {booking.fname}! See you soon at {booking.event_name}.
              </p>
              {booking.booking_code && (
                <div style={{ background: "#1D1D1D", color: "#F5F1E8", borderRadius: 12, padding: "24px 32px", marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>Booking code</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.1em" }}>{booking.booking_code}</div>
                </div>
              )}
              <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.7, marginBottom: 36 }}>
                A confirmation has been sent to your email. 🍜
              </p>
            </>
          ) : type === "club" ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome to the club!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 36, lineHeight: 1.7 }}>
                You're now a member of Sanshō Ramen Club. A welcome email is on its way.
              </p>
            </>
          ) : type === "shop" ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Thanks for your order!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 36, lineHeight: 1.7 }}>
                {product && <><strong>{product}</strong> is on its way. </>}A receipt has been sent to your email.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Thank you!</h1>
              <p style={{ fontSize: 15, color: "#6B6560", marginBottom: 36 }}>A confirmation will be sent to your email.</p>
            </>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ background: "#1D1D1D", color: "#F5F1E8", padding: "14px 28px", borderRadius: "100px", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Back to home
            </a>
            <a href="/pop-ups" style={{ background: "transparent", color: "#1D1D1D", border: "1.5px solid #ccc", padding: "13px 28px", borderRadius: "100px", textDecoration: "none", fontSize: 14 }}>
              More pop-ups
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
