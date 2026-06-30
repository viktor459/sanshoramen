"use client";
import { useState } from "react";

const NAV_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
  nav { display:flex; align-items:center; justify-content:space-between; padding:22px 48px; position:fixed; top:0; left:0; right:0; z-index:100; background:#F5F1E8; border-bottom:0.5px solid transparent; transition:border-color 0.3s; }
  nav.scrolled { border-bottom-color:#E0DBD0; }
  .nav-logo img { height:28px; }
  .nav-links { display:flex; gap:4px; list-style:none; align-items:center; }
  .nav-links a { font-family:'Quicksand',sans-serif; font-weight:400; font-size:14px; color:#1D1D1D; text-decoration:none; letter-spacing:0.02em; cursor:pointer; padding:8px 14px; border-radius:100px; transition:background 0.15s, opacity 0.15s; }
  .nav-links a:hover { background:#E8E3D8; }
  .nav-links a.cta { background:#1D1D1D; color:#F5F1E8; font-weight:500; }
  .nav-links a.cta:hover { opacity:0.85; background:#1D1D1D; }
  .nav-links a.active { font-weight:500; }
  .hamburger { display:none; flex-direction:column; gap:5px; cursor:pointer; background:none; border:none; padding:4px; }
  .hamburger span { display:block; width:22px; height:1.5px; background:#1D1D1D; border-radius:2px; transition:all 0.2s; }
  .mobile-menu { display:none; position:fixed; inset:0; background:#F5F1E8; z-index:99; flex-direction:column; align-items:center; justify-content:center; gap:24px; }
  .mobile-menu.open { display:flex; }
  .mobile-menu a { font-family:'Quicksand',sans-serif; font-weight:700; font-size:32px; letter-spacing:0.12em; color:#1D1D1D; cursor:pointer; text-transform:uppercase; text-decoration:none; transition:opacity 0.15s; }
  .mobile-menu a:hover { opacity:0.5; }
  .mobile-menu .close-btn { position:absolute; top:24px; right:28px; background:none; border:none; font-size:32px; cursor:pointer; color:#1D1D1D; font-family:'Quicksand',sans-serif; }
  @media(max-width:768px){ nav{padding:18px 24px;} .nav-links{display:none;} .hamburger{display:flex;} }
`;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav>
        <a href="/" className="nav-logo"><img src="/logotype.png" alt="Sanshō Ramen" /></a>
        <ul className="nav-links">
          <li><a href="/pop-ups" className={path === "/pop-ups" ? "active" : ""}>Pop-ups</a></li>
          <li><a href="/blogg" className={path.startsWith("/blogg") ? "active" : ""}>Blogg</a></li>
          <li><a href="/shop" className={path === "/shop" ? "active" : ""}>Shop</a></li>
          <li><a href="/pop-ups" className="cta">Book a spot</a></li>
        </ul>
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Öppna meny">
          <span /><span /><span />
        </button>
      </nav>
      <div className={`mobile-menu${open ? " open" : ""}`}>
        <button className="close-btn" onClick={() => setOpen(false)}>×</button>
        <a href="/pop-ups" onClick={() => setOpen(false)}>Pop-ups</a>
        <a href="/blogg" onClick={() => setOpen(false)}>Blogg</a>
        <a href="/shop" onClick={() => setOpen(false)}>Shop</a>
        <a href="https://instagram.com/sanshoramen" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Instagram</a>
      </div>
    </>
  );
}
