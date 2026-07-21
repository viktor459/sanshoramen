export default function Footer() {
  return (
    <>
      <style>{`
        .footer-link { display:block; font-size:14px; color:#888; text-decoration:none; margin-bottom:10px; transition:color 0.2s; }
        .footer-link:hover { color:#F5F1E8; }
        @media(max-width:768px){ .footer-inner{grid-template-columns:1fr !important;gap:36px !important;} footer{padding:48px 24px 32px !important;} }
      `}</style>
      <footer style={{ background: "#111", color: "#F5F1E8", padding: "60px 80px 40px", fontFamily: "'Quicksand', sans-serif" }}>
        <div className="footer-inner" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 48 }}>
          <div>
            <img src="/logotype.png" alt="Sanshō" style={{ height: 26, filter: "invert(1)", marginBottom: 20 }} />
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, maxWidth: 260 }}>
              Ramen pop-ups in Skåne. We take over restaurants and bars for a night and serve high quality ramen.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Explore</h4>
            <a href="/pop-ups" className="footer-link">Pop-ups</a>
            <a href="/blogg" className="footer-link">Blog</a>
            <a href="/shop" className="footer-link">Shop</a>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Social</h4>
            <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer" className="footer-link">Instagram</a>
            <a href="https://www.tiktok.com/@sansho.ramen" target="_blank" rel="noreferrer" className="footer-link">TikTok</a>
            <a href="https://youtube.com/@sanshoramen" target="_blank" rel="noreferrer" className="footer-link">YouTube</a>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", marginBottom: 16 }}>Contact</h4>
            <a href="mailto:contact@sanshoramen.se" className="footer-link">contact@sanshoramen.se</a>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8 }}>Skåne, Sverige</p>
          </div>
        </div>
        <div style={{ borderTop: "0.5px solid #222", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#333" }}>
          <span>© {new Date().getFullYear()} Sanshō Ramen</span>
          <span>Skåne, Sverige</span>
        </div>
      </footer>
    </>
  );
}
