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
  image_url: string;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function RamenMapEmbed() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);

  useEffect(() => {
    supabase.from("ramen_spots").select("id,name,city,country,lat,lng,rating,image_url").then(({ data }) => {
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
      zoom: 1.3,
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
      const bounds = new mapboxgl.LngLatBounds();
      spots.forEach(spot => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: #C9A96E; border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        `;
        el.innerHTML = "🍜";
        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
          `<div style="font-family:'Quicksand',sans-serif;"><strong>${spot.name}</strong><br/>${spot.city}, ${spot.country}<br/>${"★".repeat(Math.round(spot.rating))}${"☆".repeat(5 - Math.round(spot.rating))}</div>`
        );
        new mapboxgl.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).setPopup(popup).addTo(map);
        bounds.extend([spot.lng, spot.lat]);
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 4, duration: 0 });
    };

    if (map.loaded()) addMarkers();
    else map.on("load", addMarkers);
  }, [spots]);

  return (
    <div style={{ margin: "8px 0 32px" }}>
      <div ref={containerRef} style={{ width: "100%", height: 380, borderRadius: 12, overflow: "hidden", border: "1.5px solid #DDD8CE" }} />
      <a href="/ramen-map" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: "#6B6560", textDecoration: "underline" }}>
        Öppna hela kartan →
      </a>
    </div>
  );
}
