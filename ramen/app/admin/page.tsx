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

type Post = {
  id: number;
  created_at: string;
  title: string;
  slug: string;
  tag: string;
  excerpt: string;
  content: string;
  published: boolean;
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<"events" | "bookings" | "blogg">("events");

  // Events
  const [events, setEvents] = useState<Event[]>([]);
  const [timeslots, setTimeslots] = useState<Record<number, Timeslot[]>>({});
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "", spots: "", price: "", description: "" });
  const [newSlot, setNewSlot] = useState({ time: "", spots: "" });

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");

  // Blog
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({ title: "", slug: "", tag: "", excerpt: "", content: "", published: false });
  const [blogView, setBlogView] = useState<"list" | "edit" | "new">("list");

  useEffect(() => {
    if (authed) { fetchEvents(); fetchBookings(); fetchPosts(); }
  }, [authed]);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("id");
    if (data) { setEvents(data); data.forEach(e => fetchTimeslots(e.id)); }
  };

  const fetchTimeslots = async (eventId: number) => {
    const { data } = await supabase.from("timeslots").select("*").eq("event_id", eventId).order("time");
    if (data) setTimeslots(prev => ({ ...prev, [eventId]: data }));
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) setBookings(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.price) return;
    await supabase.from("events").insert([{
      title: newEvent.title, date: newEvent.date, time: newEvent.time,
      location: newEvent.location, spots: Number(newEvent.spots),
      spots_left: Number(newEvent.spots), price: Number(newEvent.price),
      description: newEvent.description, active: true,
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
      event_id: selectedEventId, time: newSlot.time,
      spots: Number(newSlot.spots), spots_left: Number(newSlot.spots),
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

  const slugify = (str: string) => str.toLowerCase().replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const saveNewPost = async () => {
    if (!newPost.title || !newPost.content) return;
    const slug = newPost.slug || slugify(newPost.title);
    await supabase.from("posts").insert([{ ...newPost, slug }]);
    setNewPost({ title: "", slug: "", tag: "", excerpt: "", content: "", published: false });
    setBlogView("list");
    fetchPosts();
  };

  const saveEditPost = async () => {
    if (!editingPost) return;
    await supabase.from("posts").update({
      title: editingPost.title, slug: editingPost.slug, tag: editingPost.tag,
      excerpt: editingPost.excerpt, content: editingPost.content, published: editingPost.published,
    }).eq("id", editingPost.id);
    setEditingPost(null);
    setBlogView("list");
    fetchPosts();
  };

  const togglePublished = async (post: Post) => {
    await supabase.from("posts").update({ published: !post.published }).eq("id", post.id);
    fetchPosts();
  };

  const deletePost = async (id: number) => {
    if (!confirm("Ta bort inlägget?")) return;
    await supabase.from("posts").delete().eq("id", id);
    fetchPosts();
  };

  const filteredBookings = filterEvent === "all" ? bookings : bookings.filter(b => b.event_name === filterEvent);

  const S = {
    page: { minHeight: "100vh", background: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", padding: "40px 48px" } as React.CSSProperties,
    input: { background: "transparent", border: "1.5px solid #1D1D1D", borderRadius: 8, padding: "10px 14px", fontFamily: "'Quicksand', sans-serif", fontSize: 14, color: "#1D1D1D", outline: "none", width: "100%" } as React.CSSProperties,
    textarea: { background: "transparent", border: "1.5px solid #1D1D1D", borderRadius: 8, padding: "10px 14px", fontFamily: "'Quicksand', sans-serif", fontSize: 14, color: "#1D1D1D", outline: "none", width: "100%", resize: "vertical" as const, minHeight: 120 } as React.CSSProperties,
    btn: { background: "#1D1D1D", color: "#F5F1E8", border: "none", padding: "10px 20px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" as const } as React.CSSProperties,
    btnOutline: { background: "transparent", color: "#1D1D1D", border: "1.5px solid #1D1D1D", padding: "8px 16px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" as const } as React.CSSProperties,
    btnDanger: { background: "transparent", color: "#c0392b", border: "1.5px solid #c0392b", padding: "6px 14px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
    card: { border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20 } as React.CSSProperties,
    label: { fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#6B6560", marginBottom: 6, display: "block" } as React.CSSProperties,
  };

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');`}</style>
      <div style={{ width: 360, padding: 40, border: "1.5px solid #1D1D1D", borderRadius: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: "0.1em", marginBottom: 32 }}>ADMIN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="password" placeholder="Lösenord" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} style={S.input} />
          {pwError && <div style={{ color: "#c0392b", fontSize: 13 }}>Fel lösenord</div>}
          <button onClick={login} style={{ ...S.btn, padding: 14 }}>Logga in</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap'); * { box-sizing: border-box; } table { width: 100%; border-collapse: collapse; } th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6B6560; padding: 8px 12px; text-align: left; border-bottom: 1.5px solid #1D1D1D; } td { font-size: 14px; padding: 12px 12px; border-bottom: 0.5px solid #ccc; vertical-align: top; } tr:last-child td { border-bottom: none; }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: "0.1em" }}>SANSHŌ ADMIN</div>
        <button style={S.btnOutline} onClick={() => setAuthed(false)}>Logga ut</button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#E8E3D8", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["events", "bookings", "blogg"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer", background: tab === t ? "#F5F1E8" : "transparent", fontWeight: tab === t ? 500 : 400 }}>
            {t === "events" ? "Events & Tider" : t === "bookings" ? "Bokningar" : "Blogg"}
          </button>
        ))}
      </div>

      {/* EVENTS TAB */}
      {tab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Lägg till event</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={S.input} placeholder="Titel *" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              <input style={S.input} placeholder="Datum (t.ex. Lördag 14 juni) *" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              <input style={S.input} placeholder="Tid (t.ex. 18:00 – 22:00)" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              <input style={S.input} placeholder="Plats" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input style={S.input} placeholder="Antal platser *" type="number" value={newEvent.spots} onChange={e => setNewEvent({ ...newEvent, spots: e.target.value })} />
                <input style={S.input} placeholder="Pris (kr) *" type="number" value={newEvent.price} onChange={e => setNewEvent({ ...newEvent, price: e.target.value })} />
              </div>
              <textarea style={S.textarea} placeholder="Beskrivning" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              <button style={S.btn} onClick={addEvent}>Lägg till event</button>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Events ({events.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {events.map(event => (
                <div key={event.id} style={{ ...S.card, opacity: event.active ? 1 : 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{event.title}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{event.date} · {event.location}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{event.spots_left}/{event.spots} platser · {event.price} kr</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button style={S.btnOutline} onClick={() => toggleActive(event)}>{event.active ? "Dölj" : "Visa"}</button>
                      <button style={S.btnDanger} onClick={() => deleteEvent(event.id)}>Ta bort</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, borderTop: "0.5px solid #ccc", paddingTop: 12 }}>
                    <div style={S.label}>Tider</div>
                    {(timeslots[event.id] || []).map(slot => (
                      <div key={slot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
                        <span>{slot.time} — {slot.spots_left}/{slot.spots} platser</span>
                        <button style={S.btnDanger} onClick={() => deleteSlot(slot.id, event.id)}>×</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Tid (18:00)" value={selectedEventId === event.id ? newSlot.time : ""} onFocus={() => setSelectedEventId(event.id)} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })} />
                      <input style={{ ...S.input, flex: 1 }} placeholder="Platser" type="number" value={selectedEventId === event.id ? newSlot.spots : ""} onFocus={() => setSelectedEventId(event.id)} onChange={e => setNewSlot({ ...newSlot, spots: e.target.value })} />
                      <button style={S.btn} onClick={() => { setSelectedEventId(event.id); addSlot(); }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {tab === "bookings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Bokningar ({filteredBookings.length})</div>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ ...S.input, width: "auto" }}>
                <option value="all">Alla events</option>
                {[...new Set(bookings.map(b => b.event_name))].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <button style={S.btn} onClick={exportCSV}>Exportera CSV</button>
          </div>
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Kod</th><th>Namn</th><th>E-post</th><th>Event</th><th>Tid</th><th>Gäster</th><th>Totalt</th><th>Datum</th></tr></thead>
              <tbody>
                {filteredBookings.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga bokningar än</td></tr>}
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
            {[
              { label: "Totalt intäkter", value: filteredBookings.reduce((s, b) => s + b.total_price, 0).toLocaleString("sv-SE") + " kr" },
              { label: "Antal bokningar", value: String(filteredBookings.length) },
              { label: "Antal gäster", value: String(filteredBookings.reduce((s, b) => s + b.guests, 0)) },
            ].map(m => (
              <div key={m.label} style={S.card}>
                <div style={S.label}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BLOGG TAB */}
      {tab === "blogg" && blogView === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Inlägg ({posts.length})</div>
            <button style={S.btn} onClick={() => setBlogView("new")}>+ Nytt inlägg</button>
          </div>
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Titel</th><th>Kategori</th><th>Status</th><th>Datum</th><th></th></tr></thead>
              <tbody>
                {posts.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga inlägg än — skriv ditt första!</td></tr>}
                {posts.map(post => (
                  <tr key={post.id}>
                    <td style={{ fontWeight: 500 }}>{post.title}</td>
                    <td style={{ color: "#6B6560" }}>{post.tag || "—"}</td>
                    <td>
                      <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: post.published ? "#EAF3DE" : "#F0EDE6", color: post.published ? "#3B6D11" : "#6B6560" }}>
                        {post.published ? "Publicerad" : "Utkast"}
                      </span>
                    </td>
                    <td style={{ color: "#6B6560" }}>{new Date(post.created_at).toLocaleDateString("sv-SE")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={S.btnOutline} onClick={() => { setEditingPost(post); setBlogView("edit"); }}>Redigera</button>
                        <button style={S.btnOutline} onClick={() => togglePublished(post)}>{post.published ? "Avpublicera" : "Publicera"}</button>
                        <button style={S.btnDanger} onClick={() => deletePost(post.id)}>Ta bort</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "blogg" && blogView === "new" && (
        <div style={{ maxWidth: 800 }}>
          <button style={{ ...S.btnOutline, marginBottom: 24 }} onClick={() => setBlogView("list")}>← Tillbaka</button>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Nytt inlägg</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={S.label}>Titel *</label>
              <input style={S.input} placeholder="Tonkotsu på 18 timmar" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value, slug: slugify(e.target.value) })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={S.label}>Kategori</label>
                <input style={S.input} placeholder="Teknik, Guide, Bakom kulisserna..." value={newPost.tag} onChange={e => setNewPost({ ...newPost, tag: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Slug (URL)</label>
                <input style={S.input} placeholder="tonkotsu-pa-18-timmar" value={newPost.slug} onChange={e => setNewPost({ ...newPost, slug: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={S.label}>Ingress (kort beskrivning)</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="En kort beskrivning som visas i blogglistan..." value={newPost.excerpt} onChange={e => setNewPost({ ...newPost, excerpt: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Innehåll *</label>
              <textarea style={{ ...S.textarea, minHeight: 400 }} placeholder="Skriv din artikel här..." value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button style={S.btn} onClick={saveNewPost}>Spara som utkast</button>
              <button style={{ ...S.btn, background: "#2E7D32" }} onClick={() => { setNewPost(p => ({ ...p, published: true })); setTimeout(saveNewPost, 100); }}>Publicera direkt</button>
            </div>
          </div>
        </div>
      )}

      {tab === "blogg" && blogView === "edit" && editingPost && (
        <div style={{ maxWidth: 800 }}>
          <button style={{ ...S.btnOutline, marginBottom: 24 }} onClick={() => { setBlogView("list"); setEditingPost(null); }}>← Tillbaka</button>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Redigera inlägg</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={S.label}>Titel *</label>
              <input style={S.input} value={editingPost.title} onChange={e => setEditingPost({ ...editingPost, title: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={S.label}>Kategori</label>
                <input style={S.input} value={editingPost.tag} onChange={e => setEditingPost({ ...editingPost, tag: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Slug (URL)</label>
                <input style={S.input} value={editingPost.slug} onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={S.label}>Ingress</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }} value={editingPost.excerpt} onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Innehåll *</label>
              <textarea style={{ ...S.textarea, minHeight: 400 }} value={editingPost.content} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={S.btn} onClick={saveEditPost}>Spara ändringar</button>
              <button style={{ ...S.btn, background: editingPost.published ? "#c0392b" : "#2E7D32" }} onClick={() => { setEditingPost(p => p ? { ...p, published: !p.published } : p); setTimeout(saveEditPost, 100); }}>
                {editingPost.published ? "Avpublicera" : "Publicera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}