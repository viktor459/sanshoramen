"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_PASSWORD = "sansho2024";

type Event = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  spots_left: number;
  price: number;
  description: string;
  active: boolean;
};

type Timeslot = {
  id: number;
  event_id: number;
  time: string;
  spots: number;
  spots_left: number;
};

type Booking = {
  id: string;
  created_at: string;
  event_name: string;
  fname: string;
  lname: string;
  email: string;
  guests: number;
  note: string;
  total_price: number;
  booking_code: string;
  timeslot_time: string;
  status: string;
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<"events" | "bookings">("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeslots, setTimeslots] = useState<Record<number, Timeslot[]>>({});
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "", spots: "", price: "", description: "" });
  const [newSlot, setNewSlot] = useState({ time: "", spots: "" });
  const [filterEvent, setFilterEvent] = useState<string>("all");

  useEffect(() => {
    if (authed) { fetchEvents(); fetchBookings(); }
  }, [authed]);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("id");
    if (data) {
      setEvents(data);
      data.forEach(e => fetchTimeslots(e.id));
    }
  };

  const fetchTimeslots = async (eventId: number) => {
    const { data } = await supabase.from("timeslots").select("*").eq("event_id", eventId).order("time");
    if (data) setTimeslots(prev => ({ ...prev, [eventId]: data }));
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) setBookings(data);
  };

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.price) return;
    await supabase.from("events").insert([{
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      spots: Number(newEvent.spots),
      spots_left: Number(newEvent.spots),
      price: Number(newEvent.price),
      description: newEvent.description,
      active: true,
    }]);
    setNewEvent({ title: "", date: "", time: "", location: "", spots: "", price: "", description: "" });
    fetchEvents();
  };

  const toggleActive = async (event: Event) => {
    await supabase.from("events").update({ active: !event.active }).eq("id", event.id);
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Ta bort eventet?")) return;
    await supabase.from("timeslots").delete().eq("event_id", id);
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  };

  const addSlot = async () => {
    if (!selectedEventId || !newSlot.time || !newSlot.spots) return;
    await supabase.from("timeslots").insert([{
      event_id: selectedEventId,
      time: newSlot.time,
      spots: Number(newSlot.spots),
      spots_left: Number(newSlot.spots),
    }]);
    setNewSlot({ time: "", spots: "" });
    fetchTimeslots(selectedEventId);
  };

  const deleteSlot = async (id: number, eventId: number) => {
    await supabase.from("timeslots").delete().eq("id", id);
    fetchTimeslots(eventId);
  };

  const exportCSV = () => {
    const filtered = filterEvent === "all" ? bookings : bookings.filter(b => b.event_name === filterEvent);
    const rows = [["Bokningskod", "Namn", "E-post", "Event", "Tid", "Gäster", "Totalt", "Status", "Datum"]];
    filtered.forEach(b => rows.push([b.booking_code, `${b.fname} ${b.lname}`, b.email, b.event_name, b.timeslot_time || "-", String(b.guests), `${b.total_price} kr`, b.status, new Date(b.created_at).toLocaleDateString("sv-SE")]));
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "bokningar.csv"; a.click();
  };

  const filteredBookings = filterEvent === "all" ? bookings : bookings.filter(b => b.event_name === filterEvent);

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');`}</style>
      <div style={{ width: 360, padding: 40, border: "1.5px solid #1D1D1D", borderRadius: 16 }}>
        <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: "0.1em", marginBottom: 32 }}>ADMIN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="Lösenord"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ background: "transparent", border: "1.5px solid #1D1D1D", borderRadius: 8, padding: "12px 16px", fontFamily: "'Quicksand', sans-serif", fontSize: 15, outline: "none" }}
          />
          {pwError && <div style={{ color: "#c0392b", fontSize: 13 }}>Fel lösenord</div>}
          <button onClick={login} style={{ background: "#1D1D1D", color: "#F5F1E8", border: "none", padding: "14px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 15, cursor: "pointer" }}>Logga in</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", padding: "40px 48px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { background: transparent; border: 1.5px solid #1D1D1D; border-radius: 8px; padding: 10px 14px; font-family: 'Quicksand', sans-serif; font-size: 14px; color: #1D1D1D; outline: none; width: 100%; }
        textarea { resize: vertical; min-height: 60px; }
        .btn { background: #1D1D1D; color: #F5F1E8; border: none; padding: 10px 20px; border-radius: 100px; font-family: 'Quicksand', sans-serif; font-size: 14px; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; }
        .btn:hover { opacity: 0.8; }
        .btn-outline { background: transparent; color: #1D1D1D; border: 1.5px solid #1D1D1D; padding: 8px 16px; border-radius: 100px; font-family: 'Quicksand', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-outline:hover { background: #1D1D1D; color: #F5F1E8; }
        .btn-danger { background: transparent; color: #c0392b; border: 1.5px solid #c0392b; padding: 6px 14px; border-radius: 100px; font-family: 'Quicksand', sans-serif; font-size: 12px; cursor: pointer; }
        .btn-danger:hover { background: #c0392b; color: white; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6B6560; padding: 8px 12px; text-align: left; border-bottom: 1.5px solid #1D1D1D; }
        td { font-size: 14px; padding: 12px 12px; border-bottom: 0.5px solid #ccc; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: "0.1em" }}>SANSHŌ ADMIN</div>
        <button className="btn-outline" onClick={() => setAuthed(false)}>Logga ut</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#E8E3D8", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["events", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer", background: tab === t ? "#F5F1E8" : "transparent", fontWeight: tab === t ? 500 : 400 }}>
            {t === "events" ? "Events & Tider" : "Bokningar"}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Lägg till event</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Titel *" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              <input placeholder="Datum (t.ex. Lördag 14 juni) *" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              <input placeholder="Tid (t.ex. 18:00 – 22:00)" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              <input placeholder="Plats" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input placeholder="Antal platser *" type="number" value={newEvent.spots} onChange={e => setNewEvent({ ...newEvent, spots: e.target.value })} />
                <input placeholder="Pris (kr) *" type="number" value={newEvent.price} onChange={e => setNewEvent({ ...newEvent, price: e.target.value })} />
              </div>
              <textarea placeholder="Beskrivning" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              <button className="btn" onClick={addEvent}>Lägg till event</button>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Events ({events.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {events.map(event => (
                <div key={event.id} style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20, opacity: event.active ? 1 : 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{event.title}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{event.date} · {event.location}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{event.spots_left}/{event.spots} platser kvar · {event.price} kr</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="btn-outline" onClick={() => toggleActive(event)}>{event.active ? "Dölj" : "Visa"}</button>
                      <button className="btn-danger" onClick={() => deleteEvent(event.id)}>Ta bort</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, borderTop: "0.5px solid #ccc", paddingTop: 12 }}>
                    <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6560", marginBottom: 8 }}>Tider</div>
                    {(timeslots[event.id] || []).map(slot => (
                      <div key={slot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
                        <span>{slot.time} — {slot.spots_left}/{slot.spots} platser</span>
                        <button className="btn-danger" onClick={() => deleteSlot(slot.id, event.id)}>×</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <input placeholder="Tid (18:00)" value={selectedEventId === event.id ? newSlot.time : ""} onFocus={() => setSelectedEventId(event.id)} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })} style={{ flex: 1 }} />
                      <input placeholder="Platser" type="number" value={selectedEventId === event.id ? newSlot.spots : ""} onFocus={() => setSelectedEventId(event.id)} onChange={e => setNewSlot({ ...newSlot, spots: e.target.value })} style={{ flex: 1 }} />
                      <button className="btn" onClick={() => { setSelectedEventId(event.id); addSlot(); }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Bokningar ({filteredBookings.length})</div>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ width: "auto" }}>
                <option value="all">Alla events</option>
                {[...new Set(bookings.map(b => b.event_name))].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <button className="btn" onClick={exportCSV}>Exportera CSV</button>
          </div>

          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Namn</th>
                  <th>E-post</th>
                  <th>Event</th>
                  <th>Tid</th>
                  <th>Gäster</th>
                  <th>Totalt</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga bokningar än</td></tr>
                )}
                {filteredBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.booking_code}</td>
                    <td>{b.fname} {b.lname}</td>
                    <td style={{ color: "#6B6560" }}>{b.email}</td>
                    <td>{b.event_name}</td>
                    <td>{b.timeslot_time || "—"}</td>
                    <td>{b.guests} pers</td>
                    <td>{b.total_price} kr</td>
                    <td style={{ color: "#6B6560" }}>{new Date(b.created_at).toLocaleDateString("sv-SE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6560", marginBottom: 6 }}>Totalt intäkter</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filteredBookings.reduce((s, b) => s + b.total_price, 0).toLocaleString("sv-SE")} kr</div>
            </div>
            <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6560", marginBottom: 6 }}>Antal bokningar</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filteredBookings.length}</div>
            </div>
            <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B6560", marginBottom: 6 }}>Antal gäster</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{filteredBookings.reduce((s, b) => s + b.guests, 0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}