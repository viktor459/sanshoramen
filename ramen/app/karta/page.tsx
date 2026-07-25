"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Spot = {
  id: number;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rating: number;
  note: string;
  image_url: string;
  visited_at: string | null;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C9A96E", letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? "★" : "☆").join("")}
    </span>
  );
}

export default function Karta() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [filterCountry, setFilterCountry] = useState("all");

  useEffect(() => {
    supabase.from("ramen_spots").select("*").order("rating", { ascending: false }).then(({ data }) => {
      if (data) setSpots(data);
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [18, 30],
      zoom: 1.8,
      projection: "globe" as any,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || spots.length === 0) return;

    const addMarkers = () => {
      spots.forEach(spot => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: #C9A96E; border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer; transition: transform 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        `;
        el.innerHTML = "🍜";
        el.title = spot.name;
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.2)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
        el.addEventListener("click", () => {
          setSelected(spot);
          map.flyTo({ center: [spot.lng, spot.lat], zoom: 12, duration: 1000 });
        });
        new mapboxgl.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(map);
      });
    };

    if (map.loaded()) addMarkers();
    else map.on("load", addMarkers);
  }, [spots]);

  const countries = [...new Set(spots.map(s => s.country))].sort();
  const filtered = filterCountry === "all" ? spots : spots.filter(s => s.country === filterCountry);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #F5F1E8; --ink: #1D1D1D; --muted: #6B6560; --gold: #C9A96E; }
        body { background: var(--bg); color: var(--ink); font-family: 'Quicksand', sans-serif; font-weight: 300; }
        nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 48px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); }
        .nav-logo img { height: 32px; cursor: pointer; }
        .layout { display: grid; grid-template-columns: 340px 1fr; height: 100vh; padding-top: 88px; }
        .sidebar { overflow-y: auto; border-right: 1.5px solid #DDD8CE; background: var(--bg); }
        .sidebar-head { padding: 24px 24px 16px; border-bottom: 1.5px solid #DDD8CE; }
        .sidebar-title { font-weight: 700; font-size: 24px; letter-spacing: 0.04em; margin-bottom: 4px; }
        .sidebar-sub { font-size: 13px; color: var(--muted); }
        .filter-bar { padding: 12px 24px; border-bottom: 1.5px solid #DDD8CE; }
        .filter-bar select { width: 100%; padding: 8px 12px; border: 1.5px solid #DDD8CE; border-radius: 8px; font-family: inherit; font-size: 13px; background: white; color: var(--ink); appearance: none; }
        .spot-list { padding: 8px 0; }
        .spot-item { padding: 16px 24px; cursor: pointer; border-bottom: 1px solid #EDE9E0; transition: background 0.15s; display: flex; gap: 12px; align-items: flex-start; }
        .spot-item:hover, .spot-item.active { background: #EDE9E0; }
        .spot-img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #DDD8CE; }
        .spot-img-placeholder { width: 52px; height: 52px; border-radius: 8px; background: #DDD8CE; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .spot-info { flex: 1; min-width: 0; }
        .spot-name { font-weight: 600; font-size: 15px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spot-loc { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
        .spot-note { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .map-wrap { position: relative; }
        .map-wrap > div { width: 100%; height: 100%; }
        .detail-card { position: absolute; bottom: 24px; left: 24px; width: 320px; background: var(--bg); border: 1.5px solid #DDD8CE; border-radius: 16px; padding: 20px; z-index: 10; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
        .detail-img { width: 100%; height: 160px; object-fit: cover; border-radius: 10px; margin-bottom: 14px; }
        .detail-name { font-weight: 700; font-size: 18px; margin-bottom: 4px; }
        .detail-loc { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
        .detail-note { font-size: 13px; line-height: 1.6; color: #444; }
        .detail-date { font-size: 11px; color: var(--muted); margin-top: 8px; }
        .close-btn { position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; cursor: pointer; color: var(--muted); }
        .empty { padding: 48px 24px; text-align: center; color: var(--muted); font-size: 14px; }
        @media (max-width: 768px) {
          nav { padding: 20px 24px; }
          .layout { grid-template-columns: 1fr; grid-template-rows: 50vh 1fr; padding-top: 72px; }
          .sidebar { border-right: none; border-top: 1.5px solid #DDD8CE; order: 2; }
          .map-wrap { order: 1; }
          .detail-card { left: 12px; right: 12px; width: auto; bottom: 12px; }
        }
      `}</style>
      <nav>
        <a href="/" className="nav-logo"><img src="/logotype.png" alt="Sanshō" /></a>
      </nav>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-head">
            <div className="sidebar-title">Ramen Map 🗺</div>
            <div className="sidebar-sub">{spots.length} ställen besökta</div>
          </div>
          <div className="filter-bar">
            <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="all">Alla länder ({spots.length})</option>
              {countries.map(c => <option key={c} value={c}>{c} ({spots.filter(s => s.country === c).length})</option>)}
            </select>
          </div>
          <div className="spot-list">
            {filtered.length === 0 && <div className="empty">Inga ställen tillagda än.</div>}
            {filtered.map(spot => (
              <div key={spot.id} className={`spot-item${selected?.id === spot.id ? " active" : ""}`} onClick={() => {
                setSelected(spot);
                mapRef.current?.flyTo({ center: [spot.lng, spot.lat], zoom: 13, duration: 1000 });
              }}>
                {spot.image_url ? <img src={spot.image_url} alt={spot.name} className="spot-img" /> : <div className="spot-img-placeholder">🍜</div>}
                <div className="spot-info">
                  <div className="spot-name">{spot.name}</div>
                  <div className="spot-loc">{spot.city}, {spot.country}</div>
                  <Stars rating={spot.rating} />
                  {spot.note && <div className="spot-note">{spot.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className="map-wrap">
          <div ref={containerRef} />
          {selected && (
            <div className="detail-card">
              <button className="close-btn" onClick={() => setSelected(null)}>×</button>
              {selected.image_url && <img src={selected.image_url} alt={selected.name} className="detail-img" />}
              <div className="detail-name">{selected.name}</div>
              <div className="detail-loc">{selected.city}, {selected.country}</div>
              <Stars rating={selected.rating} />
              {selected.note && <p className="detail-note" style={{ marginTop: 8 }}>{selected.note}</p>}
              {selected.visited_at && <div className="detail-date">Besökt {new Date(selected.visited_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long" })}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
