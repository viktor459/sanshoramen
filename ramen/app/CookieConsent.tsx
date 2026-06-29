"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: 20, right: 20, maxWidth: 480,
      background: "#1D1D1D", color: "#F5F1E8", borderRadius: 12, padding: 24,
      zIndex: 9999, fontFamily: "'Quicksand', sans-serif", boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
    }}>
      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, color: "#ddd" }}>
        Vi använder cookies för att förstå hur sajten används (Google Analytics).
      </p>
      <button onClick={accept} style={{
        background: "#F5F1E8", color: "#1D1D1D", border: "none", padding: "10px 24px",
        borderRadius: 100, fontSize: 14, cursor: "pointer", fontFamily: "'Quicksand', sans-serif"
      }}>
        Okej
      </button>
    </div>
  );
}
