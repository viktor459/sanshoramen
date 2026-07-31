"use client";
import { useState, useEffect } from "react";

type ConsentState = { necessary: true; analytics: boolean };

function getStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem("cookie-consent-v2");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveConsent(analytics: boolean) {
  const val: ConsentState = { necessary: true, analytics };
  localStorage.setItem("cookie-consent-v2", JSON.stringify(val));
  // Push to GA consent mode
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied",
    });
  }
  if (analytics) {
    // Fire GA page view now that consent is given
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
    if (GA_ID && (window as any).gtag) {
      (window as any).gtag("config", GA_ID, { page_path: window.location.pathname });
    }
  }
}

export function getAnalyticsConsent(): boolean {
  const stored = getStored();
  return stored?.analytics ?? false;
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);

  useEffect(() => {
    if (!getStored()) setShow(true);
  }, []);

  const accept = (analytics: boolean) => {
    saveConsent(analytics);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: 20, right: 20, maxWidth: 500,
      background: "#1D1D1D", color: "#F5F1E8", borderRadius: 16, padding: 24,
      zIndex: 9999, fontFamily: "'Quicksand', sans-serif", boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, letterSpacing: "0.03em" }}>
        Vi använder cookies 🍪
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16, color: "#bbb" }}>
        Vi använder nödvändiga cookies för att sajten ska fungera, samt analytics-cookies (Google Analytics) för att förstå hur sajten används. Läs mer i vår{" "}
        <a href="/cookiepolicy" style={{ color: "#F5F1E8", textDecoration: "underline" }}>cookiepolicy</a>.
      </p>

      {showDetails && (
        <div style={{ background: "#2a2a2a", borderRadius: 10, padding: 16, marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Nödvändiga cookies</div>
              <div style={{ color: "#888", fontSize: 12 }}>Inloggning, sessioner. Kan inte stängas av.</div>
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>Alltid på</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Analytics (Google Analytics)</div>
              <div style={{ color: "#888", fontSize: 12 }}>Sidvisningar, trafik. Ingen persondata sparas.</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={e => setAnalyticsChecked(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#F5F1E8" }}
              />
              <span style={{ fontSize: 12, color: "#aaa" }}>{analyticsChecked ? "På" : "Av"}</span>
            </label>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => accept(true)} style={{
          background: "#F5F1E8", color: "#1D1D1D", border: "none",
          padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "'Quicksand', sans-serif",
        }}>
          Acceptera alla
        </button>
        {showDetails ? (
          <button onClick={() => accept(analyticsChecked)} style={{
            background: "transparent", color: "#F5F1E8", border: "1.5px solid #444",
            padding: "10px 20px", borderRadius: 100, fontSize: 13,
            cursor: "pointer", fontFamily: "'Quicksand', sans-serif",
          }}>
            Spara val
          </button>
        ) : (
          <button onClick={() => setShowDetails(true)} style={{
            background: "transparent", color: "#aaa", border: "1.5px solid #333",
            padding: "10px 20px", borderRadius: 100, fontSize: 13,
            cursor: "pointer", fontFamily: "'Quicksand', sans-serif",
          }}>
            Hantera val
          </button>
        )}
        <button onClick={() => accept(false)} style={{
          background: "transparent", color: "#666", border: "none",
          padding: "10px 12px", borderRadius: 100, fontSize: 12,
          cursor: "pointer", fontFamily: "'Quicksand', sans-serif",
        }}>
          Avböj alla
        </button>
      </div>
    </div>
  );
}
