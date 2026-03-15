
import { useState, useRef, useCallback } from "react";

const CATEGORIES = ["Semua", "Sembako", "Sabun & Kebersihan", "Makeup", "Obat", "Snack", "Minuman", "Lainnya"];
const WALLETS = [
  { name: "GoPay", color: "#00AED6", icon: "💙", url: "https://gojek.com" },
  { name: "OVO", color: "#4C3494", icon: "💜", url: "https://ovo.id" },
  { name: "Dana", color: "#118EEA", icon: "💎", url: "https://dana.id" },
  { name: "ShopeePay", color: "#EE4D2D", icon: "🧡", url: "https://shopee.co.id" },
  { name: "BCA Mobile", color: "#005BAA", icon: "🏦", url: "https://klikbca.com" },
  { name: "Mandiri", color: "#003F87", icon: "🏧", url: "https://bankmandiri.co.id" },
];

const formatRupiah = (num) => "Rp " + Number(num || 0).toLocaleString("id-ID");

export default function BelanjaAku() {
  const [page, setPage] = useState("dashboard");
  const [shoppingList, setShoppingList] = useState([
    { id: 1, name: "Beras 5kg", category: "Sembako", estimasi: 75000, qty: 2, done: false, img: null },
    { id: 2, name: "Sabun Mandi", category: "Sabun & Kebersihan", estimasi: 12000, qty: 3, done: false, img: null },
    { id: 3, name: "Lipstik", category: "Makeup", estimasi: 85000, qty: 1, done: true, img: null },
  ]);
  const [stocks, setStocks] = useState([
    { id: 1, name: "Beras 5kg", category: "Sembako", img: null, batches: [{ qty: 5, tglMasuk: "2025-02-01", kadaluarsa: "2026-02-01" }] },
    { id: 2, name: "Minyak Goreng", category: "Sembako", img: null, batches: [{ qty: 2, tglMasuk: "2025-03-01", kadaluarsa: "2025-12-01" }] },
    { id: 3, name: "Paracetamol", category: "Obat", img: null, batches: [{ qty: 10, tglMasuk: "2025-01-15", kadaluarsa: "2026-01-15" }] },
  ]);
  const [memberCards, setMemberCards] = useState([
    { id: 1, name: "Indomaret", img: null, color: "#e83e3e" },
    { id: 2, name: "Alfamart", img: null, color: "#0072c6" },
  ]);
  const [filterCat, setFilterCat] = useState("Semua");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showStockOut, setShowStockOut] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", category: "Sembako", estimasi: "", qty: 1, img: null });
  const [newStock, setNewStock] = useState({ name: "", category: "Sembako", qty: 1, tglMasuk: "", kadaluarsa: "", img: null });
  const [newCard, setNewCard] = useState({ name: "", img: null, color: "#e83e3e" });
  const [stockOutQty, setStockOutQty] = useState(1);
  const [previewImg, setPreviewImg] = useState(null);
  const itemImgRef = useRef();
  const stockImgRef = useRef();
  const cardFileRef = useRef();

  // Shopping list
  const filteredList = shoppingList.filter(i => filterCat === "Semua" || i.category === filterCat);
  const totalEstimasi = shoppingList.reduce((s, i) => s + (i.estimasi * i.qty), 0);
  const totalDone = shoppingList.filter(i => i.done).length;

  const addItem = () => {
    if (!newItem.name) return;
    setShoppingList([...shoppingList, { ...newItem, id: Date.now(), done: false, estimasi: Number(newItem.estimasi) || 0, qty: Number(newItem.qty) || 1 }]);
    setNewItem({ name: "", category: "Sembako", estimasi: "", qty: 1, img: null });
    setShowAddItem(false);
  };

  const toggleDone = (id) => setShoppingList(shoppingList.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const deleteItem = (id) => setShoppingList(shoppingList.filter(i => i.id !== id));

  // Stock
  const addStock = () => {
    if (!newStock.name || !newStock.qty) return;
    const existing = stocks.find(s => s.name === newStock.name);
    if (existing) {
      setStocks(stocks.map(s => s.name === newStock.name
        ? { ...s, img: newStock.img || s.img, batches: [...s.batches, { qty: Number(newStock.qty), tglMasuk: newStock.tglMasuk, kadaluarsa: newStock.kadaluarsa }] }
        : s));
    } else {
      setStocks([...stocks, { id: Date.now(), name: newStock.name, category: newStock.category, img: newStock.img, batches: [{ qty: Number(newStock.qty), tglMasuk: newStock.tglMasuk, kadaluarsa: newStock.kadaluarsa }] }]);
    }
    setNewStock({ name: "", category: "Sembako", qty: 1, tglMasuk: "", kadaluarsa: "", img: null });
    setShowAddStock(false);
  };

  const doStockOut = (stockId) => {
    let remaining = Number(stockOutQty);
    setStocks(stocks.map(s => {
      if (s.id !== stockId) return s;
      const newBatches = [];
      for (const b of [...s.batches].sort((a, b) => new Date(a.tglMasuk) - new Date(b.tglMasuk))) {
        if (remaining <= 0) { newBatches.push(b); continue; }
        if (b.qty <= remaining) { remaining -= b.qty; }
        else { newBatches.push({ ...b, qty: b.qty - remaining }); remaining = 0; }
      }
      return { ...s, batches: newBatches };
    }).filter(s => s.batches.length > 0 && s.batches.some(b => b.qty > 0)));
    setShowStockOut(null);
    setStockOutQty(1);
  };

  const totalStockQty = (stock) => stock.batches.reduce((s, b) => s + b.qty, 0);

  const isNearExpiry = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff < 30 && diff >= 0;
  };
  const isExpired = (date) => date && new Date(date) < new Date();

  const readImg = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => cb(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Member cards
  const handleCardImg = (e) => readImg(e.target.files[0], (src) => setNewCard(c => ({ ...c, img: src })));

  const addCard = () => {
    if (!newCard.name) return;
    setMemberCards([...memberCards, { ...newCard, id: Date.now() }]);
    setNewCard({ name: "", img: null, color: "#e83e3e" });
    setShowAddCard(false);
  };

  const deleteCard = (id) => setMemberCards(memberCards.filter(c => c.id !== id));

  // --- STYLES ---
  const styles = {
    app: { fontFamily: "'Lora', Georgia, serif", background: "#FFF5F7", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflowX: "hidden" },
    header: { background: "linear-gradient(135deg, #FADADD 0%, #FAF0E6 100%)", padding: "32px 24px 20px", borderBottom: "1px solid #F5C6CB" },
    brandSmall: { fontSize: 11, color: "#C48080", letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif" },
    brandName: { fontSize: 26, fontWeight: 700, color: "#8B3A52", margin: "2px 0 0", lineHeight: 1.1 },
    brandSub: { fontSize: 11, color: "#C48080", fontFamily: "sans-serif", marginTop: 2 },
    nav: { display: "flex", background: "#fff", borderTop: "1px solid #F5C6CB", position: "sticky", bottom: 0, zIndex: 100, boxShadow: "0 -2px 16px #FADADD88" },
    navBtn: (active) => ({ flex: 1, padding: "12px 4px 10px", border: "none", background: active ? "linear-gradient(135deg,#FADADD,#FAF0E6)" : "#fff", color: active ? "#8B3A52" : "#C48080", fontSize: 9, fontFamily: "sans-serif", fontWeight: active ? 700 : 400, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .2s", borderTop: active ? "3px solid #C48080" : "3px solid transparent" }),
    page: { padding: "20px 20px 80px" },
    // dashboard
    greeting: { fontSize: 15, color: "#8B3A52", fontWeight: 600, marginBottom: 4 },
    statRow: { display: "flex", gap: 10, marginBottom: 20 },
    statCard: (color) => ({ flex: 1, background: color, borderRadius: 16, padding: "14px 12px", boxShadow: "0 2px 12px #FADADD66" }),
    statNum: { fontSize: 22, fontWeight: 700, color: "#8B3A52" },
    statLabel: { fontSize: 10, color: "#C48080", fontFamily: "sans-serif", marginTop: 2 },
    menuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    menuCard: (color) => ({ background: color, borderRadius: 20, padding: "20px 16px", cursor: "pointer", boxShadow: "0 4px 16px #FADADD55", transition: "transform .15s, box-shadow .15s", display: "flex", flexDirection: "column", gap: 8, border: "1px solid #F5C6CB" }),
    menuIcon: { fontSize: 28 },
    menuTitle: { fontSize: 14, fontWeight: 700, color: "#8B3A52" },
    menuDesc: { fontSize: 11, color: "#C48080", fontFamily: "sans-serif", lineHeight: 1.4 },
    // section
    sectionTitle: { fontSize: 17, fontWeight: 700, color: "#8B3A52", marginBottom: 14 },
    pill: (active) => ({ padding: "6px 14px", borderRadius: 999, fontSize: 11, fontFamily: "sans-serif", fontWeight: active ? 700 : 400, background: active ? "#8B3A52" : "#fff", color: active ? "#fff" : "#C48080", border: "1px solid #F5C6CB", cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }),
    pillRow: { display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, marginBottom: 14, scrollbarWidth: "none" },
    card: { background: "#fff", borderRadius: 16, padding: "14px 14px", marginBottom: 10, boxShadow: "0 2px 10px #FADADD44", border: "1px solid #F5C6CB", display: "flex", alignItems: "center", gap: 12 },
    btn: (variant) => ({
      padding: variant === "sm" ? "6px 14px" : "13px 0",
      borderRadius: 12,
      border: "none",
      background: variant === "ghost" ? "transparent" : variant === "sm" ? "#FADADD" : "linear-gradient(135deg,#C48080,#8B3A52)",
      color: variant === "ghost" ? "#C48080" : variant === "sm" ? "#8B3A52" : "#fff",
      fontWeight: 700,
      fontSize: variant === "sm" ? 11 : 14,
      cursor: "pointer",
      width: variant === "sm" ? "auto" : "100%",
      fontFamily: "sans-serif",
      transition: "opacity .15s"
    }),
    input: { width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #F5C6CB", background: "#FFF5F7", fontSize: 13, color: "#8B3A52", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    label: { fontSize: 11, color: "#C48080", fontFamily: "sans-serif", marginBottom: 4, display: "block" },
    modal: { position: "fixed", inset: 0, background: "#00000044", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
    modalBox: { background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 430, maxHeight: "85vh", overflowY: "auto" },
    tag: (color) => ({ fontSize: 10, fontFamily: "sans-serif", background: color + "22", color: color, padding: "3px 9px", borderRadius: 99, fontWeight: 700 }),
    totalBar: { background: "linear-gradient(135deg,#FADADD,#FAF0E6)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #F5C6CB" },
  };

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "belanja", icon: "🛒", label: "Belanja" },
    { id: "stok", icon: "📦", label: "Stok" },
    { id: "kartu", icon: "💳", label: "Kartu" },
    { id: "dompet", icon: "👛", label: "Dompet" },
  ];

  const catColor = { "Sembako": "#C48080", "Sabun & Kebersihan": "#6BAED6", "Makeup": "#E7748A", "Obat": "#52A77B", "Snack": "#F4A261", "Minuman": "#4ECDC4", "Lainnya": "#9E9E9E" };

  return (
    <div style={styles.app}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.brandSmall}>teman belanja cermat kamu</div>
        <div style={styles.brandName}>Belanja.Aku 🛍️</div>
        <div style={styles.brandSub}>by calaburatu</div>
      </div>

      {/* PAGES */}
      <div style={styles.page}>

        {/* === DASHBOARD === */}
        {page === "dashboard" && (
          <div>
            <div style={styles.greeting}>Halo! 👋 Siap belanja hari ini?</div>
            <div style={styles.statRow}>
              <div style={styles.statCard("#FADADD")}>
                <div style={styles.statNum}>{shoppingList.filter(i => !i.done).length}</div>
                <div style={styles.statLabel}>Item belum dibeli</div>
              </div>
              <div style={styles.statCard("#FAF0E6")}>
                <div style={styles.statNum}>{formatRupiah(totalEstimasi)}</div>
                <div style={styles.statLabel}>Total estimasi</div>
              </div>
            </div>
            <div style={styles.statRow}>
              <div style={styles.statCard("#F5E6E8")}>
                <div style={styles.statNum}>{stocks.length}</div>
                <div style={styles.statLabel}>Jenis stok tersimpan</div>
              </div>
              <div style={styles.statCard("#FFF0F3")}>
                <div style={styles.statNum}>{memberCards.length}</div>
                <div style={styles.statLabel}>Kartu member</div>
              </div>
            </div>
            <div style={{ marginBottom: 14, ...styles.sectionTitle }}>Menu Utama</div>
            <div style={styles.menuGrid}>
              {[
                { id: "belanja", icon: "🛒", title: "Daftar Belanja", desc: "Tambah & kelola list belanjaan kamu" },
                { id: "stok", icon: "📦", title: "Manajemen Stok", desc: "Pantau stok barang & kadaluarsa (FIFO)" },
                { id: "kartu", icon: "💳", title: "Kartu Member", desc: "Simpan kartu member swalayan & toko" },
                { id: "dompet", icon: "👛", title: "Link Dompet", desc: "Akses cepat ke dompet digital & bank" },
              ].map(m => (
                <div key={m.id} style={styles.menuCard(m.id === "belanja" ? "#FFF5F7" : m.id === "stok" ? "#FFF9F5" : m.id === "kartu" ? "#F5F0FF" : "#F0FFF9")} onClick={() => setPage(m.id)}>
                  <div style={styles.menuIcon}>{m.icon}</div>
                  <div style={styles.menuTitle}>{m.title}</div>
                  <div style={styles.menuDesc}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Near expiry warning */}
            {stocks.some(s => s.batches.some(b => isNearExpiry(b.kadaluarsa))) && (
              <div style={{ background: "#FFF3CD", border: "1px solid #FFCB6B", borderRadius: 14, padding: "12px 14px", marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#856404" }}>⚠️ Hampir Kadaluarsa!</div>
                {stocks.filter(s => s.batches.some(b => isNearExpiry(b.kadaluarsa))).map(s => (
                  <div key={s.id} style={{ fontSize: 11, color: "#856404", fontFamily: "sans-serif", marginTop: 4 }}>
                    {s.name} — dalam 30 hari ke depan
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === BELANJA === */}
        {page === "belanja" && (
          <div>
            <div style={styles.sectionTitle}>🛒 Daftar Belanja</div>
            <div style={styles.totalBar}>
              <div>
                <div style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>Total Estimasi</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#8B3A52" }}>{formatRupiah(totalEstimasi)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>Sudah dibeli</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#8B3A52" }}>{totalDone} / {shoppingList.length}</div>
              </div>
            </div>
            <div style={styles.pillRow}>
              {CATEGORIES.map(c => <button key={c} style={styles.pill(filterCat === c)} onClick={() => setFilterCat(c)}>{c}</button>)}
            </div>
            {filteredList.length === 0 && <div style={{ color: "#C48080", fontFamily: "sans-serif", fontSize: 13, textAlign: "center", marginTop: 30 }}>Belum ada item di kategori ini 🌸</div>}
            {filteredList.map(item => (
              <div key={item.id} style={{ ...styles.card, opacity: item.done ? 0.6 : 1 }}>
                <div onClick={() => toggleDone(item.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #C48080", background: item.done ? "#C48080" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  {item.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                {item.img
                  ? <img src={item.img} alt={item.name} onClick={() => setPreviewImg(item.img)} style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", flexShrink: 0, cursor: "pointer", border: "2px solid #F5C6CB" }} />
                  : <div style={{ width: 46, height: 46, borderRadius: 10, background: "#FFF0F3", border: "2px dashed #F5C6CB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>🛍️</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#8B3A52", textDecoration: item.done ? "line-through" : "none" }}>{item.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                    <span style={styles.tag(catColor[item.category] || "#9E9E9E")}>{item.category}</span>
                    <span style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>x{item.qty}</span>
                    <span style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>{formatRupiah(item.estimasi * item.qty)}</span>
                  </div>
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", color: "#FADADD", fontSize: 16, cursor: "pointer", padding: 4 }}>🗑️</button>
              </div>
            ))}
            <button style={{ ...styles.btn(), marginTop: 8 }} onClick={() => setShowAddItem(true)}>+ Tambah Item</button>
          </div>
        )}

        {/* === STOK === */}
        {page === "stok" && (
          <div>
            <div style={styles.sectionTitle}>📦 Manajemen Stok</div>
            <div style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif", marginBottom: 14, background: "#FFF5F7", borderRadius: 10, padding: "8px 12px", border: "1px solid #F5C6CB" }}>
              📋 Menggunakan metode <b>FIFO</b> — barang masuk pertama, keluar pertama
            </div>
            {stocks.map(stock => (
              <div key={stock.id} style={{ ...styles.card, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  {stock.img
                    ? <img src={stock.img} alt={stock.name} onClick={() => setPreviewImg(stock.img)} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0, cursor: "pointer", border: "2px solid #F5C6CB" }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 12, background: "#FFF0F3", border: "2px dashed #F5C6CB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>📦</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#8B3A52" }}>{stock.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      <span style={styles.tag(catColor[stock.category] || "#9E9E9E")}>{stock.category}</span>
                      <span style={{ fontSize: 11, fontFamily: "sans-serif", color: "#C48080" }}>Total: {totalStockQty(stock)} pcs</span>
                    </div>
                  </div>
                  <button style={styles.btn("sm")} onClick={() => { setShowStockOut(stock.id); setStockOutQty(1); }}>Ambil</button>
                </div>
                <div style={{ borderTop: "1px solid #F5C6CB", paddingTop: 8 }}>
                  {stock.batches.sort((a, b) => new Date(a.tglMasuk) - new Date(b.tglMasuk)).map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "sans-serif", color: "#8B3A52", padding: "3px 0", alignItems: "center" }}>
                      <span>🏷️ Batch {i + 1} — {b.qty} pcs</span>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {b.tglMasuk && <span style={{ color: "#C48080" }}>Masuk: {b.tglMasuk}</span>}
                        {b.kadaluarsa && (
                          <span style={{ background: isExpired(b.kadaluarsa) ? "#FFE0E0" : isNearExpiry(b.kadaluarsa) ? "#FFF3CD" : "#E8F5E9", color: isExpired(b.kadaluarsa) ? "#D32F2F" : isNearExpiry(b.kadaluarsa) ? "#856404" : "#2E7D32", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>
                            {isExpired(b.kadaluarsa) ? "⛔ Exp" : isNearExpiry(b.kadaluarsa) ? "⚠️ Segera" : "✅"} {b.kadaluarsa}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button style={styles.btn()} onClick={() => setShowAddStock(true)}>+ Tambah Stok Masuk</button>
          </div>
        )}

        {/* === KARTU MEMBER === */}
        {page === "kartu" && (
          <div>
            <div style={styles.sectionTitle}>💳 Kartu Member</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {memberCards.map(card => (
                <div key={card.id} style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px #FADADD66", position: "relative" }}>
                  {card.img
                    ? <img src={card.img} alt={card.name} style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
                    : <div style={{ background: `linear-gradient(135deg, ${card.color}33, ${card.color}88)`, height: 130, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 36 }}>💳</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: card.color }}>{card.name}</div>
                        <div style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>Tap untuk lihat kartu</div>
                      </div>
                  }
                  <div style={{ background: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `3px solid ${card.color}` }}>
                    <div style={{ fontWeight: 700, color: "#8B3A52", fontSize: 13 }}>{card.name}</div>
                    <button onClick={() => deleteCard(card.id)} style={{ background: "none", border: "none", color: "#FADADD", fontSize: 14, cursor: "pointer" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ ...styles.btn(), marginTop: 14 }} onClick={() => setShowAddCard(true)}>+ Tambah Kartu Member</button>
          </div>
        )}

        {/* === DOMPET === */}
        {page === "dompet" && (
          <div>
            <div style={styles.sectionTitle}>👛 Link Dompet Digital</div>
            <div style={{ fontSize: 12, color: "#C48080", fontFamily: "sans-serif", marginBottom: 16 }}>Tap untuk buka langsung ke aplikasi pembayaran</div>
            {WALLETS.map(w => (
              <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ ...styles.card, background: `linear-gradient(135deg, ${w.color}11, ${w.color}22)`, border: `1.5px solid ${w.color}44`, marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ fontSize: 28 }}>{w.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: w.color }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: "#C48080", fontFamily: "sans-serif" }}>{w.url.replace("https://", "")}</div>
                  </div>
                  <div style={{ fontSize: 18, color: w.color }}>→</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* === MODALS === */}

      {/* Add Item Modal */}
      {showAddItem && (
        <div style={styles.modal} onClick={() => setShowAddItem(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#8B3A52", marginBottom: 16 }}>Tambah Item Belanja</div>
            <label style={styles.label}>Nama Barang</label>
            <input style={{ ...styles.input, marginBottom: 12 }} placeholder="contoh: Beras 5kg" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
            <label style={styles.label}>Kategori</label>
            <select style={{ ...styles.input, marginBottom: 12 }} value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={styles.label}>Estimasi Harga (Rp)</label>
            <input style={{ ...styles.input, marginBottom: 12 }} type="number" placeholder="0" value={newItem.estimasi} onChange={e => setNewItem({ ...newItem, estimasi: e.target.value })} />
            <label style={styles.label}>Jumlah</label>
            <input style={{ ...styles.input, marginBottom: 12 }} type="number" min={1} value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: e.target.value })} />
            <label style={styles.label}>Foto Barang (opsional)</label>
            <input ref={itemImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => readImg(e.target.files[0], src => setNewItem(i => ({ ...i, img: src })))} />
            {newItem.img
              ? <div style={{ position: "relative", marginBottom: 12 }}>
                  <img src={newItem.img} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid #F5C6CB" }} />
                  <button onClick={() => setNewItem(i => ({ ...i, img: null }))} style={{ position: "absolute", top: 6, right: 6, background: "#fff", border: "none", borderRadius: 99, width: 26, height: 26, cursor: "pointer", fontSize: 13, color: "#C48080", boxShadow: "0 2px 6px #0002" }}>✕</button>
                </div>
              : <button style={{ ...styles.btn("sm"), width: "100%", padding: "10px 0", marginBottom: 12 }} onClick={() => itemImgRef.current.click()}>📷 Upload Foto Barang</button>
            }
            <div style={{ marginBottom: 4 }} />
            <button style={styles.btn()} onClick={addItem}>Simpan</button>
            <button style={{ ...styles.btn("ghost"), marginTop: 6 }} onClick={() => setShowAddItem(false)}>Batal</button>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div style={styles.modal} onClick={() => setShowAddStock(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#8B3A52", marginBottom: 16 }}>Stok Masuk (Barang Baru)</div>
            <label style={styles.label}>Nama Barang</label>
            <input style={{ ...styles.input, marginBottom: 12 }} placeholder="contoh: Minyak Goreng" value={newStock.name} onChange={e => setNewStock({ ...newStock, name: e.target.value })} />
            <label style={styles.label}>Kategori</label>
            <select style={{ ...styles.input, marginBottom: 12 }} value={newStock.category} onChange={e => setNewStock({ ...newStock, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={styles.label}>Jumlah</label>
            <input style={{ ...styles.input, marginBottom: 12 }} type="number" min={1} value={newStock.qty} onChange={e => setNewStock({ ...newStock, qty: e.target.value })} />
            <label style={styles.label}>Tanggal Masuk</label>
            <input style={{ ...styles.input, marginBottom: 12 }} type="date" value={newStock.tglMasuk} onChange={e => setNewStock({ ...newStock, tglMasuk: e.target.value })} />
            <label style={styles.label}>Tanggal Kadaluarsa (opsional)</label>
            <input style={{ ...styles.input, marginBottom: 12 }} type="date" value={newStock.kadaluarsa} onChange={e => setNewStock({ ...newStock, kadaluarsa: e.target.value })} />
            <label style={styles.label}>Foto Barang (opsional)</label>
            <input ref={stockImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => readImg(e.target.files[0], src => setNewStock(s => ({ ...s, img: src })))} />
            {newStock.img
              ? <div style={{ position: "relative", marginBottom: 12 }}>
                  <img src={newStock.img} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid #F5C6CB" }} />
                  <button onClick={() => setNewStock(s => ({ ...s, img: null }))} style={{ position: "absolute", top: 6, right: 6, background: "#fff", border: "none", borderRadius: 99, width: 26, height: 26, cursor: "pointer", fontSize: 13, color: "#C48080", boxShadow: "0 2px 6px #0002" }}>✕</button>
                </div>
              : <button style={{ ...styles.btn("sm"), width: "100%", padding: "10px 0", marginBottom: 12 }} onClick={() => stockImgRef.current.click()}>📷 Upload Foto Barang</button>
            }
            <div style={{ marginBottom: 4 }} />
            <button style={styles.btn()} onClick={addStock}>Simpan</button>
            <button style={{ ...styles.btn("ghost"), marginTop: 6 }} onClick={() => setShowAddStock(false)}>Batal</button>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {showStockOut && (
        <div style={styles.modal} onClick={() => setShowStockOut(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#8B3A52", marginBottom: 8 }}>Ambil Stok (FIFO)</div>
            <div style={{ fontSize: 12, color: "#C48080", fontFamily: "sans-serif", marginBottom: 14 }}>Barang yang masuk lebih dulu akan diambil terlebih dahulu secara otomatis</div>
            <label style={styles.label}>Jumlah yang diambil</label>
            <input style={{ ...styles.input, marginBottom: 16 }} type="number" min={1} value={stockOutQty} onChange={e => setStockOutQty(e.target.value)} />
            <button style={styles.btn()} onClick={() => doStockOut(showStockOut)}>Konfirmasi Ambil</button>
            <button style={{ ...styles.btn("ghost"), marginTop: 6 }} onClick={() => setShowStockOut(null)}>Batal</button>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div style={styles.modal} onClick={() => setShowAddCard(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#8B3A52", marginBottom: 16 }}>Tambah Kartu Member</div>
            <label style={styles.label}>Nama Toko / Swalayan</label>
            <input style={{ ...styles.input, marginBottom: 12 }} placeholder="contoh: Indomaret, Alfamart" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
            <label style={styles.label}>Warna Kartu</label>
            <input type="color" value={newCard.color} onChange={e => setNewCard({ ...newCard, color: e.target.value })} style={{ marginBottom: 12, width: "100%", height: 40, borderRadius: 10, border: "1.5px solid #F5C6CB", cursor: "pointer" }} />
            <label style={styles.label}>Upload Foto Kartu (opsional)</label>
            <input ref={cardFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCardImg} />
            <button style={{ ...styles.btn("sm"), width: "100%", marginBottom: 4, padding: "10px 0" }} onClick={() => cardFileRef.current.click()}>📷 Pilih Foto Kartu</button>
            {newCard.img && <img src={newCard.img} alt="preview" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 130, objectFit: "cover" }} />}
            <div style={{ marginBottom: 16 }} />
            <button style={styles.btn()} onClick={addCard}>Simpan Kartu</button>
            <button style={{ ...styles.btn("ghost"), marginTop: 6 }} onClick={() => setShowAddCard(false)}>Batal</button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ position: "relative", maxWidth: 390, width: "100%" }}>
            <img src={previewImg} alt="preview" style={{ width: "100%", borderRadius: 20, objectFit: "contain", maxHeight: "80vh" }} />
            <button onClick={() => setPreviewImg(null)} style={{ position: "absolute", top: -14, right: -14, background: "#fff", border: "none", borderRadius: 99, width: 32, height: 32, cursor: "pointer", fontSize: 15, color: "#8B3A52", fontWeight: 700, boxShadow: "0 2px 10px #0004" }}>✕</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={styles.nav}>
        {navItems.map(n => (
          <button key={n.id} style={styles.navBtn(page === n.id)} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
