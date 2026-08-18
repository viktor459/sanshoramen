"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

type Event = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  spots_left: number;
  price: number | null;
  description: string;
  active: boolean;
  archived: boolean;
  image_url?: string;
  booking_type: "internal" | "on_site" | "external";
  external_url?: string;
  require_card: boolean;
  require_stuk: boolean;
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
  vegetarian_count: number;
  note: string;
  total_price: number;
  booking_code: string;
  timeslot_id?: number;
  timeslot_time: string;
  event_id: number;
  status: string;
  phone?: string;
};

type ShopOrder = {
  id: number;
  created_at: string;
  product_name: string;
  quantity: number;
  total_price: number;
  email: string;
  status: string;
  stripe_session_id?: string;
};

type Post = {
  id: number;
  created_at: string;
  title: string;
  slug: string;
  tag: string;
  excerpt: string;
  content: string;
  image_url?: string;
  published: boolean;
};

type Product = { id: number; name: string; description: string; price: number; image_url: string; category: string; active: boolean };
type WaitlistEntry = { id: number; created_at: string; event_id: number; event_name: string; fname: string; lname: string; email: string; phone?: string; guests: number; vegetarian_count: number; note: string; };
type RamenSpot = { id: number; name: string; city: string; country: string; lat: number; lng: number; rating: number; note: string; image_url: string; visited_at: string; };
type Review = { id: number; created_at: string; event_name: string; event_slug: string; name: string; rating: number; comment: string; };
type StalletPref = { id: number; created_at: string; name: string; email: string; preferred_time: string; guests: number; };

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
  }
  return dateStr;
};

