"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, totp }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Wrong password or code.");
        setLoading(false);
      }
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1D1D1D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: "#F5F1E8", marginBottom: 40, textAlign: "center" }}>SANSHŌ ADMIN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ background: "#2A2A2A", border: "1.5px solid #333", borderRadius: 8, padding: "13px 16px", color: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", fontSize: 14, outline: "none" }}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit authenticator code"
            value={totp}
            maxLength={6}
            onChange={e => setTotp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ background: "#2A2A2A", border: "1.5px solid #333", borderRadius: 8, padding: "13px 16px", color: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", fontSize: 14, outline: "none", letterSpacing: "0.2em" }}
          />
          {error && <p style={{ color: "#e74c3c", fontSize: 13, textAlign: "center" }}>{error}</p>}
          <button
            onClick={login}
            disabled={loading || pw.length < 3 || totp.length !== 6}
            style={{ background: "#F5F1E8", color: "#1D1D1D", border: "none", borderRadius: 8, padding: 14, fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: (loading || pw.length < 3 || totp.length !== 6) ? 0.4 : 1, marginTop: 4 }}
          >
            {loading ? "..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
