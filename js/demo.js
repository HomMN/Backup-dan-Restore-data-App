/* =====================================================================
   demo.js — Data contoh (sintetis) untuk demonstrasi dashboard.
   Semua data ditandai demo:true dan dapat dihapus kapan saja.
   File ini boleh dihapus tanpa memengaruhi fitur lain.
   ===================================================================== */
const Demo = (() => {
  function rng(seed) {
    return () => {
      seed |= 0;
      seed = seed + 1831565813 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const NAMES = ["Adi P.", "Bella S.", "Citra A.", "Dimas R.", "Eka W.", "Farhan H.", "Gita N.", "Hana L.", "Indra K.", "Jihan M.", "Kevin T.", "Lina D.", "Maya F.", "Naufal B.", "Olivia C.", "Putra Y.", "Qori Z.", "Rizky A.", "Salsa V.", "Tegar E.", "Umar G.", "Vina J.", "Wahyu Q.", "Yusuf O."];
  const BASE = [12e3, 2e4, 7e4, 85e3, 8e4, 75e3];
  // tingkat kesulitan dasar tiap soal
  const QB = [0.8, 0.4, 0.86, 0.62, 0.38, 0.55];
  // pilihan salah yang paling "menggoda"
  const ATTR = [3, 0, 0, 0, 0, 0];
  // soal yang bergantung pada Layar 4
  const L4Q = [0, 1, 5];
  const BKE = [["nofolder", 8], ["nodst", 6], ["notype", 6], ["game", 22], ["one", 18], ["notfull", 40]];
  const RSE = [["nover", 6], ["noloc", 6], ["old", 26], ["after", 16], ["asli", 32], ["usb", 14]];
  function build() {
    const r = rng(2026), now = Date.now();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
    const wpick = (tbl) => {
      const tot = tbl.reduce((a, b) => a + b[1], 0);
      let x = r() * tot;
      for (const [k, w] of tbl) {
        if ((x -= w) <= 0) return k;
      }
      return tbl[0][0];
    };
    // siswa yang tidak mulai / berhenti di layar tertentu
    const NOSTART = [5, 17], STOP = { 3: 2, 11: 4, 20: 5 };
    const out = [];
    NAMES.forEach((nama, i) => {
      const a = clamp(0.62 + 0.22 * gauss(), 0.2, 0.95);
      const dl = clamp(0.55 + 0.8 * a + 0.25 * gauss(), 0.35, 1.6);
      let t = now - Math.floor(r() * 6) * 864e5 - Math.floor(r() * 5 * 36e5) - 36e5;
      const ev = [];
      let max = 0;
      const add = (e, d, adv) => {
        ev.push(Object.assign({ e, t }, d));
        t += adv == null ? 1500 + r() * 2500 : adv;
      };
      const scr = (n, ms, c) => {
        max = Math.max(max, n);
        ev.push(Object.assign({ e: "scr", t, n, ms: Math.round(ms) }, c ? { c: 1 } : {}));
        t += ms + 800;
      };
      const stopAt = NOSTART.includes(i) ? 0 : STOP[i] != null ? STOP[i] : 6;
      add("sess", {});
      scr(0, BASE[0] * dl * (0.5 + r()) * (NOSTART.includes(i) ? 0.2 : 1));
      if (stopAt < 1) {
        out.push(fin());
        return;
      }
      scr(1, BASE[1] * dl * (0.5 + r()));
      if (stopAt < 2) {
        out.push(fin());
        return;
      }
      // Layar 3: video + media
      add("vid", { a: "play" });
      add("vid", { a: "done" }, 14e3);
      if (r() < 0.2) {
        add("vid", { a: "play" });
        add("vid", { a: "done" }, 14e3);
      }
      const hk = ["hdd", "fd", "nas", "cl"];
      hk.sort(() => r() - 0.5);
      hk.forEach((k) => add("hot", { k }));
      scr(2, Math.max(26e3, BASE[2] * dl * (0.6 + 0.8 * r())));
      if (stopAt < 3) {
        out.push(fin());
        return;
      }
      // Layar 4: animasi jenis backup
      ["full", "incr", "diff"].forEach((k) => {
        add("anim", { k, a: "play" });
        add("anim", { k, a: "done" }, 7800);
        if (r() < 0.25) {
          add("anim", { k, a: "play" });
          add("anim", { k, a: "done" }, 7800);
        }
      });
      const l4 = Math.max(28e3, BASE[3] * dl * (0.55 + 0.9 * r()));
      scr(3, l4);
      if (stopAt < 4) {
        out.push(fin());
        return;
      }
      // Layar 5: simulasi backup
      let ne = Math.floor(clamp((0.6 - a) * 5 + r() * 2.2, 0, 4));
      for (let k = 0; k < ne; k++) add("bk", { ok: 0, err: wpick(BKE) }, 6e3);
      add("bk", { ok: 1 }, 5e3);
      scr(4, BASE[4] * dl * (0.6 + 0.8 * r()) + ne * 6e3);
      if (stopAt < 5) {
        out.push(fin());
        return;
      }
      // Layar 6: simulasi restore
      ne = Math.floor(clamp((0.6 - a) * 5 + r() * 2.4, 0, 4));
      for (let k = 0; k < ne; k++) add("rs", { ok: 0, err: wpick(RSE) }, 6e3);
      add("rs", { ok: 1 }, 5e3);
      scr(5, BASE[5] * dl * (0.6 + 0.8 * r()) + ne * 6e3);
      // Layar 7: kuis (maks. 3 percobaan)
      let aEff = a, tq = 0;
      const ratio = clamp(l4 / 85e3, 0.3, 1.5);
      for (let att = 1; att <= 3; att++) {
        let sc = 0, spent = 0;
        for (let q = 0; q < 6; q++) {
          let p = QB[q] + 0.55 * (aEff - 0.6) + (L4Q.includes(q) ? 0.3 * (ratio - 1) : 0);
          p = clamp(p, 0.05, 0.97);
          const ok = r() < p, correct = BANK_SOAL[q].kunci;
          let pick = correct;
          if (!ok) {
            const o = [0, 1, 2, 3].filter((x) => x !== correct);
            pick = ATTR[q] !== correct && r() < 0.6 ? ATTR[q] : o[Math.floor(r() * o.length)];
            if (pick === correct) pick = o[0];
          }
          const ms = Math.round((15e3 + r() * 25e3) * dl * (q === 5 ? 1.6 : 1));
          add("qa", { att, q, pick, ok: ok ? 1 : 0, ms }, ms + 600);
          sc += ok ? 1 : 0;
          spent += ms;
        }
        add("qd", { att, sc, tot: 6 }, 800);
        tq += spent;
        if (Math.round(sc / 6 * 100) >= 75 || att === 3 || r() > 0.65) break;
        aEff = clamp(aEff + 0.12, 0, 0.98);
        // mengulang materi sebelum kuis lagi
        scr(3, 2e4 + r() * 3e4);
        scr(6, 3e3);
      }
      scr(6, tq + 8e3);
      out.push(fin());
      function fin() {
        return { id: "demo-" + String(i + 1).padStart(2, "0"), nama, kelas: i % 2 ? "X TKJ 2" : "X TKJ 1", demo: true, t0: ev[0].t, max, ev };
      }
    });
    return out;
  }
  return {
    load() {
      LA.putMany(build());
    },
    clear() {
      LA.clearDemo();
    }
  };
})();