export default function Admin() {
  const [tab, setTab] = useState<"events" | "bookings" | "blogg" | "products" | "ordrar" | "waitlist" | "karta" | "recensioner" | "stallet" | "nyhetsbrev" | "lojalitet" | "analytics">("events");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Events
  const [events, setEvents] = useState<Event[]>([]);
  const [timeslots, setTimeslots] = useState<Record<number, Timeslot[]>>({});
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", timeStart: "", timeEnd: "", location: "", spots: "", price: "", description: "", image_url: "", booking_type: "internal" as "internal" | "on_site" | "external", external_url: "", require_card: true, require_stuk: false });
  const eventFileInputRef = useRef<HTMLInputElement | null>(null);
  const editEventFileInputRef = useRef<HTMLInputElement | null>(null);
  const [newSlot, setNewSlot] = useState({ time: "", spots: "" });
  const [editingSlot, setEditingSlot] = useState<{ id: number; spots: string; spots_left: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventsView, setEventsView] = useState<"add" | "edit">("add");

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterWaitlistEvent, setFilterWaitlistEvent] = useState<string>("all");
  const [showArchivedBookings, setShowArchivedBookings] = useState(false);
  const [showArchivedWaitlist, setShowArchivedWaitlist] = useState(false);
  const [editingGuests, setEditingGuests] = useState<{ id: string; value: string } | null>(null);
  const [editingVeg, setEditingVeg] = useState<{ id: string; value: string } | null>(null);
  const [editingEventSpots, setEditingEventSpots] = useState<{ id: number; spots: string; spots_left: string } | null>(null);
  const [manualBooking, setManualBooking] = useState<{ eventId: number; slotId: string } | null>(null);
  const [manualForm, setManualForm] = useState({ fname: "", lname: "", email: "", phone: "", guests: "1", note: "", vegetarian_count: "0" });

  // Shop orders
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);

  // Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stalletPrefs, setStalletPrefs] = useState<StalletPref[]>([]);
  const [filterReviewEvent, setFilterReviewEvent] = useState("all");
  const [subscribers, setSubscribers] = useState<{ id: number; created_at: string; email: string }[]>([]);
  type LoyaltyEntry = { email: string; name: string; luma_events: number; system_events: number; total: number };
  const [loyalty, setLoyalty] = useState<LoyaltyEntry[]>([]);
  type GAStats = { totalSessions: number; totalUsers: number; bounceRate: number; avgSessionDuration: number; daily: {date:string;sessions:number;users:number}[]; topPages: {path:string;views:number}[]; sources: {channel:string;sessions:number}[]; devices: {device:string;sessions:number}[]; newVsReturning: {type:string;sessions:number}[]; countries: {country:string;sessions:number}[]; hours: {hour:number;sessions:number}[] };
  const [gaStats, setGaStats] = useState<GAStats | null>(null);
  const [gaLoading, setGaLoading] = useState(false);

  // Ramen Map
  const [spots, setSpots] = useState<RamenSpot[]>([]);
  const [editingSpot, setEditingSpot] = useState<RamenSpot | null>(null);
  const [newSpot, setNewSpot] = useState({ name: "", city: "", country: "", lat: "", lng: "", rating: "4", note: "", image_url: "", visited_at: "" });

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", image_url: "", category: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Blog
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({ title: "", slug: "", tag: "", excerpt: "", content: "", image_url: "", published: false });
  const [blogView, setBlogView] = useState<"list" | "edit" | "new">("list");

  useEffect(() => {
    fetchEvents(); fetchBookings(); fetchPosts(); fetchProducts(); fetchShopOrders(); fetchWaitlist(); fetchSpots(); fetchReviews(); fetchStalletPrefs(); fetchSubscribers(); fetchLoyalty();
  }, []);

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

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id");
    if (data) setProducts(data);
  };

  const fetchShopOrders = async () => {
    const { data } = await supabase.from("shop_orders").select("*").order("created_at", { ascending: false });
    if (data) {
      setShopOrders(data);
      // Auto-sync pending orders against Stripe
      const pending = data.filter(o => o.status === "pending" && o.stripe_session_id);
      for (const o of pending) {
        fetch("/api/sync-shop-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: o.id, stripe_session_id: o.stripe_session_id }),
        }).then(r => r.json()).then(res => {
          if (res.status === "paid") {
            setShopOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "paid" } : x));
          }
        }).catch(() => {});
      }
    }
  };

  const fetchWaitlist = async () => {
    const { data } = await supabase.from("waitlist").select("*").order("created_at", { ascending: true });
    if (data) setWaitlist(data);
  };

  const deleteWaitlistEntry = async (id: number) => {
    await supabase.from("waitlist").delete().eq("id", id);
    fetchWaitlist();
  };

  const fetchLoyalty = async () => {
    const [{ data: luma }, { data: bks }] = await Promise.all([
      supabase.from("luma_members").select("email, name, luma_events, excluded"),
      supabase.from("bookings").select("email, event_name").eq("status", "confirmed"),
    ]);
    const excludedEmails = new Set((luma || []).filter(l => l.excluded).map(l => l.email.toLowerCase()));
    // Count distinct events per email from system bookings
    const systemEvents: Record<string, Set<string>> = {};
    (bks || []).forEach(b => {
      const e = b.email?.toLowerCase();
      if (e && b.event_name) {
        if (!systemEvents[e]) systemEvents[e] = new Set();
        systemEvents[e].add(b.event_name);
      }
    });
    const systemCount: Record<string, number> = {};
    Object.entries(systemEvents).forEach(([e, s]) => { systemCount[e] = s.size; });
    const map: Record<string, LoyaltyEntry> = {};
    (luma || []).filter(l => !l.excluded).forEach(l => {
      const e = l.email.toLowerCase();
      map[e] = { email: e, name: l.name || "", luma_events: l.luma_events, system_events: systemCount[e] || 0, total: l.luma_events + (systemCount[e] || 0) };
    });
    Object.entries(systemCount).forEach(([e, cnt]) => {
      if (!map[e] && !excludedEmails.has(e)) map[e] = { email: e, name: "", luma_events: 0, system_events: cnt, total: cnt };
    });
    setLoyalty(Object.values(map).sort((a, b) => b.total - a.total));
  };

  const fetchSubscribers = async () => {
    const { data } = await supabase.from("subscribers").select("id, created_at, email").order("created_at", { ascending: false });
    if (data) setSubscribers(data);
  };

  const fetchStalletPrefs = async () => {
    const { data } = await supabase.from("stallet_preferences").select("*").order("preferred_time").order("created_at");
    if (data) setStalletPrefs(data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (data) setReviews(data);
  };

  const deleteReview = async (id: number) => {
    await supabase.from("reviews").delete().eq("id", id);
    fetchReviews();
  };

  const fetchSpots = async () => {
    const { data } = await supabase.from("ramen_spots").select("*").order("rating", { ascending: false });
    if (data) setSpots(data);
  };

  const saveNewSpot = async () => {
    if (!newSpot.name || !newSpot.city || !newSpot.country || !newSpot.lat || !newSpot.lng) return;
    await supabase.from("ramen_spots").insert([{ ...newSpot, lat: parseFloat(newSpot.lat), lng: parseFloat(newSpot.lng), rating: parseFloat(newSpot.rating) }]);
    setNewSpot({ name: "", city: "", country: "", lat: "", lng: "", rating: "4", note: "", image_url: "", visited_at: "" });
    fetchSpots();
  };

  const saveEditSpot = async () => {
    if (!editingSpot) return;
    await supabase.from("ramen_spots").update({ name: editingSpot.name, city: editingSpot.city, country: editingSpot.country, lat: editingSpot.lat, lng: editingSpot.lng, rating: editingSpot.rating, note: editingSpot.note, image_url: editingSpot.image_url, visited_at: editingSpot.visited_at }).eq("id", editingSpot.id);
    setEditingSpot(null);
    fetchSpots();
  };

  const deleteSpot = async (id: number) => {
    if (!confirm("Ta bort stället?")) return;
    await supabase.from("ramen_spots").delete().eq("id", id);
    fetchSpots();
  };

  const deleteShopOrder = async (id: number) => {
    if (!confirm("Ta bort ordern?")) return;
    await supabase.from("shop_orders").delete().eq("id", id);
    fetchShopOrders();
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(filename, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(filename);
    return data.publicUrl;
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    await supabase.from("products").insert([{ ...newProduct, price: Number(newProduct.price), active: true }]);
    setNewProduct({ name: "", description: "", price: "", image_url: "", category: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchProducts();
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    await supabase.from("products").update({
      name: editingProduct.name, description: editingProduct.description,
      price: editingProduct.price, image_url: editingProduct.image_url,
      category: editingProduct.category, active: editingProduct.active,
    }).eq("id", editingProduct.id);
    setEditingProduct(null);
    fetchProducts();
  };

  const toggleProductActive = async (p: Product) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Ta bort produkten?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const toSlug = (s: string) => s.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    const time = [newEvent.timeStart, newEvent.timeEnd].filter(Boolean).join(" – ");
    await supabase.from("events").insert([{
      title: newEvent.title, date: newEvent.date, time,
      location: newEvent.location, spots: Number(newEvent.spots),
      spots_left: Number(newEvent.spots),
      price: newEvent.price ? Number(newEvent.price) : null,
      description: newEvent.description, active: true,
      image_url: newEvent.image_url || null,
      booking_type: newEvent.booking_type,
      external_url: newEvent.external_url || null,
      require_card: newEvent.require_card,
      require_stuk: newEvent.require_stuk,
      slug: toSlug(newEvent.title),
    }]);
    setNewEvent({ title: "", date: "", timeStart: "", timeEnd: "", location: "", spots: "", price: "", description: "", image_url: "", booking_type: "internal", external_url: "", require_card: true, require_stuk: false });
    if (eventFileInputRef.current) eventFileInputRef.current.value = "";
    fetchEvents();
  };

  const saveEditEvent = async () => {
    if (!editingEvent) return;
    await supabase.from("events").update({
      title: editingEvent.title, date: editingEvent.date, time: editingEvent.time,
      location: editingEvent.location, spots: editingEvent.spots, spots_left: editingEvent.spots_left,
      price: editingEvent.price || null, description: editingEvent.description, active: editingEvent.active,
      image_url: editingEvent.image_url || null,
      booking_type: editingEvent.booking_type,
      external_url: editingEvent.external_url || null,
      require_card: editingEvent.require_card,
      require_stuk: editingEvent.require_stuk,
      slug: toSlug(editingEvent.title),
    }).eq("id", editingEvent.id);
    setEditingEvent(null);
    setEventsView("add");
    fetchEvents();
  };

  const toggleActive = async (event: Event) => {
    await supabase.from("events").update({ active: !event.active }).eq("id", event.id);
    fetchEvents();
  };

  const archiveEvent = async (event: Event) => {
    if (!confirm(`Arkivera "${event.title}"? Det tas bort från förstasidan och syns suddigt på pop-up sidan.`)) return;
    await supabase.from("events").update({ archived: true, active: false }).eq("id", event.id);
    fetchEvents();
  };

  const unarchiveEvent = async (event: Event) => {
    await supabase.from("events").update({ archived: false, active: true }).eq("id", event.id);
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm("Ta bort eventet?")) return;
    await supabase.from("timeslots").delete().eq("event_id", id);
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  };

  const duplicateEvent = async (event: Event) => {
    const { data: newEvent } = await supabase.from("events").insert([{
      title: `${event.title} (kopia)`,
      date: event.date,
      time: event.time,
      location: event.location,
      spots: event.spots,
      spots_left: event.spots,
      price: event.price,
      description: event.description,
      active: false,
      archived: false,
      image_url: event.image_url || null,
      booking_type: event.booking_type,
      external_url: event.external_url || null,
      require_card: event.require_card,
      require_stuk: event.require_stuk,
      slug: toSlug(`${event.title} kopia ${Date.now()}`),
    }]).select("id").single();
    if (newEvent) {
      const slots = timeslots[event.id] || [];
      if (slots.length > 0) {
        await supabase.from("timeslots").insert(slots.map(s => ({
          event_id: newEvent.id, time: s.time, spots: s.spots, spots_left: s.spots,
        })));
      }
    }
    fetchEvents();
  };

  const addSlot = async (eventId: number) => {
    if (!newSlot.time || !newSlot.spots) return;
    await supabase.from("timeslots").insert([{
      event_id: eventId, time: newSlot.time,
      spots: Number(newSlot.spots), spots_left: Number(newSlot.spots),
    }]);
    setNewSlot({ time: "", spots: "" });
    fetchTimeslots(eventId);
  };

  const deleteSlot = async (id: number, eventId: number) => {
    await supabase.from("timeslots").delete().eq("id", id);
    fetchTimeslots(eventId);
  };

  const saveEventSpots = async () => {
    if (!editingEventSpots) return;
    await supabase.from("events").update({ spots: Number(editingEventSpots.spots), spots_left: Number(editingEventSpots.spots_left) }).eq("id", editingEventSpots.id);
    setEditingEventSpots(null);
    fetchEvents();
  };

  const addManualBooking = async () => {
    if (!manualBooking || !manualForm.fname || !manualForm.email) return;
    const ev = events.find(e => e.id === manualBooking.eventId);
    if (!ev) return;
    const booking_code = "SR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const slotId = manualBooking.slotId ? Number(manualBooking.slotId) : null;
    const slot = slotId ? (timeslots[manualBooking.eventId] || []).find(s => s.id === slotId) : null;
    await supabase.from("bookings").insert([{
      event_id: ev.id,
      event_name: ev.title,
      fname: manualForm.fname,
      lname: manualForm.lname,
      email: manualForm.email,
      phone: manualForm.phone || null,
      guests: Number(manualForm.guests),
      vegetarian_count: Number(manualForm.vegetarian_count),
      note: manualForm.note,
      total_price: 0,
      booking_code,
      status: "confirmed",
      timeslot_id: slotId,
      timeslot_time: slot?.time || null,
    }]);
    if (slotId) {
      await supabase.rpc("decrement_timeslot_spots", { slot_id: slotId, n: Number(manualForm.guests) }).maybeSingle();
    } else {
      await supabase.rpc("decrement_event_spots", { ev_id: ev.id, n: Number(manualForm.guests) }).maybeSingle();
    }
    setManualBooking(null);
    setManualForm({ fname: "", lname: "", email: "", phone: "", guests: "1", note: "", vegetarian_count: "0" });
    fetchBookings();
    fetchEvents();
    fetchTimeslots(ev.id);
    alert(`Bokning skapad! Kod: ${booking_code}`);
  };

  const saveSlotSpots = async (id: number, eventId: number, spots: number, spots_left: number) => {
    await supabase.from("timeslots").update({ spots, spots_left }).eq("id", id);
    setEditingSlot(null);
    fetchTimeslots(eventId);
  };

  const promoteWaitlistEntry = async (w: WaitlistEntry) => {
    if (!confirm(`Flytta ${w.fname} ${w.lname} till eventet? De får ingen automatisk bokningskod.`)) return;
    const booking_code = "SR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase.from("bookings").insert([{
      event_id: w.event_id,
      event_name: w.event_name,
      fname: w.fname,
      lname: w.lname,
      email: w.email,
      phone: w.phone || null,
      guests: w.guests,
      vegetarian_count: w.vegetarian_count ?? 0,
      note: w.note || "",
      total_price: 0,
      booking_code,
      status: "confirmed",
    }]);
    await supabase.rpc("decrement_event_spots", { ev_id: w.event_id, n: w.guests }).maybeSingle();
    await supabase.from("waitlist").delete().eq("id", w.id);
    fetchBookings();
    fetchWaitlist();
    fetchEvents();
    alert(`${w.fname} ${w.lname} är nu bokad med kod ${booking_code}.`);
  };

  const confirmBooking = async (id: string) => {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "confirmed" } : b));
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Ta bort bokningen?")) return;
    const booking = bookings.find(b => b.id === id);
    await supabase.from("bookings").delete().eq("id", id);
    if (booking) {
      if (booking.timeslot_id) {
        await supabase.rpc("increment_timeslot_spots", { slot_id: booking.timeslot_id, n: booking.guests }).maybeSingle();
      } else {
        await supabase.rpc("increment_event_spots", { ev_id: booking.event_id, n: booking.guests }).maybeSingle();
      }
    }
    fetchBookings();
    fetchEvents();
  };

  const saveGuests = async (id: string, value: string) => {
    const n = parseInt(value);
    if (!isNaN(n) && n > 0) {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        const diff = booking.guests - n; // positive = freed up spots, negative = used more
        await supabase.from("bookings").update({ guests: n }).eq("id", id);
        if (booking.timeslot_id) {
          await supabase.rpc("increment_timeslot_spots", { slot_id: booking.timeslot_id, n: diff }).maybeSingle();
        } else {
          await supabase.rpc("increment_event_spots", { ev_id: booking.event_id, n: diff }).maybeSingle();
        }
      }
      fetchBookings();
    }
    setEditingGuests(null);
  };

  const saveVeg = async (id: string, value: string) => {
    const n = parseInt(value);
    if (!isNaN(n) && n >= 0) {
      await supabase.from("bookings").update({ vegetarian_count: n }).eq("id", id);
      fetchBookings();
    }
    setEditingVeg(null);
  };

  const deleteAllVisible = async () => {
    const filtered = filteredBookings;
    if (!confirm(`Ta bort ${filtered.length} bokningar permanent?`)) return;
    await supabase.from("bookings").delete().in("id", filtered.map(b => b.id));
    fetchBookings();
  };

  const exportCSV = () => {
    const filtered = filteredBookings;
    const rows = [["Bokningskod", "Namn", "E-post", "Event", "Tid", "Gäster", "Veggie", "Totalt", "Status", "Datum"]];
    filtered.forEach(b => rows.push([b.booking_code, `${b.fname} ${b.lname}`, b.email, b.event_name, b.timeslot_time || "-", String(b.guests), String(b.vegetarian_count ?? 0), `${b.total_price} kr`, b.status, new Date(b.created_at).toLocaleDateString("sv-SE")]));
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
    setNewPost({ title: "", slug: "", tag: "", excerpt: "", content: "", image_url: "", published: false });
    setBlogView("list");
    fetchPosts();
  };

  const saveEditPost = async () => {
    if (!editingPost) return;
    await supabase.from("posts").update({
      title: editingPost.title, slug: editingPost.slug, tag: editingPost.tag,
      excerpt: editingPost.excerpt, content: editingPost.content, image_url: editingPost.image_url || null, published: editingPost.published,
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

  const archivedEventNames = new Set(events.filter(e => e.archived).map(e => e.title));
  const filteredBookings = bookings
    .filter(b => showArchivedBookings || !archivedEventNames.has(b.event_name))
    .filter(b => filterEvent === "all" || b.event_name === filterEvent);

  const mapsEmbedUrl = (location: string) =>
    location ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed` : null;

  const S = {
    page: { minHeight: "100vh", background: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", padding: "100px 48px 40px" } as React.CSSProperties,
    input: { background: "transparent", border: "1.5px solid #1D1D1D", borderRadius: 8, padding: "10px 14px", fontFamily: "'Quicksand', sans-serif", fontSize: 14, color: "#1D1D1D", outline: "none", width: "100%" } as React.CSSProperties,
    textarea: { background: "transparent", border: "1.5px solid #1D1D1D", borderRadius: 8, padding: "10px 14px", fontFamily: "'Quicksand', sans-serif", fontSize: 14, color: "#1D1D1D", outline: "none", width: "100%", resize: "vertical" as const, minHeight: 120 } as React.CSSProperties,
    btn: { background: "#1D1D1D", color: "#F5F1E8", border: "none", padding: "10px 20px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" as const } as React.CSSProperties,
    btnOutline: { background: "transparent", color: "#1D1D1D", border: "1.5px solid #1D1D1D", padding: "8px 16px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" as const } as React.CSSProperties,
    btnDanger: { background: "transparent", color: "#c0392b", border: "1.5px solid #c0392b", padding: "6px 14px", borderRadius: 100, fontFamily: "'Quicksand', sans-serif", fontSize: 12, cursor: "pointer" } as React.CSSProperties,
    card: { border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 20 } as React.CSSProperties,
    label: { fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#6B6560", marginBottom: 6, display: "block" } as React.CSSProperties,
  };

  const ImageUploadField = ({
    value, onChange, inputRef,
  }: {
    value: string;
    onChange: (url: string) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div>
      <label style={S.label}>Produktbild</label>
      <div
        style={{ border: "1.5px dashed #1D1D1D", borderRadius: 8, padding: "16px", textAlign: "center", cursor: "pointer", background: "transparent" }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={value} alt="" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 6, objectFit: "cover" }} />
            <button
              style={{ position: "absolute", top: -8, right: -8, background: "#c0392b", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 14, lineHeight: "1" }}
              onClick={e => { e.stopPropagation(); onChange(""); if (inputRef.current) inputRef.current.value = ""; }}
            >×</button>
          </div>
        ) : (
          <div style={{ color: "#6B6560", fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>↑</div>
            <div>Klicka för att ladda upp bild</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG, WebP</div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploadingImage(true);
          try {
            const url = await uploadImage(file);
            onChange(url);
          } catch {
            alert("Uppladdning misslyckades");
          } finally {
            setUploadingImage(false);
          }
        }}
      />
      {uploadingImage && <div style={{ fontSize: 12, color: "#6B6560", marginTop: 6 }}>Laddar upp...</div>}
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap'); * { box-sizing: border-box; } table { width: 100%; border-collapse: collapse; } th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6B6560; padding: 8px 12px; text-align: left; border-bottom: 1.5px solid #1D1D1D; } td { font-size: 14px; padding: 12px 12px; border-bottom: 0.5px solid #ccc; vertical-align: top; } tr:last-child td { border-bottom: none; } input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: "0.1em" }}>SANSHŌ ADMIN</div>
        <button style={S.btnOutline} onClick={async () => { await fetch("/api/admin-logout", { method: "POST" }); window.location.href = "/admin/login"; }}>Log out</button>
      </div>

      <div ref={navRef} style={{ display: "flex", gap: 4, marginBottom: 32, background: "#E8E3D8", borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
        {/* Bokningar dropdown */}
        {(() => {
          const inGroup = ["events","bookings","waitlist"].includes(tab);
          const label = tab === "events" ? "Events & Tider" : tab === "bookings" ? "Bokningar" : tab === "waitlist" ? "Waitlist" : "Bokningar";
          return (
            <div style={{ position: "relative" }}>
              <button onClick={() => setOpenDropdown(openDropdown === "bokningar" ? null : "bokningar")}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Quicksand',sans-serif", fontSize: 14, cursor: "pointer", background: inGroup ? "#F5F1E8" : "transparent", fontWeight: inGroup ? 500 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                {inGroup ? label : "Bokningar"} ▾
              </button>
              {openDropdown === "bokningar" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 10, padding: 6, zIndex: 100, minWidth: 170, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                  {(["events","bookings","waitlist"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setOpenDropdown(null); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderRadius: 7, fontFamily: "'Quicksand',sans-serif", fontSize: 14, cursor: "pointer", background: tab === t ? "#F5F1E8" : "transparent", fontWeight: tab === t ? 600 : 400 }}>
                      {t === "events" ? "Events & Tider" : t === "bookings" ? `Bokningar (${bookings.length})` : `Waitlist${waitlist.length > 0 ? ` (${waitlist.length})` : ""}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Shop dropdown */}
        {(() => {
          const inGroup = ["products","ordrar"].includes(tab);
          const label = tab === "products" ? "Produkter" : tab === "ordrar" ? "Ordrar" : "Shop";
          return (
            <div style={{ position: "relative" }}>
              <button onClick={() => setOpenDropdown(openDropdown === "shop" ? null : "shop")}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Quicksand',sans-serif", fontSize: 14, cursor: "pointer", background: inGroup ? "#F5F1E8" : "transparent", fontWeight: inGroup ? 500 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                {inGroup ? label : "Shop"} ▾
              </button>
              {openDropdown === "shop" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 10, padding: 6, zIndex: 100, minWidth: 150, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                  {(["products","ordrar"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setOpenDropdown(null); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderRadius: 7, fontFamily: "'Quicksand',sans-serif", fontSize: 14, cursor: "pointer", background: tab === t ? "#F5F1E8" : "transparent", fontWeight: tab === t ? 600 : 400 }}>
                      {t === "products" ? "Produkter" : `Ordrar (${shopOrders.length})`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Standalone tabs */}
        {([
          ["blogg", "Blogg"],
          ["recensioner", `Recensioner${reviews.length > 0 ? ` (${reviews.length})` : ""}`],
          ["nyhetsbrev", `Nyhetsbrev${subscribers.length > 0 ? ` (${subscribers.length})` : ""}`],
          ["lojalitet", "Lojalitet"],
          ["analytics", "Analytics"],
          ["karta", "Ramen Map"],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t as any); setOpenDropdown(null); }}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Quicksand',sans-serif", fontSize: 14, cursor: "pointer", background: tab === t ? "#F5F1E8" : "transparent", fontWeight: tab === t ? 500 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* EVENTS TAB */}
      {tab === "events" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            {eventsView === "add" ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Lägg till event</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={S.label}>Titel *</label>
                    <input style={S.input} placeholder="Pop-up middag" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Datum *</label>
                    <input style={S.input} type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={S.label}>Starttid</label>
                      <input style={S.input} type="time" value={newEvent.timeStart} onChange={e => setNewEvent({ ...newEvent, timeStart: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Sluttid</label>
                      <input style={S.input} type="time" value={newEvent.timeEnd} onChange={e => setNewEvent({ ...newEvent, timeEnd: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Plats</label>
                    <input style={S.input} placeholder="Adress eller platsnamn" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                    {newEvent.location && (
                      <a href={`https://maps.google.com/maps?q=${encodeURIComponent(newEvent.location)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6B6560", textDecoration: "underline", marginTop: 4, display: "block" }}>
                        Visa på Google Maps ↗
                      </a>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={S.label}>Antal platser *</label>
                      <input style={S.input} placeholder="20" type="number" value={newEvent.spots} onChange={e => setNewEvent({ ...newEvent, spots: e.target.value })} />
                    </div>
                    <div>
                      <label style={S.label}>Pris (kr) — valfritt</label>
                      <input style={S.input} placeholder="695" type="number" value={newEvent.price} onChange={e => setNewEvent({ ...newEvent, price: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Beskrivning</label>
                    <textarea style={S.textarea} placeholder="Beskriv eventet..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Bokningstyp</label>
                    <div style={{ display: "flex", gap: 0, border: "1.5px solid #1D1D1D", borderRadius: 8, overflow: "hidden" }}>
                      {(["internal", "on_site", "external"] as const).map(t => (
                        <button key={t} onClick={() => setNewEvent({ ...newEvent, booking_type: t })} style={{ flex: 1, padding: "10px 8px", border: "none", fontFamily: "'Quicksand', sans-serif", fontSize: 12, cursor: "pointer", background: newEvent.booking_type === t ? "#1D1D1D" : "transparent", color: newEvent.booking_type === t ? "#F5F1E8" : "#1D1D1D" }}>
                          {t === "internal" ? "Boka här" : t === "on_site" ? "Betalas på plats" : "Extern länk"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newEvent.booking_type === "external" && (
                    <div>
                      <label style={S.label}>Extern bokningslänk</label>
                      <input style={S.input} placeholder="https://..." value={newEvent.external_url} onChange={e => setNewEvent({ ...newEvent, external_url: e.target.value })} />
                    </div>
                  )}
                  {newEvent.booking_type !== "external" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => setNewEvent({ ...newEvent, require_card: !newEvent.require_card })} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: newEvent.require_card ? "#1D1D1D" : "#ccc", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 3, left: newEvent.require_card ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                      </button>
                      <span style={{ fontSize: 13, color: "#1D1D1D" }}>Require card verification</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setNewEvent({ ...newEvent, require_stuk: !newEvent.require_stuk })} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: newEvent.require_stuk ? "#1D1D1D" : "#ccc", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <span style={{ position: "absolute", top: 3, left: newEvent.require_stuk ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                    <span style={{ fontSize: 13, color: "#1D1D1D" }}>Kräv STUK (studentlegitimation)</span>
                  </div>
                  <ImageUploadField
                    value={newEvent.image_url}
                    onChange={url => setNewEvent({ ...newEvent, image_url: url })}
                    inputRef={eventFileInputRef}
                  />
                  <button style={S.btn} onClick={addEvent}>Lägg till event</button>
                </div>
              </>
            ) : editingEvent ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <button style={S.btnOutline} onClick={() => { setEventsView("add"); setEditingEvent(null); }}>← Avbryt</button>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Redigera event</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={S.label}>Titel *</label>
                    <input style={S.input} value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Datum *</label>
                    <input style={S.input} type="date" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Tid (t.ex. 18:00 – 22:00)</label>
                    <input style={S.input} value={editingEvent.time} onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Plats</label>
                    <input style={S.input} value={editingEvent.location} onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} />
                    {editingEvent.location && (
                      <a href={`https://maps.google.com/maps?q=${encodeURIComponent(editingEvent.location)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6B6560", textDecoration: "underline", marginTop: 4, display: "block" }}>
                        Visa på Google Maps ↗
                      </a>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={S.label}>Totalt platser</label>
                      <input style={S.input} type="number" value={editingEvent.spots} onChange={e => setEditingEvent({ ...editingEvent, spots: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label style={S.label}>Platser kvar</label>
                      <input style={S.input} type="number" value={editingEvent.spots_left} onChange={e => setEditingEvent({ ...editingEvent, spots_left: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label style={S.label}>Pris (kr) — valfritt</label>
                      <input style={S.input} type="number" value={editingEvent.price ?? ""} onChange={e => setEditingEvent({ ...editingEvent, price: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Beskrivning</label>
                    <textarea style={S.textarea} value={editingEvent.description} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>Bokningstyp</label>
                    <div style={{ display: "flex", gap: 0, border: "1.5px solid #1D1D1D", borderRadius: 8, overflow: "hidden" }}>
                      {(["internal", "on_site", "external"] as const).map(t => (
                        <button key={t} onClick={() => setEditingEvent({ ...editingEvent, booking_type: t })} style={{ flex: 1, padding: "10px 8px", border: "none", fontFamily: "'Quicksand', sans-serif", fontSize: 12, cursor: "pointer", background: editingEvent.booking_type === t ? "#1D1D1D" : "transparent", color: editingEvent.booking_type === t ? "#F5F1E8" : "#1D1D1D" }}>
                          {t === "internal" ? "Boka här" : t === "on_site" ? "Betalas på plats" : "Extern länk"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingEvent.booking_type === "external" && (
                    <div>
                      <label style={S.label}>Extern bokningslänk</label>
                      <input style={S.input} placeholder="https://..." value={editingEvent.external_url ?? ""} onChange={e => setEditingEvent({ ...editingEvent, external_url: e.target.value })} />
                    </div>
                  )}
                  {editingEvent.booking_type !== "external" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => setEditingEvent({ ...editingEvent, require_card: !editingEvent.require_card })} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: editingEvent.require_card ? "#1D1D1D" : "#ccc", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 3, left: editingEvent.require_card ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                      </button>
                      <span style={{ fontSize: 13, color: "#1D1D1D" }}>Require card verification</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setEditingEvent({ ...editingEvent, require_stuk: !editingEvent.require_stuk })} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: editingEvent.require_stuk ? "#1D1D1D" : "#ccc", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <span style={{ position: "absolute", top: 3, left: editingEvent.require_stuk ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                    <span style={{ fontSize: 13, color: "#1D1D1D" }}>Kräv STUK (studentlegitimation)</span>
                  </div>
                  <ImageUploadField
                    value={editingEvent.image_url ?? ""}
                    onChange={url => setEditingEvent({ ...editingEvent, image_url: url })}
                    inputRef={editEventFileInputRef}
                  />
                  <button style={S.btn} onClick={saveEditEvent}>Spara ändringar</button>
                </div>
              </>
            ) : null}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Events ({events.filter(e => !e.archived).length}) · <span style={{ fontSize: 14, color: "#6B6560" }}>Arkiverade: {events.filter(e => e.archived).length}</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {events.map(event => (
                <div key={event.id} style={{ ...S.card, opacity: event.archived ? 0.45 : event.active ? 1 : 0.6, overflow: "hidden", padding: 0, border: event.archived ? "1.5px dashed #ccc" : undefined }}>
                  {event.image_url && (
                    <img src={event.image_url} alt={event.title} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{event.title}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{formatDate(event.date)}{event.location ? ` · ${event.location}` : ""}</div>
                      <div style={{ fontSize: 13, color: "#6B6560", display: "flex", alignItems: "center", gap: 8 }}>
                        {editingEventSpots?.id === event.id ? (
                          <>
                            <span>Platser:</span>
                            <input type="number" style={{ ...S.input, width: 60, padding: "2px 6px" }} placeholder="Totalt" value={editingEventSpots.spots} onChange={e => setEditingEventSpots({ ...editingEventSpots, spots: e.target.value })} />
                            <span>Kvar:</span>
                            <input type="number" style={{ ...S.input, width: 60, padding: "2px 6px" }} placeholder="Kvar" value={editingEventSpots.spots_left} onChange={e => setEditingEventSpots({ ...editingEventSpots, spots_left: e.target.value })} />
                            <button style={{ ...S.btn, padding: "2px 8px", fontSize: 12 }} onClick={saveEventSpots}>✓</button>
                            <button style={{ ...S.btnOutline, padding: "2px 8px", fontSize: 12 }} onClick={() => setEditingEventSpots(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <span>{event.spots_left}/{event.spots} platser{event.price != null ? ` · ${event.price} kr` : " · Gratis"}</span>
                            <button style={{ ...S.btnOutline, padding: "1px 7px", fontSize: 11 }} onClick={() => setEditingEventSpots({ id: event.id, spots: String(event.spots), spots_left: String(event.spots_left) })}>Redigera</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {event.archived && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#F0EDE6", color: "#6B6560", alignSelf: "center" }}>Arkiverat</span>}
                      <button style={S.btnOutline} onClick={() => { setEditingEvent(event); setEventsView("edit"); }}>Redigera</button>
                      <button style={S.btnOutline} onClick={() => duplicateEvent(event)}>Duplicera</button>
                      {!event.archived && <button style={S.btnOutline} onClick={() => toggleActive(event)}>{event.active ? "Dölj" : "Visa"}</button>}
                      {event.archived
                        ? <button style={S.btnOutline} onClick={() => unarchiveEvent(event)}>Återställ</button>
                        : <button style={{ ...S.btnOutline, color: "#92400E", borderColor: "#D97706" }} onClick={() => archiveEvent(event)}>Arkivera</button>
                      }
                      <button style={S.btnDanger} onClick={() => deleteEvent(event.id)}>Ta bort</button>
                    </div>
                  </div>
                  {event.location && mapsEmbedUrl(event.location) && (
                    <div style={{ marginBottom: 12 }}>
                      <iframe
                        src={mapsEmbedUrl(event.location)!}
                        width="100%"
                        height="160"
                        style={{ border: 0, borderRadius: 8 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                  <div style={{ marginTop: 4, borderTop: "0.5px solid #ccc", paddingTop: 12 }}>
                    <div style={S.label}>Tider</div>
                    {(timeslots[event.id] || []).map(slot => (
                      <div key={slot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6, gap: 8 }}>
                        <span style={{ flex: 1 }}>{slot.time} — {slot.spots_left}/{slot.spots} platser</span>
                        {editingSlot?.id === slot.id ? (
                          <>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 11, color: "#6B6560", width: 40 }}>Totalt</span>
                                <input type="number" style={{ ...S.input, width: 60, padding: "2px 6px" }} value={editingSlot.spots} onChange={e => setEditingSlot({ ...editingSlot, spots: e.target.value })} autoFocus />
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 11, color: "#6B6560", width: 40 }}>Kvar</span>
                                <input type="number" style={{ ...S.input, width: 60, padding: "2px 6px" }} value={editingSlot.spots_left} onChange={e => setEditingSlot({ ...editingSlot, spots_left: e.target.value })} onKeyDown={e => { if (e.key === "Enter") saveSlotSpots(slot.id, event.id, Number(editingSlot.spots), Number(editingSlot.spots_left)); if (e.key === "Escape") setEditingSlot(null); }} />
                              </div>
                            </div>
                            <button style={S.btn} onClick={() => saveSlotSpots(slot.id, event.id, Number(editingSlot.spots), Number(editingSlot.spots_left))}>✓</button>
                            <button style={S.btnOutline} onClick={() => setEditingSlot(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button style={{ ...S.btnOutline, padding: "2px 8px", fontSize: 12 }} onClick={() => setEditingSlot({ id: slot.id, spots: String(slot.spots), spots_left: String(slot.spots_left) })}>Redigera</button>
                            <button style={S.btnDanger} onClick={() => deleteSlot(slot.id, event.id)}>×</button>
                          </>
                        )}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <input
                        style={{ ...S.input, flex: 1 }}
                        type="time"
                        value={selectedEventId === event.id ? newSlot.time : ""}
                        onFocus={() => setSelectedEventId(event.id)}
                        onChange={e => setNewSlot({ ...newSlot, time: e.target.value })}
                      />
                      <input
                        style={{ ...S.input, flex: 1 }}
                        placeholder="Platser"
                        type="number"
                        value={selectedEventId === event.id ? newSlot.spots : ""}
                        onFocus={() => setSelectedEventId(event.id)}
                        onChange={e => setNewSlot({ ...newSlot, spots: e.target.value })}
                      />
                      <button style={S.btn} onClick={() => addSlot(event.id)}>+</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, borderTop: "0.5px solid #ccc", paddingTop: 12 }}>
                    {manualBooking?.eventId === event.id ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Lägg till bokning manuellt</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <input style={S.input} placeholder="Förnamn *" value={manualForm.fname} onChange={e => setManualForm({ ...manualForm, fname: e.target.value })} />
                          <input style={S.input} placeholder="Efternamn" value={manualForm.lname} onChange={e => setManualForm({ ...manualForm, lname: e.target.value })} />
                          <input style={S.input} placeholder="E-post *" value={manualForm.email} onChange={e => setManualForm({ ...manualForm, email: e.target.value })} />
                          <input style={S.input} placeholder="Telefon" value={manualForm.phone} onChange={e => setManualForm({ ...manualForm, phone: e.target.value })} />
                          <input style={S.input} type="number" placeholder="Gäster" min="1" value={manualForm.guests} onChange={e => setManualForm({ ...manualForm, guests: e.target.value })} />
                          <input style={S.input} type="number" placeholder="Veg" min="0" value={manualForm.vegetarian_count} onChange={e => setManualForm({ ...manualForm, vegetarian_count: e.target.value })} />
                        </div>
                        {(timeslots[event.id] || []).length > 0 && (
                          <select style={{ ...S.input, marginBottom: 8 }} value={manualBooking.slotId} onChange={e => setManualBooking({ ...manualBooking, slotId: e.target.value })}>
                            <option value="">Ingen specifik tid</option>
                            {(timeslots[event.id] || []).map(s => <option key={s.id} value={s.id}>{s.time} ({s.spots_left} platser kvar)</option>)}
                          </select>
                        )}
                        <input style={{ ...S.input, marginBottom: 8 }} placeholder="Övrigt" value={manualForm.note} onChange={e => setManualForm({ ...manualForm, note: e.target.value })} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={S.btn} onClick={addManualBooking} disabled={!manualForm.fname || !manualForm.email}>Lägg till</button>
                          <button style={S.btnOutline} onClick={() => setManualBooking(null)}>Avbryt</button>
                        </div>
                      </div>
                    ) : (
                      <button style={{ ...S.btnOutline, fontSize: 13 }} onClick={() => setManualBooking({ eventId: event.id, slotId: "" })}>+ Lägg till bokning manuellt</button>
                    )}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Bokningar ({filteredBookings.length})</div>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ ...S.input, width: "auto" }}>
                <option value="all">Alla events</option>
                {[...new Set(bookings
                  .filter(b => showArchivedBookings || !archivedEventNames.has(b.event_name))
                  .map(b => b.event_name))].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B6560", cursor: "pointer" }}>
                <input type="checkbox" checked={showArchivedBookings} onChange={e => { setShowArchivedBookings(e.target.checked); setFilterEvent("all"); }} />
                Visa arkiverade
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={exportCSV}>Exportera CSV</button>
              <button style={S.btnOutline} onClick={async () => { const r = await fetch("/api/send-reminders"); const d = await r.json(); alert(`Påminnelsemejl skickade: ${d.sent}`); }}>Skicka påminnelser</button>
              <button style={{ ...S.btnOutline, borderColor: "#F59E0B", color: "#92400E" }} onClick={async () => { if (!confirm(`Skicka varning till alla pending-bokningar om att deras plats försvinner inom 24h?`)) return; const r = await fetch("/api/send-pending-warning"); const d = await r.json(); alert(`Varning skickade till ${d.sent} pending-bokningar`); }}>Varna pending</button>
              <button style={S.btnOutline} onClick={async () => { const r = await fetch("/api/send-followup"); const d = await r.json(); alert(`Uppföljningsmejl skickade: ${d.sent}`); }}>Skicka uppföljning</button>
              {filteredBookings.length > 0 && (
                <button style={S.btnDanger} onClick={deleteAllVisible}>Ta bort alla ({filteredBookings.length})</button>
              )}
            </div>
          </div>
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflowX: "auto" }}>
            <table style={{ minWidth: 900 }}>
              <thead><tr><th>Kod</th><th>Namn</th><th>E-post</th><th>Tel</th><th>Event</th><th>Tid</th><th>Gäster</th><th>Veg</th><th>Övrigt</th><th>Totalt</th><th>Datum</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filteredBookings.length === 0 && <tr><td colSpan={13} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga bokningar än</td></tr>}
                {filteredBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.booking_code}</td>
                    <td>{b.fname} {b.lname}</td>
                    <td style={{ color: "#6B6560" }}>{b.email}</td>
                    <td style={{ color: "#6B6560" }}>{b.phone || "—"}</td>
                    <td>{b.event_name}</td>
                    <td>{b.timeslot_time || "—"}</td>
                    <td>
                      {editingGuests?.id === b.id ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <input
                            type="number"
                            min={1}
                            value={editingGuests.value}
                            onChange={e => setEditingGuests({ id: b.id, value: e.target.value })}
                            onKeyDown={e => { if (e.key === "Enter") saveGuests(b.id, editingGuests.value); if (e.key === "Escape") setEditingGuests(null); }}
                            autoFocus
                            style={{ width: 52, fontFamily: "'Quicksand', sans-serif", fontSize: 13, border: "1.5px solid #1D1D1D", borderRadius: 6, padding: "2px 6px" }}
                          />
                          <button style={{ ...S.btn, padding: "2px 7px", fontSize: 12 }} onClick={() => saveGuests(b.id, editingGuests.value)}>✓</button>
                          <button style={{ ...S.btnOutline, padding: "2px 7px", fontSize: 12 }} onClick={() => setEditingGuests(null)}>✕</button>
                        </div>
                      ) : (
                        <span onClick={() => setEditingGuests({ id: b.id, value: String(b.guests) })} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {b.guests} pers <span style={{ fontSize: 11, color: "#bbb" }}>✎</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {editingVeg?.id === b.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editingVeg.value}
                          onChange={e => setEditingVeg({ id: b.id, value: e.target.value })}
                          onBlur={() => saveVeg(b.id, editingVeg.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveVeg(b.id, editingVeg.value); if (e.key === "Escape") setEditingVeg(null); }}
                          autoFocus
                          style={{ width: 44, fontFamily: "'Quicksand', sans-serif", fontSize: 13, border: "1.5px solid #1D1D1D", borderRadius: 6, padding: "2px 6px" }}
                        />
                      ) : (
                        <span onClick={() => setEditingVeg({ id: b.id, value: String(b.vegetarian_count ?? 0) })} style={{ cursor: "pointer", borderBottom: "1px dashed #bbb", color: b.vegetarian_count > 0 ? "#1D1D1D" : "#bbb" }} title="Klicka för att ändra">
                          {b.vegetarian_count > 0 ? `${b.vegetarian_count} st` : "—"}
                        </span>
                      )}
                    </td>
                    <td style={{ color: "#6B6560", fontSize: 13, maxWidth: 160 }} title={b.note || ""}>{b.note ? (b.note.length > 30 ? b.note.slice(0, 30) + "…" : b.note) : "—"}</td>
                    <td>{b.total_price} kr</td>
                    <td style={{ color: "#6B6560" }}>{new Date(b.created_at).toLocaleDateString("sv-SE")}</td>
                    <td>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: b.status === "confirmed" ? "#D1FAE5" : "#FEF3C7", color: b.status === "confirmed" ? "#065F46" : "#92400E" }}>
                        {b.status === "confirmed" ? "Bekräftad" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {b.status === "pending" && (
                          <button style={{ ...S.btnOutline, fontSize: 12, padding: "4px 10px", borderColor: "#065F46", color: "#065F46" }} onClick={() => confirmBooking(b.id)} title="Bekräfta manuellt">✓</button>
                        )}
                        <button style={S.btnDanger} onClick={() => deleteBooking(b.id)}>×</button>
                      </div>
                    </td>
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

      {/* ORDRAR TAB */}
      {tab === "ordrar" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Shop-ordrar ({shopOrders.length})</div>
          </div>
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Produkt</th><th>Antal</th><th>Totalt</th><th>E-post</th><th>Status</th><th>Datum</th><th></th></tr></thead>
              <tbody>
                {shopOrders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga ordrar än</td></tr>}
                {shopOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500 }}>{o.product_name}</td>
                    <td>{o.quantity} st</td>
                    <td>{o.total_price} kr</td>
                    <td style={{ color: "#6B6560" }}>{o.email || "—"}</td>
                    <td>
                      <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: o.status === "paid" ? "#EAF3DE" : "#F0EDE6", color: o.status === "paid" ? "#3B6D11" : "#6B6560" }}>
                        {o.status === "paid" ? "Betald" : "Väntande"}
                      </span>
                    </td>
                    <td style={{ color: "#6B6560" }}>{new Date(o.created_at).toLocaleDateString("sv-SE")}</td>
                    <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {o.status === "pending" && o.stripe_session_id && (
                        <button style={{ ...S.btnOutline, fontSize: 11, padding: "2px 8px" }} onClick={async () => {
                          const res = await fetch("/api/sync-shop-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: o.id, stripe_session_id: o.stripe_session_id }) });
                          const data = await res.json();
                          if (data.status === "paid") setShopOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "paid" } : x));
                          else alert(`Stripe-status: ${data.status}`);
                        }}>Kontrollera</button>
                      )}
                      <button style={S.btnDanger} onClick={() => deleteShopOrder(o.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Totalt intäkter", value: shopOrders.filter(o => o.status === "paid").reduce((s, o) => s + o.total_price, 0).toLocaleString("sv-SE") + " kr" },
              { label: "Betalda ordrar", value: String(shopOrders.filter(o => o.status === "paid").length) },
              { label: "Väntande", value: String(shopOrders.filter(o => o.status === "pending").length) },
            ].map(m => (
              <div key={m.label} style={S.card}>
                <div style={S.label}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WAITLIST TAB */}
      {tab === "waitlist" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Waitlist ({waitlist.length})</div>
            {waitlist.length > 0 && (
              <button style={S.btn} onClick={() => {
                const rows = [["Namn", "E-post", "Tel", "Event", "Gäster", "Veg", "Övrigt", "Datum"]];
                waitlist.forEach(w => rows.push([`${w.fname} ${w.lname}`, w.email, w.phone || "", w.event_name, String(w.guests), String(w.vegetarian_count ?? 0), w.note || "", new Date(w.created_at).toLocaleDateString("sv-SE")]));
                const csv = rows.map(r => r.join(";")).join("\n");
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "waitlist.csv"; a.click();
              }}>Exportera CSV</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <select value={filterWaitlistEvent} onChange={e => setFilterWaitlistEvent(e.target.value)} style={{ ...S.input, width: "auto" }}>
              <option value="all">Alla events</option>
              {[...new Set(waitlist
                .filter(w => showArchivedWaitlist || !archivedEventNames.has(w.event_name))
                .map(w => w.event_name))].map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B6560", cursor: "pointer" }}>
              <input type="checkbox" checked={showArchivedWaitlist} onChange={e => { setShowArchivedWaitlist(e.target.checked); setFilterWaitlistEvent("all"); }} />
              Visa arkiverade
            </label>
          </div>
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Namn</th><th>E-post</th><th>Tel</th><th>Event</th><th>Gäster</th><th>Veg</th><th>Övrigt</th><th>Datum</th><th></th></tr></thead>
              <tbody>
                {waitlist.filter(w => (showArchivedWaitlist || !archivedEventNames.has(w.event_name)) && (filterWaitlistEvent === "all" || w.event_name === filterWaitlistEvent)).length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Ingen på waitlist än</td></tr>}
                {waitlist.filter(w => (showArchivedWaitlist || !archivedEventNames.has(w.event_name)) && (filterWaitlistEvent === "all" || w.event_name === filterWaitlistEvent)).map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 500 }}>{w.fname} {w.lname}</td>
                    <td style={{ color: "#6B6560" }}>{w.email}</td>
                    <td style={{ color: "#6B6560" }}>{w.phone || "—"}</td>
                    <td>{w.event_name}</td>
                    <td>{w.guests} pers</td>
                    <td style={{ color: (w.vegetarian_count ?? 0) > 0 ? "#1D1D1D" : "#bbb" }}>{(w.vegetarian_count ?? 0) > 0 ? `${w.vegetarian_count} st` : "—"}</td>
                    <td style={{ color: "#6B6560", fontSize: 13, maxWidth: 160 }} title={w.note || ""}>{w.note ? (w.note.length > 30 ? w.note.slice(0, 30) + "…" : w.note) : "—"}</td>
                    <td style={{ color: "#6B6560" }}>{new Date(w.created_at).toLocaleDateString("sv-SE")}</td>
                    <td><div style={{ display: "flex", gap: 6 }}><button style={{ ...S.btnOutline, fontSize: 12, padding: "4px 10px" }} onClick={() => promoteWaitlistEntry(w)} title="Flytta till bokningar">→ Event</button><button style={S.btnDanger} onClick={() => deleteWaitlistEntry(w.id)}>×</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(() => {
            const filtered = waitlist.filter(w => (showArchivedWaitlist || !archivedEventNames.has(w.event_name)) && (filterWaitlistEvent === "all" || w.event_name === filterWaitlistEvent));
            const totalGuests = filtered.reduce((sum, w) => sum + w.guests, 0);
            const totalVeg = filtered.reduce((sum, w) => sum + (w.vegetarian_count ?? 0), 0);
            return filtered.length > 0 ? (
              <div style={{ marginTop: 12, fontSize: 13, color: "#6B6560", display: "flex", gap: 20 }}>
                <span><strong>{filtered.length}</strong> personer på väntelistan</span>
                <span><strong>{totalGuests}</strong> gäster totalt</span>
                {totalVeg > 0 && <span><strong>{totalVeg}</strong> vegetariska</span>}
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* RECENSIONER TAB */}
      {tab === "recensioner" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Recensioner ({reviews.length})</div>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <select value={filterReviewEvent} onChange={e => setFilterReviewEvent(e.target.value)} style={{ ...S.input, width: "auto" }}>
              <option value="all">Alla events</option>
              {[...new Set(reviews.map(r => r.event_name))].map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {(() => {
            const filtered = reviews.filter(r => filterReviewEvent === "all" || r.event_name === filterReviewEvent);
            const avg = filtered.length > 0 ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1) : null;
            return (
              <>
                {avg && <div style={{ marginBottom: 16, fontSize: 14, color: "#6B6560" }}>Snittbetyg: <strong style={{ color: "#C9A96E", fontSize: 18 }}>{"★".repeat(Math.round(Number(avg)))} {avg}/5</strong></div>}
                <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
                  <table>
                    <thead><tr><th>Namn</th><th>Betyg</th><th>Kommentar</th><th>Event</th><th>Datum</th><th></th></tr></thead>
                    <tbody>
                      {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga recensioner än</td></tr>}
                      {filtered.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td style={{ color: "#C9A96E", letterSpacing: 2 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                          <td style={{ color: "#6B6560", fontSize: 13, maxWidth: 280 }}>{r.comment || "—"}</td>
                          <td style={{ fontSize: 13 }}>{r.event_name}</td>
                          <td style={{ color: "#6B6560", fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString("sv-SE")}</td>
                          <td><button style={S.btnDanger} onClick={() => deleteReview(r.id)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "#6B6560" }}>
                    Länk att dela: <code style={{ background: "#E8E3D8", padding: "2px 6px", borderRadius: 4 }}>sanshoramen.se/review/{filtered[0]?.event_slug}</code>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* STALLET BAR TAB */}
      {tab === "stallet" && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Stallet Bar — 12 aug · Tidsval</div>
          <div style={{ fontSize: 13, color: "#6B6560", marginBottom: 20 }}>
            {stalletPrefs.length} anmälningar · {stalletPrefs.reduce((s, p) => s + p.guests, 0)} gäster totalt
          </div>
          {["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30"].map(time => {
            const group = stalletPrefs.filter(p => p.preferred_time === time);
            if (group.length === 0) return null;
            return (
              <div key={time} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {time}
                  <span style={{ fontSize: 12, background: "#F0EDE6", borderRadius: 99, padding: "2px 10px", color: "#6B6560" }}>
                    {group.length} anmälningar · {group.reduce((s, p) => s + p.guests, 0)} gäster
                  </span>
                </div>
                <div style={{ border: "1.5px solid #DDD8CE", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%" }}>
                    <thead><tr><th style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #EDE8DF" }}>Namn</th><th style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #EDE8DF" }}>E-post</th><th style={{ textAlign: "center", padding: "8px 16px", fontSize: 11, color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #EDE8DF" }}>Sällskap</th></tr></thead>
                    <tbody>
                      {group.map(p => (
                        <tr key={p.id} style={{ borderBottom: "0.5px solid #F0EDE6" }}>
                          <td style={{ padding: "10px 16px", fontSize: 14 }}>{p.name}</td>
                          <td style={{ padding: "10px 16px", fontSize: 13, color: "#6B6560" }}>{p.email}</td>
                          <td style={{ padding: "10px 16px", fontSize: 14, textAlign: "center" }}>{p.guests}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          {stalletPrefs.length === 0 && <div style={{ color: "#6B6560", padding: 40, textAlign: "center" }}>Inga anmälningar än.</div>}
        </div>
      )}

      {/* NYHETSBREV TAB */}
      {tab === "nyhetsbrev" && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Nyhetsbrev</div>
          <div style={{ color: "#6B6560", fontSize: 14, marginBottom: 20 }}>{subscribers.length} prenumeranter</div>
          {subscribers.length === 0 ? (
            <div style={{ color: "#6B6560", padding: 40, textAlign: "center" }}>Inga prenumeranter än.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E8E3D8", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px" }}>#</th>
                    <th style={{ padding: "8px 12px" }}>E-post</th>
                    <th style={{ padding: "8px 12px" }}>Anmäld</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F0EDE6" }}>
                      <td style={{ padding: "10px 12px", color: "#6B6560" }}>{subscribers.length - i}</td>
                      <td style={{ padding: "10px 12px" }}>{s.email}</td>
                      <td style={{ padding: "10px 12px", color: "#6B6560" }}>{new Date(s.created_at).toLocaleDateString("sv-SE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LOJALITET TAB */}
      {tab === "lojalitet" && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Lojalitet</div>
          <div style={{ color: "#6B6560", fontSize: 14, marginBottom: 20 }}>Rankad efter totalt antal besökta events (Luma + systemet)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E8E3D8", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px" }}>#</th>
                  <th style={{ padding: "8px 12px" }}>Namn</th>
                  <th style={{ padding: "8px 12px" }}>E-post</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Luma</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>System</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Totalt</th>
                </tr>
              </thead>
              <tbody>
                {loyalty.map((l, i) => (
                  <tr key={l.email} style={{ borderBottom: "1px solid #F0EDE6", background: l.total >= 3 ? "#FFFBEB" : l.total >= 2 ? "#F9F9F9" : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: "#6B6560" }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: l.total >= 2 ? 600 : 400 }}>
                      {l.total >= 3 ? "🏆 " : l.total >= 2 ? "⭐ " : ""}{l.name || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6B6560" }}>{l.email}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{l.luma_events || "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{l.system_events || "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{l.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Analytics — senaste 30 dagarna</div>
              <div style={{ color: "#6B6560", fontSize: 13 }}>Data från Google Analytics</div>
            </div>
            <button style={S.btn} onClick={async () => { setGaLoading(true); const r = await fetch("/api/ga-stats"); const d = await r.json(); setGaStats(d); setGaLoading(false); }}>
              {gaLoading ? "Laddar..." : gaStats ? "Uppdatera" : "Hämta data"}
            </button>
          </div>
          {!gaStats && !gaLoading && (
            <div style={{ color: "#6B6560", textAlign: "center", padding: 60 }}>Tryck på "Hämta data" för att ladda analytics.</div>
          )}
          {gaLoading && <div style={{ color: "#6B6560", textAlign: "center", padding: 60 }}>Hämtar från Google Analytics...</div>}
          {gaStats && !gaLoading && (
            <>
              {/* KPI cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Sessioner", value: gaStats.totalSessions.toLocaleString("sv-SE") },
                  { label: "Unika besökare", value: gaStats.totalUsers.toLocaleString("sv-SE") },
                  { label: "Bounce rate", value: `${Math.round(gaStats.bounceRate * 100)}%` },
                  { label: "Snitt-session", value: (() => { const s = Math.round(gaStats.avgSessionDuration); return s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`; })() },
                  { label: "Mobil", value: `${Math.round(((gaStats.devices.find(d => d.device === "mobile")?.sessions || 0) / gaStats.totalSessions) * 100)}%` },
                  { label: "Desktop", value: `${Math.round(((gaStats.devices.find(d => d.device === "desktop")?.sessions || 0) / gaStats.totalSessions) * 100)}%` },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: "20px 20px" }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B6560", marginBottom: 8 }}>{kpi.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Daily chart */}
              {(() => {
                const CHART_H = 100;
                const dailyMax = Math.max(...gaStats.daily.map(x => x.sessions), 1);
                const dailyMid = Math.round(dailyMax / 2);
                return (
                  <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14 }}>Dagliga sessioner (30 dagar)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {/* Y-axis */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", height: CHART_H, paddingBottom: 0, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>{dailyMax}</div>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>{dailyMid}</div>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>0</div>
                      </div>
                      {/* Bars */}
                      <div style={{ flex: 1, position: "relative" }}>
                        {/* Grid lines */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                          <div style={{ borderTop: "1px solid #F0EDE6" }} />
                          <div style={{ borderTop: "1px solid #F0EDE6" }} />
                          <div style={{ borderTop: "1px solid #F0EDE6" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: CHART_H }}>
                          {gaStats.daily.map((d, i) => {
                            const barH = Math.round((d.sessions / dailyMax) * CHART_H);
                            return (
                              <div key={i} title={`${d.date}: ${d.sessions} sessioner`} style={{ flex: 1, background: "#1D1D1D", borderRadius: "2px 2px 0 0", height: barH, minHeight: d.sessions > 0 ? 2 : 0, opacity: 0.8 }} />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Hourly distribution */}
              {(() => {
                const CHART_H = 80;
                const hourMax = Math.max(...gaStats.hours.map(x => x.sessions), 1);
                const hourMid = Math.round(hourMax / 2);
                return (
                  <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14 }}>Trafik per timme (senaste 30 dagar)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {/* Y-axis */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", height: CHART_H, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>{hourMax}</div>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>{hourMid}</div>
                        <div style={{ fontSize: 10, color: "#6B6560" }}>0</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ position: "relative" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                            <div style={{ borderTop: "1px solid #F0EDE6" }} />
                            <div style={{ borderTop: "1px solid #F0EDE6" }} />
                            <div style={{ borderTop: "1px solid #F0EDE6" }} />
                          </div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: CHART_H }}>
                            {Array.from({ length: 24 }, (_, h) => {
                              const found = gaStats.hours.find(x => x.hour === h);
                              const sessions = found?.sessions || 0;
                              const height = Math.round((sessions / hourMax) * (CHART_H - 16));
                              return (
                                <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                                    <div title={`${h}:00 — ${sessions} sessioner`} style={{ width: "100%", background: "#1D1D1D", borderRadius: "2px 2px 0 0", height, minHeight: sessions > 0 ? 2 : 0, opacity: 0.75 }} />
                                  </div>
                                  <div style={{ fontSize: 9, color: "#6B6560", marginTop: 3 }}>{h % 6 === 0 ? `${h}h` : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top pages + Sources + New vs Returning + Countries */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 14 }}>Mest besökta sidor</div>
                  {gaStats.topPages.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F0EDE6" }}>
                      <span style={{ color: "#6B6560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{p.path || "/"}</span>
                      <span style={{ fontWeight: 600 }}>{p.views.toLocaleString("sv-SE")}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 14 }}>Trafikkällor</div>
                  {gaStats.sources.map((s, i) => {
                    const pct = Math.round((s.sessions / gaStats.totalSessions) * 100);
                    return (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span>{s.channel}</span><span style={{ fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: "#F0EDE6", borderRadius: 4 }}>
                          <div style={{ height: 4, background: "#1D1D1D", borderRadius: 4, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 14 }}>Nya vs återkommande</div>
                  {gaStats.newVsReturning.map((r, i) => {
                    const pct = Math.round((r.sessions / gaStats.totalSessions) * 100);
                    const label = r.type === "new" ? "Nya" : r.type === "returning" ? "Återkommande" : r.type;
                    return (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span>{label}</span><span style={{ fontWeight: 600 }}>{pct}% ({r.sessions.toLocaleString("sv-SE")})</span>
                        </div>
                        <div style={{ height: 4, background: "#F0EDE6", borderRadius: 4 }}>
                          <div style={{ height: 4, background: i === 0 ? "#1D1D1D" : "#6B6560", borderRadius: 4, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#fff", border: "1.5px solid #E8E3D8", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 14 }}>Länder</div>
                  {gaStats.countries.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #F0EDE6" }}>
                      <span style={{ color: "#6B6560" }}>{c.country}</span>
                      <span style={{ fontWeight: 600 }}>{c.sessions.toLocaleString("sv-SE")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* RAMEN MAP TAB */}
      {tab === "karta" && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Ramen Map ({spots.length} ställen)</div>

          {/* Add new spot */}
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Lägg till nytt ställe</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Namn *</label><input style={S.input} value={newSpot.name} onChange={e => setNewSpot({ ...newSpot, name: e.target.value })} placeholder="Fuunji" /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Stad *</label><input style={S.input} value={newSpot.city} onChange={e => setNewSpot({ ...newSpot, city: e.target.value })} placeholder="Tokyo" /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Land *</label><input style={S.input} value={newSpot.country} onChange={e => setNewSpot({ ...newSpot, country: e.target.value })} placeholder="Japan" /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Betyg (1–5)</label><input style={S.input} type="number" min="1" max="5" step="0.5" value={newSpot.rating} onChange={e => setNewSpot({ ...newSpot, rating: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Latitud *</label><input style={S.input} value={newSpot.lat} onChange={e => setNewSpot({ ...newSpot, lat: e.target.value })} placeholder="35.6762" /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Longitud *</label><input style={S.input} value={newSpot.lng} onChange={e => setNewSpot({ ...newSpot, lng: e.target.value })} placeholder="139.6503" /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Besökt (datum)</label><input style={S.input} type="date" value={newSpot.visited_at} onChange={e => setNewSpot({ ...newSpot, visited_at: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Bild-URL</label><input style={S.input} value={newSpot.image_url} onChange={e => setNewSpot({ ...newSpot, image_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Kommentar</label><textarea style={{ ...S.input, height: 72 }} value={newSpot.note} onChange={e => setNewSpot({ ...newSpot, note: e.target.value })} placeholder="Fantastisk tsukemen, kö på 40 min..." /></div>
            <div style={{ fontSize: 11, color: "#6B6560", marginBottom: 12 }}>Tips: Hitta koordinater på maps.google.com → högerklicka på kartan → koordinaterna kopieras</div>
            <button style={S.btn} onClick={saveNewSpot} disabled={!newSpot.name || !newSpot.city || !newSpot.country || !newSpot.lat || !newSpot.lng}>+ Lägg till</button>
          </div>

          {/* Spots list */}
          <div style={{ border: "1.5px solid #1D1D1D", borderRadius: 12, overflow: "hidden" }}>
            <table>
              <thead><tr><th>Namn</th><th>Stad</th><th>Land</th><th>Betyg</th><th>Besökt</th><th>Kommentar</th><th></th></tr></thead>
              <tbody>
                {spots.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#6B6560", padding: 40 }}>Inga ställen tillagda än</td></tr>}
                {spots.map(spot => editingSpot?.id === spot.id ? (
                  <tr key={spot.id}>
                    <td><input style={{ ...S.input, width: 120 }} value={editingSpot.name} onChange={e => setEditingSpot({ ...editingSpot, name: e.target.value })} /></td>
                    <td><input style={{ ...S.input, width: 100 }} value={editingSpot.city} onChange={e => setEditingSpot({ ...editingSpot, city: e.target.value })} /></td>
                    <td><input style={{ ...S.input, width: 100 }} value={editingSpot.country} onChange={e => setEditingSpot({ ...editingSpot, country: e.target.value })} /></td>
                    <td><input style={{ ...S.input, width: 60 }} type="number" min="1" max="5" step="0.5" value={editingSpot.rating} onChange={e => setEditingSpot({ ...editingSpot, rating: parseFloat(e.target.value) })} /></td>
                    <td><input style={{ ...S.input, width: 120 }} type="date" value={editingSpot.visited_at || ""} onChange={e => setEditingSpot({ ...editingSpot, visited_at: e.target.value })} /></td>
                    <td><input style={{ ...S.input, width: 180 }} value={editingSpot.note} onChange={e => setEditingSpot({ ...editingSpot, note: e.target.value })} /></td>
                    <td><div style={{ display: "flex", gap: 6 }}><button style={S.btn} onClick={saveEditSpot}>Spara</button><button style={S.btnOutline} onClick={() => setEditingSpot(null)}>Avbryt</button></div></td>
                  </tr>
                ) : (
                  <tr key={spot.id}>
                    <td style={{ fontWeight: 500 }}>{spot.name}</td>
                    <td style={{ color: "#6B6560" }}>{spot.city}</td>
                    <td style={{ color: "#6B6560" }}>{spot.country}</td>
                    <td style={{ color: "#C9A96E" }}>{"★".repeat(Math.round(spot.rating))}{"☆".repeat(5 - Math.round(spot.rating))} <span style={{ color: "#6B6560", fontSize: 12 }}>({spot.rating})</span></td>
                    <td style={{ color: "#6B6560" }}>{spot.visited_at ? new Date(spot.visited_at).toLocaleDateString("sv-SE", { year: "numeric", month: "short" }) : "—"}</td>
                    <td style={{ color: "#6B6560", fontSize: 13, maxWidth: 200 }} title={spot.note}>{spot.note ? (spot.note.length > 40 ? spot.note.slice(0, 40) + "…" : spot.note) : "—"}</td>
                    <td><div style={{ display: "flex", gap: 6 }}><button style={S.btnOutline} onClick={() => setEditingSpot(spot)}>Redigera</button><button style={S.btnDanger} onClick={() => deleteSpot(spot.id)}>×</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}><a href="/ramen-map" target="_blank" style={{ fontSize: 13, color: "#6B6560" }}>Öppna kartan →</a></div>
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
              <label style={S.label}>Preview-bild</label>
              <ImageUploadField value={newPost.image_url} onChange={url => setNewPost({ ...newPost, image_url: url })} inputRef={eventFileInputRef} />
            </div>
            <div>
              <label style={S.label}>Ingress (kort beskrivning)</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="En kort beskrivning som visas i blogglistan..." value={newPost.excerpt} onChange={e => setNewPost({ ...newPost, excerpt: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Innehåll *</label>
              <div style={{ fontSize: 11, color: "#6B6560", marginBottom: 6 }}>Tips: använd <code>## Rubrik</code>, <code>### Underrubrik</code>, <code>![bildtext](url)</code> för bilder</div>
              <textarea style={{ ...S.textarea, minHeight: 400 }} placeholder={"## Rubrik\n\nText här...\n\n### Underrubrik\n\n![bildtext](https://...)"} value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
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
              <label style={S.label}>Preview-bild</label>
              <ImageUploadField value={editingPost.image_url ?? ""} onChange={url => setEditingPost({ ...editingPost, image_url: url })} inputRef={editEventFileInputRef} />
            </div>
            <div>
              <label style={S.label}>Ingress</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }} value={editingPost.excerpt} onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Innehåll *</label>
              <div style={{ fontSize: 11, color: "#6B6560", marginBottom: 6 }}>Tips: använd <code>## Rubrik</code>, <code>### Underrubrik</code>, <code>![bildtext](url)</code> för bilder</div>
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

      {/* PRODUCTS TAB */}
      {tab === "products" && !editingProduct && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Lägg till produkt</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={S.label}>Namn *</label>
                <input style={S.input} placeholder="Sanshō Cap" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Beskrivning</label>
                <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="Beskrivning av produkten..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>Pris (kr) *</label>
                  <input style={S.input} placeholder="299" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Kategori</label>
                  <input style={S.input} placeholder="Headwear, Kläder..." value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                </div>
              </div>
              <ImageUploadField
                value={newProduct.image_url}
                onChange={url => setNewProduct({ ...newProduct, image_url: url })}
                inputRef={fileInputRef}
              />
              <button style={S.btn} onClick={addProduct} disabled={uploadingImage}>
                {uploadingImage ? "Laddar upp..." : "Lägg till produkt"}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Produkter ({products.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {products.map(p => (
                <div key={p.id} style={{ ...S.card, opacity: p.active ? 1 : 0.5 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 64, height: 64, background: "#E8E3D8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🍜</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{p.category} · {p.price} kr</div>
                      {p.description && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{p.description.substring(0, 80)}{p.description.length > 80 ? "..." : ""}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <button style={S.btnOutline} onClick={() => setEditingProduct(p)}>Redigera</button>
                      <button style={S.btnOutline} onClick={() => toggleProductActive(p)}>{p.active ? "Dölj" : "Visa"}</button>
                      <button style={S.btnDanger} onClick={() => deleteProduct(p.id)}>Ta bort</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "products" && editingProduct && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button style={S.btnOutline} onClick={() => setEditingProduct(null)}>← Avbryt</button>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Redigera produkt</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={S.label}>Namn *</label>
              <input style={S.input} value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Beskrivning</label>
              <textarea style={{ ...S.textarea, minHeight: 80 }} value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={S.label}>Pris (kr) *</label>
                <input style={S.input} type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} />
              </div>
              <div>
                <label style={S.label}>Kategori</label>
                <input style={S.input} value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} />
              </div>
            </div>
            <ImageUploadField
              value={editingProduct.image_url}
              onChange={url => setEditingProduct({ ...editingProduct, image_url: url })}
              inputRef={editFileInputRef}
            />
            <button style={S.btn} onClick={saveEditProduct} disabled={uploadingImage}>
              {uploadingImage ? "Laddar upp..." : "Spara ändringar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
