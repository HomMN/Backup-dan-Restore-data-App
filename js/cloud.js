/* =====================================================================
   cloud.js - Sinkronisasi data belajar ke Firebase Firestore (opsional)
   - Siswa: aktivitas belajar dikirim otomatis ke database kelas.
   - Guru : masuk dengan akun guru, lalu menarik data semua siswa
            ke Dashboard Kelas.
   Jika Firebase tidak terjangkau (offline), aplikasi tetap berjalan
   normal dan data tetap tersimpan di browser (localStorage).
   ===================================================================== */
const Cloud = (() => {
  const CONFIG = {
    apiKey: "AIzaSyBzZMEld-fMPewFAj7tWU9rZe-YhMRBZUo",
    authDomain: "backup-and-restore-data-smk.firebaseapp.com",
    projectId: "backup-and-restore-data-smk",
    storageBucket: "backup-and-restore-data-smk.firebasestorage.app",
    messagingSenderId: "930456497717",
    appId: "1:930456497717:web:5429c1f652e77bce5c8b7c"
  };
  const BASE = "https://www.gstatic.com/firebasejs/10.12.2/";
  const KOLEKSI = "siswa", INTERVAL_MS = 15000;

  let app = null, db = null, fs = null, auth = null, authMod = null;
  let lastKey = "", busy = false, msg = null;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* Modul Firebase dimuat saat dibutuhkan (import() dinamis tetap jalan
     walau index.html dibuka langsung dari file) */
  async function init() {
    if (db) return;
    const appMod = await import(BASE + "firebase-app.js");
    fs = await import(BASE + "firebase-firestore.js");
    app = appMod.initializeApp(CONFIG);
    db = fs.getFirestore(app);
  }

  /* ---------- Siswa: kirim data ke cloud ---------- */
  async function syncNow() {
    const l = LA.cur();
    if (busy || !l || l.demo) return;
    const key = [l.id, l.ev.length, l.max, l.nama, l.kelas].join("|");
    if (key === lastKey) return;
    busy = true;
    try {
      await init();
      await fs.setDoc(fs.doc(db, KOLEKSI, l.id), {
        id: l.id, nama: l.nama, kelas: l.kelas, t0: l.t0, max: l.max,
        ev: JSON.parse(JSON.stringify(l.ev)),
        updatedAt: fs.serverTimestamp()
      });
      lastKey = key;
    } catch (e) {
      /* gagal (offline / aturan akses): coba lagi pada putaran berikutnya */
    } finally {
      busy = false;
    }
  }
  setTimeout(syncNow, 3000);
  setInterval(syncNow, INTERVAL_MS);
  document.addEventListener("visibilitychange", () => { if (document.hidden) syncNow(); });
  addEventListener("pagehide", syncNow);

  /* ---------- Guru: tarik data semua siswa ---------- */
  async function pull(email, pass) {
    await init();
    if (!auth) {
      authMod = await import(BASE + "firebase-auth.js");
      auth = authMod.getAuth(app);
    }
    if (!auth.currentUser) await authMod.signInWithEmailAndPassword(auth, email, pass);
    const snap = await fs.getDocs(fs.collection(db, KOLEKSI));
    const learners = snap.docs.map((d) => {
      const r = d.data();
      delete r.updatedAt;
      return r;
    });
    return LA.importJSON(JSON.stringify({ app: "backup-restore-la", v: 1, at: Date.now(), learners }));
  }

  const PESAN = {
    "auth/invalid-credential": "Email atau password salah.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    "permission-denied": "Akun ini tidak punya izin membaca data (periksa Rules Firestore)."
  };
  async function pullUI() {
    const email = ($("#ce") || {}).value || "", pass = ($("#cp") || {}).value || "";
    if (!auth && (!email || !pass)) { msg = ["no", "Isi email dan password akun guru."]; return Dash.tab("kelas"); }
    msg = ["ok", "Mengambil data dari cloud..."];
    try {
      const r = await pull(email.trim(), pass);
      msg = r.err ? ["no", r.err] : ["ok", "Selesai: " + r.add + " siswa baru, " + r.upd + " diperbarui, " + r.skip + " sudah sama."];
    } catch (e) {
      msg = ["no", PESAN[e.code] || "Gagal mengambil data (" + (e.code || e.message || "tidak diketahui") + ")."];
    }
    Dash.tab("kelas");
  }

  /* Kartu yang ditampilkan di Dashboard Kelas (setelah PIN guru dibuka) */
  function card() {
    return `
      <div class="card">
      <h3>☁ Data dari cloud</h3>
      <p class="hint">Masuk dengan akun guru untuk mengambil data belajar semua siswa dari database kelas.</p>
      <div class="row"><input id="ce" class="tx" type="email" placeholder="Email guru" autocomplete="off" style="max-width:240px"><input id="cp" class="tx" type="password" placeholder="Password" autocomplete="off" style="max-width:200px"><button class="pri" onclick="Cloud.pullUI()">Masuk dan tarik data</button></div>
      ${msg ? `<div class="fb ${msg[0]}">${esc(msg[1])}</div>` : ""}</div>`;
  }

  return { syncNow, pull, pullUI, card };
})();
