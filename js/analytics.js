/* =====================================================================
   analytics.js — Learning Analytics
   1) Mencatat jejak belajar (event log) per siswa di localStorage
   2) Menghitung Descriptive, Diagnostic, dan Recommendation
   Data disimpan di localStorage dan, bila cloud.js aktif, disalin ke Firebase Firestore.
   ===================================================================== */
const LA = (() => {
  const KEY = "la_v1", PIN = "Guru1004", PASS = 75, NS = 7, NQ = 6;

  /* Nama layar (indeks 0-6, sama dengan pindahLayar(n) di core.js) */
  const SCR = ["Pembuka", "Tujuan", "Pengantar & media", "Jenis backup", "Simulasi backup", "Simulasi restore", "Evaluasi"];

  /* Peta soal kuis -> konsep, layar materi terkait, dugaan miskonsepsi, saran tindak lanjut */
  const QM = [
    { c: "Jenis backup: incremental", s: 3, mis: "Menyamakan incremental dengan differential (acuan perubahan: backup terakhir vs full terakhir).", rem: "Putar ulang animasi Layar 4 secara klasikal. Minta siswa menebak file yang disalin hari Rabu sebelum animasi diputar." },
    { c: "Restore differential vs incremental", s: 3, mis: "Menukar konsep: restore incremental butuh seluruh rantai backup, sedangkan differential cukup full + differential terakhir.", rem: 'Buat tabel perbandingan langkah restore ketiga jenis backup, lalu beri 2 soal latihan "backup mana yang dibutuhkan untuk restore hari Rabu?".' },
    { c: "Lokasi backup terpisah", s: 2, mis: "Belum memahami prinsip bahwa cadangan harus terpisah dari data asli.", rem: "Diskusikan kasus laptop dan tas hilang bersama: apa yang ikut hilang jika flashdisk backup ada di tas yang sama?" },
    { c: "Memilih titik pemulihan", s: 5, mis: "Belum memahami bahwa titik pemulihan harus sebelum kejadian dan restore dilakukan ke folder baru.", rem: "Beri 3 lini masa kejadian lain dan minta siswa menentukan titik pemulihan beserta alasannya." },
    { c: "Uji restore berkala", s: 5, mis: "Menganggap backup pasti berfungsi tanpa pernah diuji.", rem: "Beri tugas kecil: siswa menguji restore satu file dan melaporkan hasilnya." },
    { c: "Strategi backup pada studi kasus", s: 3, mis: "Belum mampu menerapkan konsep pada kasus nyata (menggabungkan full + differential + cloud).", rem: "Beri studi kasus tambahan dengan kendala berbeda (ruang, waktu, pengguna) agar siswa berlatih memilih strategi." }
  ];

  /* Kode kesalahan simulasi. k: 'p' = prosedur (formulir belum lengkap), 'k' = konsep */
  const ERR = {
    bk: {
      nofolder: { k: "p", t: "Belum memilih folder" },
      nodst: { k: "p", t: "Belum memilih media tujuan" },
      notype: { k: "p", t: "Belum memilih jenis backup" },
      game: { k: "k", s: 4, t: "Memilih folder Game (bukan data penting)", rem: "Tekankan cara memilah data penting dan tidak penting sebelum backup." },
      one: { k: "k", s: 4, t: "Hanya satu folder dipilih (skenario kurang dibaca)", rem: "Biasakan siswa membaca skenario dan daftar kebutuhan sebelum bertindak." },
      notfull: { k: "k", s: 3, t: "Memilih incremental/differential pada backup pertama", rem: "Jelaskan bahwa backup pertama harus Full sebagai acuan bagi backup berikutnya." }
    },
    rs: {
      nover: { k: "p", t: "Belum memilih titik pemulihan" },
      noloc: { k: "p", t: "Belum memilih lokasi restore" },
      old: { k: "k", s: 5, t: "Memilih titik pemulihan terlalu lama", rem: "Latih membaca keterangan tiap versi backup sebelum memilih." },
      after: { k: "k", s: 5, t: "Memilih backup yang dibuat setelah file terhapus", rem: "Tekankan: pilih titik pemulihan SEBELUM kejadian." },
      asli: { k: "k", s: 5, t: "Menimpa folder asli langsung", rem: "Tekankan risiko menimpa data yang masih dipakai; restore dulu ke folder baru." },
      usb: { k: "k", s: 5, t: "Restore ke perangkat orang lain", rem: "Bahas risiko kebocoran data jika restore dilakukan ke perangkat orang lain." }
    }
  };

  /* ---------- Penyimpanan ---------- */
  let DB, tm = null;
  function load() {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {
    }
    if (!o || typeof o !== "object" || !o.L || typeof o.L !== "object") o = { cur: null, L: {} };
    return o;
  }
  DB = load();
  function saveNow() {
    clearTimeout(tm);
    tm = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(DB));
    } catch (e) {
    }
  }
  function save() {
    if (!tm) tm = setTimeout(saveNow, 300);
  }
  const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
  const cur = () => DB.cur && DB.L[DB.cur] || null;
  const all = () => Object.values(DB.L);
  function start(nama, kelas) {
    const id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const n = clean(nama, 40) || "Anonim-" + id.slice(-4);
    DB.L[id] = { id, nama: n, kelas: clean(kelas, 30), t0: Date.now(), max: 0, ev: [] };
    DB.cur = id;
    push(DB.L[id], { e: "sess" });
    saveNow();
    return DB.L[id];
  }
  function use(id) {
    if (!DB.L[id]) return null;
    DB.cur = id;
    push(DB.L[id], { e: "sess" });
    saveNow();
    return DB.L[id];
  }
  function push(l, ev) {
    ev.t = Date.now();
    l.ev.push(ev);
    if (l.ev.length > 3e3) l.ev = l.ev.slice(-3e3);
    save();
  }
  function log(e, d) {
    const l = cur();
    if (l) push(l, Object.assign({ e }, d || {}));
  }

  /* ---------- Pencatat waktu per layar ---------- */
  let curN = null, sc = null, paused = false;
  function begin(cont) {
    if (cur() && curN != null && !document.hidden) sc = { n: curN, t0: Date.now(), c: cont };
  }
  function flush() {
    if (!sc) return;
    const ms = Math.min(Date.now() - sc.t0, 6e5), l = cur();
    if (l && ms > 300) push(l, sc.c ? { e: "scr", n: sc.n, ms, c: 1 } : { e: "scr", n: sc.n, ms });
    sc = null;
  }
  function screen(n) {
    flush();
    curN = n;
    paused = false;
    const l = cur();
    if (l) {
      l.max = Math.max(l.max || 0, n);
      save();
    }
    begin(false);
  }
  function pause() {
    flush();
    paused = true;
  }
  function resume() {
    paused = false;
    begin(true);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flush();
      saveNow();
    } else if (!paused) begin(true);
  });
  addEventListener("pagehide", () => {
    flush();
    saveNow();
  });
  function nextAtt() {
    const l = cur();
    let m = 0;
    if (l) {
      for (const x of l.ev) if ((x.e === "qa" || x.e === "qd") && x.att > m) m = x.att;
    }
    return m + 1;
  }

  /* ---------- Ekspor / Impor / Hapus ---------- */
  function exportJSON() {
    return JSON.stringify({ app: "backup-restore-la", v: 1, at: Date.now(), learners: all() });
  }
  function sanitizeEv(x) {
    if (!x || typeof x !== "object") return null;
    const t = +x.t;
    if (!isFinite(t)) return null;
    const int = (v, a, b) => {
      v = Math.round(+v);
      return v >= a && v <= b ? v : null;
    };
    const base = { e: x.e, t };
    switch (x.e) {
      case "sess":
        return base;
      case "scr": {
        const n = int(x.n, 0, NS - 1), ms = int(x.ms, 0, 6e5);
        if (n == null || ms == null) return null;
        base.n = n;
        base.ms = ms;
        if (x.c) base.c = 1;
        return base;
      }
      case "vid":
        if (x.a !== "play" && x.a !== "done") return null;
        base.a = x.a;
        return base;
      case "hot":
        if (!["hdd", "fd", "nas", "cl"].includes(x.k)) return null;
        base.k = x.k;
        return base;
      case "anim":
        if (!["full", "incr", "diff"].includes(x.k) || x.a !== "play" && x.a !== "done") return null;
        base.k = x.k;
        base.a = x.a;
        return base;
      case "bk":
      case "rs": {
        base.ok = x.ok ? 1 : 0;
        if (!base.ok) {
          if (!ERR[x.e][x.err]) return null;
          base.err = x.err;
        }
        return base;
      }
      case "qa": {
        const att = int(x.att, 1, 50), q = int(x.q, 0, NQ - 1), pick = int(x.pick, 0, 3), ms = int(x.ms, 0, 36e5);
        if ([att, q, pick, ms].includes(null)) return null;
        Object.assign(base, { att, q, pick, ok: x.ok ? 1 : 0, ms });
        return base;
      }
      case "qd": {
        const att = int(x.att, 1, 50), s = int(x.sc, 0, NQ), tot = int(x.tot, 1, NQ);
        if ([att, s, tot].includes(null)) return null;
        Object.assign(base, { att, sc: s, tot });
        return base;
      }
    }
    return null;
  }
  function sanitizeLearner(r) {
    if (!r || typeof r !== "object" || !/^[\w-]{3,40}$/.test(String(r.id))) return null;
    const ev = (Array.isArray(r.ev) ? r.ev : []).slice(0, 3e3).map(sanitizeEv).filter(Boolean);
    const l = { id: String(r.id), nama: clean(r.nama, 40) || "Tanpa nama", kelas: clean(r.kelas, 30), t0: +r.t0 || Date.now(), max: Math.min(NS - 1, Math.max(0, Math.round(+r.max) || 0)), ev };
    if (r.demo) l.demo = true;
    return l;
  }
  function importJSON(text) {
    let o;
    try {
      o = JSON.parse(text);
    } catch (e) {
      return { err: "File bukan JSON yang valid." };
    }
    if (!o || o.app !== "backup-restore-la" || !Array.isArray(o.learners)) return { err: "Format file tidak dikenali (bukan data dari aplikasi ini)." };
    let add = 0, upd = 0, skip = 0;
    for (const r of o.learners) {
      const l = sanitizeLearner(r);
      if (!l) {
        skip++;
        continue;
      }
      const ex = DB.L[l.id];
      if (!ex) {
        DB.L[l.id] = l;
        add++;
      } else if (l.ev.length > ex.ev.length) {
        DB.L[l.id] = l;
        upd++;
      } else skip++;
    }
    saveNow();
    return { add, upd, skip };
  }
  function putMany(arr) {
    for (const l of arr) DB.L[l.id] = l;
    saveNow();
  }
  function remove(id) {
    delete DB.L[id];
    if (DB.cur === id) DB.cur = null;
    saveNow();
  }
  function clearDemo() {
    for (const l of all()) if (l.demo) delete DB.L[l.id];
    if (DB.cur && !DB.L[DB.cur]) DB.cur = null;
    saveNow();
  }
  function clearAll() {
    DB = { cur: null, L: {} };
    saveNow();
  }

  /* ---------- Statistik dasar ---------- */
  const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const median = (a) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const pearson = (xs, ys) => {
    const n = xs.length;
    if (n < 3) return null;
    const mx = mean(xs), my = mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  };
  const r0 = (v) => v == null ? null : Math.round(v);

  /* ---------- Ringkasan satu siswa ---------- */
  function sum(l) {
    const ms = Array(NS).fill(0), vis = Array(NS).fill(0);
    const bk = { n: 0, ok: 0, err: {} }, rs = { n: 0, ok: 0, err: {} };
    let sess = 0, vp = 0, vd = 0, ap = 0;
    const hot = new Set(), ad = new Set(), A = {};
    for (const x of l.ev) {
      switch (x.e) {
        case "sess":
          sess++;
          break;
        case "scr":
          ms[x.n] += x.ms;
          if (!x.c) vis[x.n]++;
          break;
        case "vid":
          x.a === "play" ? vp++ : vd++;
          break;
        case "hot":
          hot.add(x.k);
          break;
        case "anim":
          if (x.a === "play") ap++;
          else ad.add(x.k);
          break;
        case "bk":
        case "rs": {
          const o = x.e === "bk" ? bk : rs;
          o.n++;
          if (x.ok) o.ok++;
          else o.err[x.err] = (o.err[x.err] || 0) + 1;
          break;
        }
        case "qa": {
          const a = A[x.att] || (A[x.att] = { att: x.att, ans: [], done: false });
          a.ans.push(x);
          break;
        }
        case "qd": {
          const a = A[x.att] || (A[x.att] = { att: x.att, ans: [], done: false });
          a.done = true;
          a.sc = x.sc;
          a.tot = x.tot;
          a.pct = Math.round(x.sc / x.tot * 100);
          break;
        }
      }
    }
    const quiz = Object.values(A).filter((a) => a.done).sort((a, b) => a.att - b.att);
    const best = quiz.length ? Math.max(...quiz.map((a) => a.pct)) : null;
    const totalMs = ms.reduce((a, b) => a + b, 0);
    const prog = Math.round(((l.max || 0) + 1) / NS * 100);
    const kerr = (o, grp) => Object.entries(o.err).filter(([c]) => ERR[grp][c].k === "k").reduce((a, [, n]) => a + n, 0);
    return { ms, vis, totalMs, sess, vp, vd, ap, hot: hot.size, anim: ad.size, bk, rs, quiz, best, last: quiz.length ? quiz[quiz.length - 1] : null, prog, kerr: kerr(bk, "bk") + kerr(rs, "rs") };
  }

  /* ---------- Ringkasan kelas (Descriptive) ---------- */
  function cls(list) {
    const R = list.map((l) => ({ l, s: sum(l) })), n = R.length, D = R.filter((r) => r.s.quiz.length);
    const items = Array.from({ length: NQ }, (_, q) => {
      const dist = [0, 0, 0, 0];
      let nn = 0, ok = 0;
      for (const r of D) {
        const a = r.s.quiz[0].ans.find((x) => x.q === q);
        if (a) {
          nn++;
          dist[a.pick]++;
          if (a.ok) ok++;
        }
      }
      return { q, n: nn, ok, pct: nn ? Math.round(ok / nn * 100) : null, dist };
    });
    const scored = items.filter((i) => i.pct != null);
    const hardest = scored.length ? scored.reduce((a, b) => b.pct < a.pct ? b : a) : null;
    const reach = Array.from({ length: NS }, (_, i) => n ? Math.round(R.filter((r) => (r.l.max || 0) >= i).length / n * 100) : 0);
    const avgMs = Array.from({ length: NS }, (_, i) => {
      const v = R.map((r) => r.s.ms[i]).filter((x) => x > 0);
      return v.length ? mean(v) : null;
    });
    const bests = D.map((r) => r.s.best);
    const bins = [bests.filter((b) => b < 50).length, bests.filter((b) => b >= 50 && b < 75).length, bests.filter((b) => b >= 75 && b < 90).length, bests.filter((b) => b >= 90).length];
    const trend = [0, 1, 2].map((k) => {
      const v = D.map((r) => r.s.quiz[k]).filter(Boolean).map((a) => a.pct);
      return { k: k + 1, n: v.length, v: v.length ? mean(v) : null };
    });
    const sim = (grp) => {
      const o = { n: 0, ok: 0, err: {}, users: 0 };
      for (const r of R) {
        const g = r.s[grp];
        o.n += g.n;
        o.ok += g.ok;
        if (g.n) o.users++;
        for (const [c, k] of Object.entries(g.err)) o.err[c] = (o.err[c] || 0) + k;
      }
      return o;
    };
    const med3 = median(R.map((r) => r.s.ms[3]).filter((x) => x > 0));
    for (const r of R) {
      const f = [];
      if (r.s.best != null && r.s.best < PASS) f.push("Skor kuis < " + PASS);
      if (r.s.kerr >= 3) f.push("Berulang salah di simulasi");
      if (r.s.quiz.length && med3 && r.s.ms[3] > 0 && r.s.ms[3] < 0.6 * med3) f.push("Layar 4 dibuka singkat");
      r.flags = f;
    }
    return {
      n,
      R,
      D,
      nd: D.length,
      notSub: n - D.length,
      items,
      hardest,
      reach,
      avgMs,
      bins,
      trend,
      med3,
      avgFirst: D.length ? mean(D.map((r) => r.s.quiz[0].pct)) : null,
      avgBest: D.length ? mean(bests) : null,
      tuntas: D.filter((r) => r.s.best >= PASS).length,
      media: { vid: n ? R.filter((r) => r.s.vd > 0).length / n * 100 : 0, hot: n ? mean(R.map((r) => r.s.hot)) : 0, anim: n ? R.filter((r) => r.s.anim >= 3).length / n * 100 : 0 },
      bk: sim("bk"),
      rs: sim("rs"),
      avgTime: n ? mean(R.map((r) => r.s.totalMs)) : null
    };
  }

  /* ---------- Diagnostic: mengapa terjadi? ---------- */
  function diag(c) {
    const F = [];
    if (c.nd < 3) return { F, enough: false };
    const nm = (q) => "Soal " + (q + 1);

    /* 1. Soal dengan persentase benar rendah */
    for (const it of c.items) {
      if (it.pct == null || it.n < 3 || it.pct >= 60) continue;
      const m = QM[it.q], ev = [], causes = [];
      ev.push(nm(it.q) + " dijawab benar oleh " + it.pct + "% siswa (" + it.ok + " dari " + it.n + " siswa, percobaan pertama).");
      const wrong = it.dist.map((v, i) => ({ v, i })).filter((x) => x.i !== BANK_SOAL[it.q].kunci && x.v > 0).sort((a, b) => b.v - a.v);
      const wtot = wrong.reduce((a, b) => a + b.v, 0);
      let spread = true;
      if (wrong.length) {
        const sh = Math.round(wrong[0].v / wtot * 100);
        ev.push('Jawaban salah terbanyak: "' + BANK_SOAL[it.q].opsi[wrong[0].i] + '" (' + sh + "% dari jawaban salah).");
        if (sh >= 45) {
          spread = false;
          causes.push("Dugaan miskonsepsi: " + m.mis);
        }
      }
      const okMs = [], noMs = [];
      for (const r of c.D) {
        const a = r.s.quiz[0].ans.find((x) => x.q === it.q), t = r.s.ms[m.s];
        if (a && t > 0) (a.ok ? okMs : noMs).push(t);
      }
      if (okMs.length >= 2 && noMs.length >= 2) {
        const a = mean(okMs), b = mean(noMs);
        ev.push("Rata-rata waktu di Layar " + (m.s + 1) + ": " + Math.round(b / 1e3) + " dtk (yang salah) vs " + Math.round(a / 1e3) + " dtk (yang benar).");
        if (b < 0.75 * a) causes.push("Materi Layar " + (m.s + 1) + " kemungkinan dilewati terlalu cepat.");
      }
      if (spread) causes.push("Kesalahan menyebar ke banyak pilihan: periksa kemungkinan soal kurang jelas (wording) atau konsep prasyarat belum dikuasai.");
      F.push({ id: "q" + it.q, sev: it.pct < 40 ? "high" : "mid", t: nm(it.q) + " (" + m.c + ") sulit bagi sebagian besar siswa", ev, causes, act: "Periksa Layar " + (m.s + 1) + " dan rumusan soal. " + m.rem, s: m.s });
    }

    /* 2. Kesalahan konsep di simulasi */
    for (const [grp, lab] of [["bk", "backup"], ["rs", "restore"]]) {
      const o = c[grp], ents = Object.entries(o.err).filter(([k]) => ERR[grp][k].k === "k").sort((a, b) => b[1] - a[1]);
      if (!ents.length || o.users < 3) continue;
      const [code, cnt] = ents[0], e = ERR[grp][code], fails = o.n - o.ok;
      if (cnt < 3 || cnt / Math.max(1, fails) < 0.25) continue;
      F.push({
        id: grp + "_" + code,
        sev: cnt >= 6 ? "high" : "mid",
        t: "Kesalahan berulang pada simulasi " + lab + ": " + e.t.toLowerCase(),
        ev: ["Terjadi " + cnt + " kali dari " + fails + " percobaan gagal (dari total " + o.n + " percobaan simulasi " + lab + ")."],
        causes: ["Kemungkinan konsep terkait belum dipahami, atau petunjuk skenario kurang diperhatikan."],
        act: e.rem,
        s: e.s
      });
    }

    /* 3. Membuka materi inti terlalu singkat */
    const quick = c.R.filter((r) => r.s.quiz.length && c.med3 && r.s.ms[3] > 0 && r.s.ms[3] < 0.6 * c.med3), rest = c.R.filter((r) => r.s.quiz.length && !quick.includes(r) && r.s.ms[3] > 0);
    if (quick.length >= 2 && rest.length >= 2) {
      const a = mean(quick.map((r) => r.s.best)), b = mean(rest.map((r) => r.s.best));
      F.push({
        id: "quick",
        sev: b - a >= 10 ? quick.length >= 3 ? "high" : "mid" : "info",
        t: "Sebagian siswa membuka Layar 4 (Jenis backup) jauh lebih singkat dari median kelas",
        ev: [quick.length + " siswa membuka Layar 4 kurang dari 60% median kelas (" + Math.round(c.med3 / 1e3) + " dtk)" + (quick.length < 3 ? "; jumlah ini masih kecil sehingga perlu dikonfirmasi" : "") + ".", "Skor terbaik rata-rata mereka " + Math.round(a) + " vs " + Math.round(b) + " pada siswa lain."],
        causes: ['Siswa mungkin hanya mengejar tombol "Lanjut" tanpa mencermati animasi.', "Kemungkinan lain: siswa sudah paham sebelumnya. Cek bersama skor kuisnya."],
        act: "Tambahkan pertanyaan pemantik di Layar 4 sebelum tombol Lanjut aktif.",
        s: 3
      });
    }

    /* 4. Hubungan waktu belajar dan skor */
    const xs = c.D.map((r) => r.s.totalMs), ys = c.D.map((r) => r.s.best), cr = c.nd >= 5 ? pearson(xs, ys) : null;
    if (cr != null) {
      const ab = Math.abs(cr), lv = ab >= 0.6 ? "kuat" : ab >= 0.3 ? "sedang" : "lemah";
      F.push({
        id: "corr",
        sev: "info",
        t: "Hubungan waktu belajar total dengan skor terbaik: " + lv + (cr >= 0 ? " (positif)" : " (negatif)"),
        ev: ["Koefisien korelasi r = " + cr.toFixed(2) + " (n = " + c.nd + " siswa)."],
        causes: ["Korelasi bukan sebab-akibat: waktu lebih lama bisa karena rajin atau karena kesulitan memahami."],
        act: "Gunakan sebagai petunjuk awal, lalu konfirmasi lewat wawancara singkat dengan siswa."
      });
    }

    /* 5. Partisipasi */
    if (c.n >= 3 && c.notSub / c.n > 0.3) {
      F.push({
        id: "part",
        sev: "mid",
        t: c.notSub + " dari " + c.n + " siswa belum menyelesaikan kuis",
        ev: ["Belum menyelesaikan kuis: " + Math.round(c.notSub / c.n * 100) + "% siswa."],
        causes: ["Jangan langsung menyimpulkan siswa malas. Kemungkinan: kendala perangkat/akses, belum mendapat waktu, kesulitan di simulasi, atau belum membuka aplikasi."],
        act: "Tanyakan langsung kepada siswa terkait sebelum mengambil keputusan."
      });
    }

    /* 6. Efek mengulang kuis */
    const t1 = c.trend[0], t2 = c.trend[1];
    if (t2.n >= 3) {
      const both = c.D.filter((r) => r.s.quiz.length >= 2), d = mean(both.map((r) => r.s.quiz[1].pct - r.s.quiz[0].pct));
      F.push({
        id: "retake",
        sev: "info",
        t: "Perubahan skor setelah mengulang kuis: " + (d >= 0 ? "+" : "") + Math.round(d) + " poin rata-rata",
        ev: [both.length + " siswa mengulang kuis; rata-rata percobaan 1 = " + Math.round(t1.v) + ", percobaan 2 = " + Math.round(t2.v) + "."],
        causes: [d > 5 ? "Remedial (mengulang materi) tampaknya membantu." : "Peningkatan kecil: mengulang kuis saja mungkin belum cukup tanpa penjelasan tambahan."],
        act: d > 5 ? 'Pertahankan alur "ulangi materi lalu ulangi kuis".' : "Tambahkan umpan balik yang lebih spesifik pada soal yang salah."
      });
    }
    const w = { high: 0, mid: 1, info: 2 };
    F.sort((a, b) => w[a.sev] - w[b.sev]);
    return { F, enough: true };
  }

  /* ---------- Recommendation untuk guru ---------- */
  function recClass(c, d) {
    const R = [];
    if (!c.n) return R;
    for (const f of d.F) {
      if (f.sev === "info" && !["quick", "retake"].includes(f.id)) continue;
      R.push({ pri: f.sev === "high" ? "Tinggi" : f.sev === "mid" ? "Sedang" : "Rendah", t: f.t, a: f.act, s: f.s });
    }
    if (c.nd >= 3 && c.avgBest >= 85 && c.tuntas / c.nd >= 0.8) R.push({ pri: "Rendah", t: "Sebagian besar siswa sudah tuntas dengan skor tinggi", a: "Berikan pengayaan: siswa menyusun jadwal backup rutin untuk laptop atau HP masing-masing (Layar 7)." });
    const flagged = c.R.filter((r) => r.flags.length);
    if (flagged.length) R.push({ pri: "Sedang", t: flagged.length + " siswa memiliki indikator yang perlu diperhatikan (lihat tabel siswa)", a: "Lakukan pendampingan singkat atau tanyakan kendala mereka. Indikator hanyalah petunjuk, bukan label kemampuan siswa." });
    const w = { Tinggi: 0, Sedang: 1, Rendah: 2 };
    return R.sort((a, b) => w[a.pri] - w[b.pri]);
  }

  /* ---------- Recommendation untuk siswa ---------- */
  function recStudent(l) {
    const s = sum(l), R = [];
    if (s.totalMs < 5e3 && (l.max || 0) === 0) {
      R.push({ t: "Mulai dari awal: ikuti materi berurutan dari Layar 1.", s: 0 });
      return R;
    }
    if (!s.quiz.length) {
      R.push({ t: "Selesaikan materi sampai Layar 7, lalu kerjakan kuis untuk melihat pemahamanmu.", s: Math.min(NS - 1, l.max || 0) });
      if (s.bk.n && s.bk.ok === 0) R.push({ t: "Simulasi backup belum berhasil. Baca skenario pelan-pelan dan lihat umpan balik pada setiap percobaan.", s: 4 });
      if (s.rs.n && s.rs.ok === 0) R.push({ t: "Simulasi restore belum berhasil. Ingat: pilih titik SEBELUM file terhapus dan restore ke folder baru.", s: 5 });
      return R;
    }
    const lastAns = s.last.ans, wrong = lastAns.filter((a) => !a.ok).map((a) => a.q), seen = new Set();
    for (const q of wrong) {
      const m = QM[q];
      if (seen.has(m.s + "|" + m.c)) continue;
      seen.add(m.s + "|" + m.c);
      R.push({ t: "Soal " + (q + 1) + " belum tepat. Ulangi materi: " + m.c + " (Layar " + (m.s + 1) + ").", s: m.s });
    }
    for (const [grp, o] of [["bk", s.bk], ["rs", s.rs]]) {
      const top = Object.entries(o.err).filter(([c]) => ERR[grp][c].k === "k").sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) R.push({ t: "Kesalahan yang berulang di simulasi " + (grp === "bk" ? "backup" : "restore") + ": " + ERR[grp][top[0]].t.toLowerCase() + ". Coba simulasinya lagi dengan lebih teliti.", s: grp === "bk" ? 4 : 5 });
    }
    if (s.best >= PASS && !wrong.length) R.push({ t: "Kamu menjawab semua soal dengan tepat. Tantangan: susun jadwal backup rutin untuk laptop atau HP-mu.", s: null });
    else if (s.best >= PASS) R.push({ t: "Kamu sudah tuntas. Perkuat bagian yang masih keliru di atas, lalu coba kuis lagi bila ingin skor lebih baik.", s: null });
    else R.push({ t: "Skor belum mencapai " + PASS + ". Ulangi materi yang disarankan, lalu kerjakan kuis lagi. Setiap percobaan membantu!", s: null });
    return R;
  }
  return {
    PIN,
    PASS,
    NS,
    NQ,
    SCR,
    QM,
    ERR,
    cur,
    all,
    get: (id) => DB.L[id],
    start,
    use,
    log,
    screen,
    pause,
    resume,
    nextAtt,
    exportJSON,
    importJSON,
    putMany,
    remove,
    clearDemo,
    clearAll,
    saveNow,
    sum,
    cls,
    diag,
    recClass,
    recStudent,
    mean,
    median
  };
})();
