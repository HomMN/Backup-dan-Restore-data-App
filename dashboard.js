/* =====================================================================
   dashboard.js — Tampilan Learning Analytics
   - Rapor Saya (siswa)
   - Dashboard Kelas (guru): Descriptive, Diagnostic, Recommendation
   - Data & Privasi (transparansi)
   ===================================================================== */
const Dash = (() => {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const r0 = (v) => v == null ? null : Math.round(v);
  const pc = (v) => v == null ? "–" : Math.round(v) + "%";
  const fmtT = (ms) => {
    if (ms == null) return "–";
    const s = Math.round(ms / 1e3);
    return s < 60 ? s + " dtk" : Math.floor(s / 60) + " mnt " + String(s % 60).padStart(2, "0") + " dtk";
  };
  let tab = "me", unlocked = false, onlyFlag = false, note = null, switching = false;

  /* ---------- Komponen visual ---------- */
  const kpi = (v, l, sub) => `
      <div class="kpi"><b>${v}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const hb = (rows, max = 100) => `
      <div class="hbs">${rows.map((r) => `
      <div class="hb"><span class="hl">${r.l}</span><span class="ht" aria-hidden="true"><i class="${r.tone || ""}" style="width:${r.v == null ? 0 : Math.max(0, Math.min(100, r.v / (r.max || max) * 100))}%"></i></span><b class="hv">${r.txt}</b></div>`).join("")}</div>`;
  const tone = (p) => p == null ? "" : p >= 75 ? "ok" : p >= 60 ? "amb" : "bad";
  function lineChart(pts) {
    const W = 340, H = 184, L = 40, R = 40, T = 14, B = 44, iw = W - L - R, ih = H - T - B;
    const x = (i) => L + (pts.length === 1 ? iw / 2 : i * iw / (pts.length - 1)), y = (v) => T + ih - v / 100 * ih;
    const grid = [0, 25, 50, 75, 100].map((g) => `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" ${g === 75 ? 'class="th"' : ""}/><text x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${g}</text>`).join("");
    const ok = pts.map((p, i) => ({ ...p, i })).filter((p) => p.v != null);
    const path = ok.length > 1 ? `<polyline class="ln" points="${ok.map((p) => x(p.i) + "," + y(p.v)).join(" ")}"/>` : "";
    const dots = ok.map((p) => `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="5"/><text x="${x(p.i)}" y="${y(p.v) - 10}" text-anchor="middle" class="vl">${Math.round(p.v)}</text>`).join("");
    const labs = pts.map((p, i) => `<text x="${x(i)}" y="${H - 22}" text-anchor="middle">${p.l}</text>` + (p.n != null ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">n = ${p.n}</text>` : "")).join("");
    const desc = ok.map((p) => p.l + ": " + Math.round(p.v)).join(", ");
    return `<svg class="lg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik garis rata-rata skor. ${esc(desc)}">${grid}${path}${dots}${labs}</svg>
      <div class="hint">Garis putus-putus = batas tuntas (${LA.PASS}).</div>`;
  }
  const donut = (p, lab) => `
      <div class="dn" style="--p:${p}" role="img" aria-label="${p}% ${lab}">
      <div><b>${p}%</b><span>${lab}</span></div></div>`;
  const noteHtml = () => note ? `
      <div class="fb ${note.t}" role="status">${esc(note.m)}</div>` : "";
  const setNote = (t, m) => {
    note = { t, m };
  };

  /* ---------- Kerangka ---------- */
  function shell(inner) {
    const T = [["me", "📊 Progres Belajar"], ["kelas", "👨‍🏫 Dashboard Kelas"], ["info", "🔒 Data & Privasi"]];
    return `
      <div class="dh">
      <div><h1 class="dt">Dashboard</h1><p class="hint" style="margin:0">Jejak belajar diubah menjadi informasi untuk membantu keputusan belajar.</p></div><button class="pri" onclick="Dash.enter()">${state.cur > 0 ? "▶ Lanjutkan Materi" : "▶ Masuk ke Materi"}</button></div>
    <div class="tabs" role="tablist">${T.map(([k, n]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? "on" : ""}" onclick="Dash.tab('${k}')">${n}</button>`).join("")}</div>${noteHtml()}${inner}`;
  }
  function draw() {
    const v = tab === "me" ? me() : tab === "kelas" ? kelas() : info();
    $("#v").innerHTML = shell(v);
    note = null;
  }

  /* ---------- Diagnostik per siswa: mengapa jawabanku keliru? ---------- */
  function diagMe(l, s) {
    if (!s.quiz.length) return "";
    const wrong = s.last.ans.filter((a) => !a.ok).sort((a, b) => a.q - b.q);
    const others = LA.all().filter((x) => x.id !== l.id).map((x) => LA.sum(x));
    const items = wrong.map((a) => {
      const m = LA.QM[a.q], B = BANK_SOAL[a.q], mine = s.ms[m.s];
      const arr = others.map((o) => o.ms[m.s]).filter((v) => v > 0), med = arr.length >= 3 ? LA.median(arr) : null;
      const why = ['Kamu memilih "' + B.opsi[a.pick] + '"; jawaban yang tepat: "' + B.opsi[B.kunci] + '".', "Kemungkinan penyebab: " + m.mis];
      if (!mine) why.push("Kamu belum tercatat membuka Layar " + (m.s + 1) + " (" + LA.SCR[m.s] + "), padahal materinya terkait soal ini.");
      else if (med && mine < 0.75 * med) why.push("Waktumu di Layar " + (m.s + 1) + " (" + fmtT(mine) + ") lebih singkat dari median kelas (" + fmtT(med) + "). Materi mungkin terlewat terlalu cepat.");
      else if (med) why.push("Waktumu di Layar " + (m.s + 1) + " (" + fmtT(mine) + ") sudah sebanding dengan median kelas, jadi kemungkinan konsepnya yang perlu dipahami ulang, bukan kurang waktu.");
      return `<li><b>Soal ${a.q + 1} · ${esc(m.c)}</b><ul>${why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></li>`;
    });
    const sim = [];
    for (const [grp, o, nm] of [["bk", s.bk, "backup"], ["rs", s.rs, "restore"]]) {
      for (const [c, n] of Object.entries(o.err)) if (LA.ERR[grp][c].k === "k") sim.push(`<li>Simulasi ${nm}: ${esc(LA.ERR[grp][c].t.toLowerCase())} (${n}x).</li>`);
    }
    return `
      <div class="card">
      <h3>Analisis diagnostik: kenapa jawabanku keliru?</h3>
      ${items.length ? `<ul class="sum">${items.join("")}</ul>` : "<p>Semua soal pada percobaan terakhir sudah tepat. Tidak ada yang perlu didiagnosis.</p>"}
      ${sim.length ? `<h3 style="margin-top:14px">Kesalahan konsep pada simulasi</h3><ul class="sum">${sim.join("")}</ul>` : ""}<p class="hint">Penyebab di atas adalah dugaan dari jejak belajarmu, bukan penilaian kemampuan.</p></div>`;
  }

  /* ---------- Rapor Saya ---------- */
  function me() {
    const l = LA.cur();
    if (!l) return `
      <div class="card"><p>Belum ada siswa aktif. Progres belajarmu akan muncul di sini setelah kamu mulai belajar.</p><button class="pri" onclick="Dash.enter()">Masuk ke materi sebagai siswa</button></div>`;
    const s = LA.sum(l), recs = LA.recStudent(l), maxMs = Math.max(1, ...s.ms);
    const lastAns = s.last ? s.last.ans : [];
    return `
      <div class="card">
      <h2>Halo, ${esc(l.nama)} 👋</h2><p class="lead" style="margin:0">Ini ringkasan aktivitas belajarmu di aplikasi ini. Data tersimpan di perangkat ini dan disalin ke database kelas supaya gurumu bisa melihatnya. Kamu bisa menghapus data di perangkat ini kapan saja.</p></div>
    <div class="kpis">${kpi(l.max + 1 + "/" + LA.NS, "Layar dibuka", s.prog + "% progres")}${kpi(fmtT(s.totalMs), "Waktu belajar", s.sess + " sesi")}${kpi(s.best == null ? "–" : s.best, "Skor kuis terbaik", s.best == null ? "belum mengerjakan" : s.best >= LA.PASS ? "tuntas" : "belum tuntas (batas " + LA.PASS + ")")}${kpi(s.quiz.length, "Percobaan kuis")}${kpi(s.bk.ok + "/" + s.bk.n, "Simulasi backup", "berhasil / percobaan")}${kpi(s.rs.ok + "/" + s.rs.n, "Simulasi restore", "berhasil / percobaan")}</div>
    <div class="grid2">
      <div class="card">
      <h3>Waktu belajar tiap layar</h3>${hb(s.ms.map((m, i) => ({ l: i + 1 + ". " + LA.SCR[i], v: m, max: maxMs, txt: m ? fmtT(m) : "–" })))}<p class="hint">Waktu lama belum tentu paham, dan waktu singkat belum tentu kurang paham. Gunakan sebagai bahan refleksi.</p></div>
      <div class="card">
      <h3>Skor kuis tiap percobaan</h3>${s.quiz.length ? hb(s.quiz.map((a, i) => ({ l: "Percobaan " + (i + 1), v: a.pct, txt: a.pct, tone: tone(a.pct) }))) : '<p class="hint">Belum ada kuis yang diselesaikan.</p>'}
      ${lastAns.length ? `
      <h3 style="margin-top:14px">Hasil per soal (percobaan terakhir)</h3>
      <div class="qchips">${lastAns.slice().sort((a, b) => a.q - b.q).map((a) => `<span class="qc ${a.ok ? "ok" : "no"}" title="${esc(LA.QM[a.q].c)}">${a.ok ? "✔" : "✖"} Soal ${a.q + 1}</span>`).join("")}</div>` : ""}</div>
    </div>
    ${diagMe(l, s)}
    <div class="card">
      <h3>Rekomendasi belajar untukmu</h3>
      <ul class="rec">${recs.map((r) => `<li><span>${esc(r.t)}</span>${r.s != null ? `<button class="ghost sm" onclick="Dash.goto(${r.s})">Buka Layar ${r.s + 1}</button>` : ""}</li>`).join("")}</ul><p class="hint">Rekomendasi dibuat otomatis dari aktivitasmu. Ini saran, bukan penilaian terhadap kemampuanmu.</p></div>
    <div class="row"><button class="ghost" onclick="Dash.who()">Ganti siswa</button><button class="ghost" onclick="Dash.delMe()">Hapus data saya</button></div>`;
  }

  /* ---------- Dashboard Kelas ---------- */
  function kelas() {
    if (!unlocked) return `
      <div class="card" style="max-width:460px">
      <h2>Khusus guru</h2><p>Dashboard kelas menampilkan data seluruh siswa. Masukkan PIN untuk guru kelas.</p><label for="pin" class="lb">PIN guru</label><input id="pin" class="tx" type="password" autocomplete="off" onkeydown="if(event.key==='Enter')Dash.unlock()">
      <div class="row"><button class="pri" onclick="Dash.unlock()">Buka</button></div><p class="hint"> PIN hanya pembatas tampilan karena data tersimpan di browser, bukan pengaman data.</p></div>`;
    const list = LA.all(), c = LA.cls(list), nDemo = list.filter((l) => l.demo).length;
    const tools = `
      <div class="card toolbar">
      <div><b>${c.n}</b> siswa pada perangkat ini${nDemo ? ` (<b>${nDemo}</b> data demo)` : ""}.</div>
      <div class="row" style="margin:0">
      <button class="ghost sm" onclick="Dash.demo()">Muat data contoh</button>${nDemo ? `<button class="ghost sm" onclick="Dash.delDemo()">Hapus data demo</button>` : ""}
      <button class="ghost sm" onclick="Dash.exportData()">⬇ Unduh data (JSON)</button><button class="ghost sm" onclick="Dash.exportCsv()">⬇ Unduh tabel (CSV)</button>
      <button class="ghost sm" onclick="$('#imp').click()">⬆ Impor data (JSON)</button><input id="imp" type="file" accept=".json,application/json" hidden onchange="Dash.imp(this)"></div></div>` + (typeof Cloud !== "undefined" ? Cloud.card() : "");
    if (!c.n) return tools + `
      <div class="card">
      <h3>Belum ada data siswa</h3><p>Data akan muncul setelah siswa memakai aplikasi di perangkat ini, atau setelah kamu mengimpor file data dari perangkat lain. Untuk mencoba tampilan dashboard, muat data contoh.</p></div>`;
    const d = LA.diag(c), rc = LA.recClass(c, d);
    return tools + kpis(c) + descriptive(c) + diagnostic(c, d) + recommendation(rc) + `<p class="hint">⚠ Learning analytics adalah alat bantu keputusan, bukan pengganti penilaian profesional guru. Indikator pada siswa hanyalah petunjuk awal, hindari memberi label kepada siswa berdasarkan angka saja.</p>`;
  }
  function kpis(c) {
    return `
      <div class="kpis">${kpi(c.n, "Students")}${kpi(c.nd, "Completed (kuis selesai)", c.n ? pc(c.nd / c.n * 100) : "")}${kpi(c.avgBest == null ? "–" : r0(c.avgBest), "Average Score", "skor terbaik; percobaan pertama: " + (c.avgFirst == null ? "–" : r0(c.avgFirst)))}${kpi(c.notSub, "Not Submitted", "belum menyelesaikan kuis")}${kpi(c.hardest ? "Soal " + (c.hardest.q + 1) : "–", "Most Difficult Question", c.hardest ? c.hardest.pct + "% benar" : "")}</div>`;
  }
  function narr(c) {
    const p = [`Terdapat <b>${c.n}</b> siswa; <b>${c.nd}</b> (${Math.round(c.nd / c.n * 100)}%) sudah menyelesaikan kuis dan <b>${c.notSub}</b> belum.`];
    if (c.nd) p.push(`Rata-rata skor percobaan pertama <b>${r0(c.avgFirst)}</b> dan skor terbaik <b>${r0(c.avgBest)}</b>. Sebanyak <b>${c.tuntas}</b> siswa tuntas (skor ≥ ${LA.PASS}).`);
    if (c.hardest) p.push(`Soal paling banyak salah: <b>Soal ${c.hardest.q + 1}</b> (${esc(LA.QM[c.hardest.q].c)}) dengan ${c.hardest.pct}% benar.`);
    let big = null;
    for (let i = 1; i < LA.NS; i++) {
      const dr = c.reach[i - 1] - c.reach[i];
      if (!big || dr > big.dr) big = { i, dr };
    }
    if (big && big.dr > 0) p.push(`Penurunan jumlah siswa terbesar terjadi dari Layar ${big.i} ke Layar ${big.i + 1} (−${big.dr} poin persen).`);
    return p.join(" ");
  }
  function descriptive(c) {
    const maxT = Math.max(1, ...c.avgMs.map((v) => v || 0));
    const qRows = c.items.map((i) => ({ l: "Soal " + (i.q + 1) + " · " + esc(LA.QM[i.q].c), v: i.pct, txt: pc(i.pct), tone: tone(i.pct) }));
    const binL = ["< 50", "50–74", "75–89", "90–100"], binT = ["bad", "amb", "ok", "ok"];
    const tp = c.nd ? Math.round(c.tuntas / c.nd * 100) : 0;
    const bkR = c.bk.users ? (c.bk.n / c.bk.users).toFixed(1) : "–", rsR = c.rs.users ? (c.rs.n / c.rs.users).toFixed(1) : "–";
    const rows = c.R.filter((r) => !onlyFlag || r.flags.length).sort((a, b) => a.l.nama.localeCompare(b.l.nama, "id"));
    return `<section>
      <h2 class="sh"><span class="bdg">Descriptive Analytics</span> Apa yang terjadi?</h2>
    <div class="card"><p style="margin:0">${narr(c)}</p></div>
    <div class="grid2">
      <div class="card">
      <h3>Progres: siswa yang mencapai tiap layar</h3>${hb(c.reach.map((v, i) => ({ l: i + 1 + ". " + LA.SCR[i], v, txt: v + "%" })))}</div>
      <div class="card">
      <h3>Rata-rata waktu per layar</h3>${hb(c.avgMs.map((v, i) => ({ l: i + 1 + ". " + LA.SCR[i], v: v || 0, max: maxT, txt: v ? fmtT(v) : "–" })))}</div>
      <div class="card">
      <h3>Persentase benar per soal</h3>${hb(qRows)}<p class="hint">Berdasarkan percobaan pertama tiap siswa (n = ${c.nd}). Merah &lt; 60, kuning 60–74, hijau ≥ 75.</p></div>
      <div class="card">
      <h3>Sebaran skor terbaik</h3>
      <div class="dgrid">${donut(tp, "tuntas")}
      <div style="flex:1">${hb(c.bins.map((v, i) => ({ l: binL[i], v, max: Math.max(1, c.nd), txt: v + " siswa", tone: binT[i] })))}</div></div></div>
      <div class="card">
      <h3>Perubahan rata-rata skor antar percobaan</h3>${lineChart(c.trend.map((t) => ({ l: "Percobaan " + t.k, n: t.n, v: t.v })))}</div>
      <div class="card">
      <h3>Aktivitas media dan simulasi</h3>
      <table class="t sm"><tbody>
        <tr><td>Video pengantar ditonton sampai selesai</td><td><b>${pc(c.media.vid)}</b> siswa</td></tr>
        <tr><td>Rata-rata media penyimpanan dibuka</td><td><b>${c.media.hot.toFixed(1)}</b> dari 4</td></tr>
        <tr><td>Ketiga animasi jenis backup ditonton</td><td><b>${pc(c.media.anim)}</b> siswa</td></tr>
        <tr><td>Simulasi backup berhasil</td><td><b>${c.bk.ok}</b> dari ${c.bk.n} percobaan (rata-rata ${bkR}/siswa)</td></tr>
        <tr><td>Simulasi restore berhasil</td><td><b>${c.rs.ok}</b> dari ${c.rs.n} percobaan (rata-rata ${rsR}/siswa)</td></tr>
        <tr><td>Rata-rata total waktu belajar</td><td><b>${fmtT(c.avgTime)}</b></td></tr></tbody></table></div>
    </div>
    <div class="card">
      <div class="toolbar" style="margin-bottom:8px">
      <h3 style="margin:0">Data individual siswa</h3><label class="o" style="padding:0"><input type="checkbox" ${onlyFlag ? "checked" : ""} onchange="Dash.flagOnly(this.checked)"> Hanya yang perlu perhatian</label></div>
      <div class="wrap">
      <table class="t stu"><thead><tr><th>Nama</th><th>Kelas</th><th>Progres</th><th>Waktu</th><th>Skor terbaik</th><th>Kuis</th><th>Simulasi B / R</th><th>Status</th><th>Perlu perhatian</th><th></th></tr></thead><tbody>
      ${rows.map((r) => {
      const s = r.s;
      return `<tr><td><b>${esc(r.l.nama)}</b>${r.l.demo ? ' <span class="tag">demo</span>' : ""}</td><td>${esc(r.l.kelas) || "–"}</td><td><span class="mb"><i style="width:${s.prog}%"></i></span> ${s.prog}%</td><td>${fmtT(s.totalMs)}</td><td>${s.best == null ? "–" : s.best}</td><td>${s.quiz.length}x</td><td>${s.bk.ok}/${s.bk.n} · ${s.rs.ok}/${s.rs.n}</td><td>${s.quiz.length ? s.best >= LA.PASS ? "Tuntas" : "Belum tuntas" : s.totalMs < 5e3 && !r.l.max ? "Belum mulai" : "Sedang belajar"}</td><td>${r.flags.length ? r.flags.map((f) => `<span class="chip">${esc(f)}</span>`).join(" ") : '<span class="hint">–</span>'}</td><td><button class="ghost sm" onclick="Dash.delOne('${r.l.id}')" aria-label="Hapus data ${esc(r.l.nama)}" title="Hapus data siswa ini">✕</button></td></tr>`;
    }).join("") || '<tr><td colspan="10" class="hint">Tidak ada siswa yang cocok.</td></tr>'}
      </tbody></table></div><p class="hint">Progres = layar tertinggi yang dibuka. Progres 100% belum berarti paham 100%.</p></div></section>`;
  }
  function diagnostic(c, d) {
    const head = `<section>
      <h2 class="sh"><span class="bdg">Diagnostic Analytics</span> Mengapa hal itu terjadi?</h2>`;
    if (!d.enough) return head + `
      <div class="card"><p>Analisis diagnostik membutuhkan minimal <b>3 siswa</b> yang telah menyelesaikan kuis (saat ini: ${c.nd}).</p></div></section>`;
    const sevL = { high: "Prioritas tinggi", mid: "Perlu dicermati", info: "Informasi" };
    const errRows = [];
    for (const g of ["bk", "rs"]) for (const [code, n] of Object.entries(c[g].err)) errRows.push({ g, code, n, e: LA.ERR[g][code] });
    errRows.sort((a, b) => b.n - a.n);
    const mx = Math.max(1, ...errRows.map((e) => e.n));
    return head + `<p class="hint">Temuan di bawah ini berisi <b>kemungkinan</b> penyebab. Konfirmasi dengan konteks yang hanya diketahui guru sebelum mengambil keputusan.</p>
    ${d.F.map((f) => `<article class="fd ${f.sev}">
      <div class="fh"><span class="sv">${sevL[f.sev]}</span>
      <h3>${esc(f.t)}</h3></div>
      <ul>${f.ev.map((e) => `<li>${esc(e)}</li>`).join("")}</ul><p class="lb2">Kemungkinan penyebab</p>
      <ul>${f.causes.map((e) => `<li>${esc(e)}</li>`).join("")}</ul><p class="act"><b>Yang perlu dicek / dilakukan:</b> ${esc(f.act)}</p></article>`).join("") || '<div class="card"><p>Tidak ada temuan yang menonjol pada data saat ini.</p></div>'}
    ${errRows.length ? `
      <div class="card">
      <h3>Rincian kesalahan pada simulasi</h3>${hb(errRows.slice(0, 8).map((e) => ({ l: (e.g === "bk" ? "Backup" : "Restore") + " · " + esc(e.e.t), v: e.n, max: mx, txt: e.n + "x", tone: e.e.k === "k" ? "bad" : "amb" })))}<p class="hint">Merah = kesalahan konsep, kuning = formulir belum lengkap (prosedur).</p></div>` : ""}</section>`;
  }
  function recommendation(rc) {
    return `<section>
      <h2 class="sh"><span class="bdg">Recommendation</span> Apa yang sebaiknya dilakukan?</h2>
    <div class="card">${rc.length ? `
      <ol class="rec2">${rc.map((r) => `<li><span class="pr ${r.pri}">${r.pri}</span>
      <div><b>${esc(r.t)}</b><br>${esc(r.a)}${r.s != null ? ` <button class="ghost sm" onclick="Dash.goto(${r.s})">Lihat Layar ${r.s + 1}</button>` : ""}</div></li>`).join("")}</ol>` : "<p>Belum ada rekomendasi khusus. Data belum cukup atau semua indikator dalam kondisi baik.</p>"}<p class="hint" style="margin-bottom:0">Rekomendasi dihasilkan dari aturan sederhana pada data kelas. Keputusan akhir tetap berada pada guru.</p></div></section>`;
  }

  /* ---------- Data & Privasi ---------- */
  function info() {
    const rows = [
      ["Waktu belajar per layar", "Dicatat otomatis saat siswa berpindah layar (jeda otomatis saat tab disembunyikan)", "Waktu per layar, total waktu", "Seberapa lama siswa terlibat pada tiap materi?", "TP 1–2"],
      ["Progres layar", "Layar tertinggi yang pernah dibuka", "% siswa yang mencapai tiap layar", "Di layar mana siswa berhenti?", "Semua"],
      ["Interaksi media", "Video diputar/selesai, media penyimpanan dibuka, animasi tiga jenis backup", "% menonton video, rata-rata media dibuka, % animasi tuntas", "Apakah siswa mengeksplorasi materi?", "TP 1–2"],
      ["Percobaan dan kesalahan simulasi backup", 'Setiap klik "Mulai Backup" beserta kode kesalahannya', "Rata-rata percobaan, jenis kesalahan terbanyak", "Miskonsepsi apa pada prosedur backup?", "TP 3"],
      ["Percobaan dan kesalahan simulasi restore", 'Setiap klik "Mulai Restore" beserta kode kesalahannya', "Rata-rata percobaan, jenis kesalahan terbanyak", "Miskonsepsi apa pada prosedur restore?", "TP 4"],
      ["Jawaban per soal kuis", "Pilihan jawaban, benar/salah, dan waktu menjawab tiap soal", "% benar per soal, jawaban salah terbanyak", "Konsep/soal mana yang sulit?", "TP 5"],
      ["Skor dan percobaan kuis", "Skor tiap percobaan kuis", "Skor terbaik, perubahan skor antar percobaan", "Apakah mengulang materi membantu?", "TP 5"],
      ["Frekuensi sesi", "Setiap kali aplikasi dibuka oleh siswa", "Jumlah sesi", "Seberapa sering siswa kembali belajar?", "Semua"]
    ];
    const l = LA.cur();
    return `
      <div class="card">
      <h2>Data pembelajaran yang dicatat (${rows.length} jenis)</h2><p class="lead">Hanya data yang berhubungan langsung dengan tujuan pembelajaran yang dicatat. Aplikasi tidak menghitung jumlah klik semata karena angka seperti itu mudah menyesatkan (vanity metric).</p>
    <div class="wrap">
      <table class="t"><thead><tr><th>Data</th><th>Cara pencatatan</th><th>Metrik</th><th>Pertanyaan yang dijawab</th><th>Terkait</th></tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
    <div class="grid2">
      <div class="card">
      <h3>Transparansi dan privasi</h3>
      <ul class="sum"><li>Data yang dicatat hanya: nama/inisial, kelas, dan aktivitas belajar di atas.</li><li>Tidak mencatat email, lokasi, identitas perangkat, atau isi lain yang diketik siswa.</li><li>Data disimpan di browser perangkat ini dan <b>disalin ke database kelas (Firebase Firestore)</b> agar guru dapat melihat perkembangan seluruh siswa. Hanya guru yang dapat membacanya.</li><li>Siswa bisa melihat (Rapor Saya), menghapus, dan guru dapat mengunduh atau mengimpor data dalam bentuk file.</li><li>Gunakan inisial atau nama panggilan bila diperlukan.</li></ul></div>
    <div class="card">
      <h3>Cara menafsirkan dengan bertanggung jawab</h3>
      <ul class="sum"><li>Data adalah indikasi, bukan kepastian. Angka perlu dibaca bersama konteks.</li><li>Jangan memberi label siswa (misalnya "lemah") hanya dari dashboard.</li><li>Waktu belajar singkat bisa berarti sudah paham, bukan malas.</li><li>Dashboard membantu guru mengambil keputusan, bukan menggantikan penilaian guru.</li></ul></div></div>
    ${l ? `
      <div class="card">
      <h3>Hak data saya</h3><p>Siswa aktif: <b>${esc(l.nama)}</b> · ${l.ev.length} catatan aktivitas tersimpan.</p>
      <div class="row"><button class="ghost" onclick="Dash.delMe()">Hapus data saya</button><button class="ghost" onclick="Dash.delAll()">Hapus SEMUA data di perangkat ini</button></div></div>` : ""}`;
  }

  /* ---------- Identitas siswa ---------- */
  function who(first) {
    switching = !first;
    const ex = LA.all().filter((l) => !l.demo).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
    const ov = $("#ov");
    ov.hidden = false;
    ov.innerHTML = `
      <div class="md" role="dialog" aria-modal="true" aria-labelledby="mdt">
      <h2 id="mdt">${first ? "Sebelum mulai belajar" : "Ganti siswa"}</h2>
      <p>Aplikasi ini mencatat aktivitas belajarmu (layar yang dibuka, waktu, hasil simulasi, dan kuis) untuk membantu kamu dan gurumu melihat perkembangan belajar. Data disimpan di browser perangkat ini dan disalin ke database kelas yang hanya bisa dibaca gurumu. Kamu bisa melihat, mengunduh, atau menghapusnya lewat tombol 📊.</p>
      <label class="lb" for="nm">Nama atau inisial (wajib diisi)</label><input id="nm" class="tx" maxlength="40" autocomplete="off" aria-required="true" placeholder="mis. Dina P." onkeydown="if(event.key==='Enter')Dash.begin()">
      <label class="lb" for="kl">Kelas (wajib diisi)</label><input id="kl" class="tx" maxlength="30" autocomplete="off" aria-required="true" placeholder="mis. X TKJ 1" onkeydown="if(event.key==='Enter')Dash.begin()"><div id="er" aria-live="assertive"></div>
      <div class="row"><button class="pri" onclick="Dash.begin()">Mulai belajar</button>${first ? "" : '<button class="ghost" onclick="Dash.cancelWho()">Batal</button>'}</div>
      ${ex.length ? `<p class="hint" style="margin-bottom:4px">Atau lanjutkan sebagai:</p>
      <div class="row" style="margin-top:0">${ex.map((l) => `<button class="ghost sm" onclick="Dash.useL('${l.id}')">${esc(l.nama)}</button>`).join("")}</div>` : ""}</div>`;
    setTimeout(() => {
      const n = $("#nm");
      n && n.focus();
    }, 30);
  }
  function chip() {
    const l = LA.cur(), w = $("#who");
    if (w) w.textContent = l ? "👤 " + l.nama : "";
  }
  function afterWho() {
    if (switching) {
      location.reload();
      return;
    }
    $("#ov").hidden = true;
    $("#ov").innerHTML = "";
    chip();
    LA.screen(state.cur);
    if (document.body.classList.contains("dashmode")) {
      document.body.classList.remove("dashmode");
      render();
    }
  }

  /* ---------- API publik ---------- */
  const dl = (name, text, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };
  const stamp = () => (new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const csvSafe = (v) => {
    v = String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  };
  return {
    init() {
      const l = LA.cur();
      if (l) {
        LA.use(l.id);
        chip();
        LA.screen(state.cur);
      }
      // Dashboard menjadi halaman pertama yang tampil
      this.open("me");
    },
    // Tombol "Masuk ke Materi": minta nama dulu jika belum ada siswa aktif
    enter() {
      if (!LA.cur()) {
        who(true);
        return;
      }
      this.close();
    },
    open(t) {
      LA.pause();
      hentikanTimer();
      document.body.classList.add("dashmode");
      if (t) tab = t;
      draw();
      window.scrollTo(0, 0);
    },
    close() {
      document.body.classList.remove("dashmode");
      render();
      LA.resume();
    },
    goto(n) {
      pindahLayar(n);
    },
    tab(k) {
      tab = k;
      draw();
    },
    who,
    chip,
    begin() {
      const nmEl = $("#nm"), klEl = $("#kl"), nm = nmEl.value.trim(), kl = klEl.value.trim(), er = $("#er");
      // Nama dan kelas wajib diisi agar tidak terbentuk profil anonim
      const bad = !nm || nm.length < 2 ? [nmEl, "Nama atau inisial wajib diisi (minimal 2 karakter)."] : !kl ? [klEl, "Kelas wajib diisi, misalnya X TKJ 1."] : null;
      if (bad) {
        er.innerHTML = `<div class="fb no" role="alert">${bad[1]}</div>`;
        bad[0].focus();
        return;
      }
      LA.start(nm, kl);
      afterWho();
    },
    useL(id) {
      LA.use(id);
      afterWho();
    },
    cancelWho() {
      $("#ov").hidden = true;
      $("#ov").innerHTML = "";
    },
    unlock() {
      const p = $("#pin");
      if (p && p.value === LA.PIN) {
        unlocked = true;
        draw();
      } else {
        setNote("no", "PIN salah. Coba lagi.");
        draw();
      }
    },
    flagOnly(v) {
      onlyFlag = v;
      draw();
    },
    demo() {
      Demo.load();
      setNote("ok", 'Data contoh 24 siswa dimuat. Data ini sintetis dan ditandai "demo".');
      draw();
    },
    delDemo() {
      Demo.clear();
      setNote("ok", "Data demo dihapus.");
      draw();
    },
    delMe() {
      const l = LA.cur();
      if (!l) return;
      if (confirm('Hapus semua data belajar milik "' + l.nama + '" di perangkat ini? Tindakan ini tidak dapat dibatalkan.')) {
        LA.remove(l.id);
        location.reload();
      }
    },
    delOne(id) {
      const l = LA.get(id);
      if (!l) return;
      if (confirm('Hapus data "' + l.nama + '" dari perangkat ini?')) {
        const self = LA.cur() && LA.cur().id === id;
        LA.remove(id);
        if (self) location.reload();
        else {
          setNote("ok", "Data siswa dihapus.");
          draw();
        }
      }
    },
    delAll() {
      if (confirm("Hapus SEMUA data pembelajaran (semua siswa) di perangkat ini? Tindakan ini tidak dapat dibatalkan.")) {
        LA.clearAll();
        location.reload();
      }
    },
    exportData() {
      LA.saveNow();
      dl("data-belajar-" + stamp() + ".json", LA.exportJSON(), "application/json");
      setNote("ok", "Data diunduh sebagai file JSON. Simpan sebagai cadangan atau gabungkan di perangkat guru lewat Impor.");
      draw();
    },
    exportCsv() {
      const h = ["nama", "kelas", "progres_persen", "waktu_detik", "skor_terbaik", "percobaan_kuis", "backup_sukses", "backup_percobaan", "restore_sukses", "restore_percobaan", "sesi", "status"];
      const c = LA.cls(LA.all()), rows = c.R.map((r) => {
        const s = r.s;
        return [r.l.nama, r.l.kelas, s.prog, Math.round(s.totalMs / 1e3), s.best == null ? "" : s.best, s.quiz.length, s.bk.ok, s.bk.n, s.rs.ok, s.rs.n, s.sess, s.quiz.length ? s.best >= LA.PASS ? "Tuntas" : "Belum tuntas" : "Belum kuis"].map(csvSafe).join(",");
      });
      dl("tabel-siswa-" + stamp() + ".csv", "\uFEFF" + h.join(",") + "\n" + rows.join("\n"), "text/csv");
      setNote("ok", "Tabel siswa diunduh sebagai CSV (dapat dibuka di Excel).");
      draw();
    },
    imp(inp) {
      const f = inp.files && inp.files[0];
      if (!f) return;
      if (f.size > 8e6) {
        setNote("no", "File terlalu besar (maks. 8 MB).");
        draw();
        return;
      }
      const fr = new FileReader();
      fr.onload = () => {
        const r = LA.importJSON(String(fr.result));
        if (r.err) setNote("no", r.err);
        else setNote("ok", "Impor selesai: " + r.add + " siswa baru, " + r.upd + " diperbarui, " + r.skip + " dilewati.");
        draw();
      };
      fr.onerror = () => {
        setNote("no", "File tidak dapat dibaca.");
        draw();
      };
      fr.readAsText(f);
    }
  };
})();
Dash.init();
