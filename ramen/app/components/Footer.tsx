export default function Footer() {
  return (
    <footer style={{ background: "#111", color: "#F5F1E8", padding: "60px 80px 40px", fontFamily: "'Quicksand', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 48 }}>
        <div>
          <img src="/logotype.png" alt="Sanshō" style={{ height: 26, filter: "invert(1)", marginBottom: 20 }} />
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, maxWidth: 260 }}>
            Ramen pop-ups i Skåne. Vi tar över restauranger och barer för en kväll och serverar högkvalitativ ramen.
          </p>
        </div>
        <div>
          <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Utforska</h4>
          {[["Pop-ups", "/pop-ups"], ["Blogg", "/blogg"], ["Shop", "/shop"]].map(([label, href]) => (
            <a key={href} href={href} style={{ display: "block", fontSize: 14, color: "#888", textDecoration: "none", marginBottom: 10 }}
              onMouseOver={e => (e.currentTarget.style.color = "#F5F1E8")}
              onMouseOut={e => (e.currentTarget.style.color = "#888")}>
              {label}
            </a>
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Socialt</h4>
          {[
            ["Instagram", "https://instagram.com/sanshoramen"],
            ["TikTok", "https://www.tiktok.com/@sansho.ramen"],
            ["YouTube", "https://youtube.com/@sanshoramen"],
          ].map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              style={{ display: "block", fontSize: 14, color: "#888", textDecoration: "none", marginBottom: 10 }}
              onMouseOver={e => (e.currentTarget.style.color = "#F5F1E8")}
              onMouseOut={e => (e.currentTarget.style.color = "#888")}>
              {label}
            </a>
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Kontakt</h4>
          <a href="mailto:contact@sanshoramen.se" style={{ display: "block", fontSize: 14, color: "#888", textDecoration: "none", marginBottom: 10 }}>
            contact@sanshoramen.se
          </a>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8 }}>Skåne, Sverige</p>
        </div>
      </div>
      <div style={{ borderTop: "0.5px solid #222", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#333" }}>
        <span>© {new Date().getFullYear()} Sanshō Ramen</span>
        <span>Skåne, Sverige</span>
      </div>
      <style>{`
        @media(max-width:768px){
          footer { padding: 48px 24px 32px !important; }
          footer > div:first-child { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </footer>
  );
}
