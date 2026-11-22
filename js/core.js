// Inti aplikasi: state, navigasi antar layar, dan fungsi bantu.
// Dimuat setelah analytics.js dan sebelum berkas layar.

const $ = (s) => document.querySelector(s);
// Kondisi awal kuis (dipakai saat mulai dan saat Ulangi Kuis).
const kuisBaru = () => ({ i: 0, score: 0, sent: false, pick: null, done: false, hist: [], att: 0, t0: 0, logged: false });
const state = { cur: 0, max: 0, vid: false, vs: -1, hs: new Set(), tab: "full", watch: new Set(), st: { full: 0, incr: 0, diff: 0 }, q: kuisBaru(), bk: false, rs: false };
let timerAktif = null;
const hentikanTimer = () => {
  clearInterval(timerAktif);
  timerAktif = null;
};
// Pindah ke layar ke-n (0-6), catat ke Learning Analytics, lalu gambar ulang.
function pindahLayar(n) {
  hentikanTimer();
  state.cur = n;
  state.max = Math.max(state.max, n);
  LA.screen(n);
  render();
}
// Menggambar ulang menu nomor, lalu memanggil fungsi layar yang aktif.
function render() {
  document.body.classList.remove("dashmode");
  $("#dots").innerHTML = [1, 2, 3, 4, 5, 6, 7].map((n, i) => `<button class="${i == state.cur ? "on" : i <= state.max ? "seen" : ""}" ${i > state.max ? "disabled" : ""} onclick="pindahLayar(${i})" aria-label="Layar ${n}">${n}</button>`).join("");
  [tampilkanPembuka, tampilkanTujuan, tampilkanKonsep, tampilkanJenisBackup, tampilkanSimulasiBackup, tampilkanSimulasiRestore, tampilkanEvaluasi][state.cur]();
  window.scrollTo(0, 0);
}
const tombolNavigasi = (next, ok = true, extra = "") => `<div class="nav">${state.cur > 0 ? `<button class="ghost" onclick="pindahLayar(state.cur-1)">Kembali</button>` : "<span></span>"}${extra}${next ? `<button class="pri" ${ok ? "" : "disabled"} onclick="pindahLayar(state.cur+1)">${next}</button>` : ""}</div>`;
const setKonten = (h) => $("#v").innerHTML = h;
