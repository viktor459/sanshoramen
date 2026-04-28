export default function Tack() {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ width: 72, height: 72, border: "2px solid #1D1D1D", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14.5L11 19.5L22 8.5" stroke="#1D1D1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Betalning genomförd!</h1>
        <p style={{ fontSize: 16, color: "#6B6560", marginBottom: 40 }}>Tack för din bokning. Bekräftelse skickas till din e-post. 🍜</p>
        <a href="/" style={{ background: "#1D1D1D", color: "#F5F1E8", padding: "16px 36px", borderRadius: "100px", textDecoration: "none", fontSize: 16 }}>Tillbaka till startsidan</a>
      </div>
    </div>
  );
}