// Data animasi: file contoh, hari, file yang berubah, dan file yang disalin tiap jenis backup.
const DAFTAR_FILE = ["Laporan.docx", "Foto.jpg", "Tugas.xlsx", "Musik.mp3", "Video.mp4", "Catatan.txt"], HARI = ["Senin", "Selasa", "Rabu"], FILE_BERUBAH = [[0, 1, 2, 3, 4, 5], [0, 2], [3]];
const FILE_DISALIN = { full: [[0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5]], incr: [[0, 1, 2, 3, 4, 5], [0, 2], [3]], diff: [[0, 1, 2, 3, 4, 5], [0, 2], [0, 2, 3]] };
const NAMA_JENIS = { full: "Full backup", incr: "Incremental backup", diff: "Differential backup" };
const KETERANGAN = { full: ["Tekan Putar. Full menyalin SEMUA file setiap sesi.", "Senin: semua 6 file disalin.", "Selasa: Laporan dan Tugas berubah, tetapi full tetap menyalin semua 6 file lagi.", "Rabu: lagi-lagi semua file disalin. Restore mudah (cukup 1 set), tetapi paling lama dan boros ruang."], incr: ["Tekan Putar. Incremental hanya menyalin yang berubah sejak backup TERAKHIR (jenis apa pun).", "Senin: backup pertama, semua file disalin.", "Selasa: hanya Laporan dan Tugas (yang berubah sejak Senin) yang disalin.", "Rabu: hanya Musik (berubah sejak Selasa). Hemat dan cepat, tetapi restore butuh set Senin + Selasa + Rabu, berurutan."], diff: ["Tekan Putar. Differential menyalin semua perubahan sejak backup FULL terakhir.", "Senin: backup full pertama, semua file disalin.", "Selasa: Laporan dan Tugas disalin (berubah sejak full Senin).", "Rabu: Laporan, Tugas, DAN Musik disalin, karena semuanya berubah sejak full Senin. Restore cukup butuh full + differential terakhir."] };
// Layar 4 - Animasi perbandingan full, incremental, dan differential.
function tampilkanJenisBackup() {
  const t = state.tab, st = state.st[t], all = ["full", "incr", "diff"].every((x) => state.watch.has(x));
  let rows = DAFTAR_FILE.map((f, r) => `<tr><td class="f">${f}</td>${[0, 1, 2].map((d) => {
    const cp = FILE_DISALIN[t][d].includes(r), chg = d > 0 && FILE_BERUBAH[d].includes(r) || d == 0;
    let c = "c" + (chg ? " ch" : ""), x = chg && d > 0 ? "berubah" : "";
    if (d < st && cp) {
      c = "c cp";
      x = "disalin";
    }
    if (d == st - 1 && cp) c = "c now";
    if (d == st - 1 && cp) x = "disalin";
    return `<td class="${c}">${x}</td>`;
  }).join("")}</tr>`).join("");
  setKonten(`
      <div class="card">
      <h2>Tiga jenis backup, tahap demi tahap</h2>
      <div class="tabs" role="tablist">${Object.keys(NAMA_JENIS).map((k) => `<button role="tab" class="${k == t ? "on" : ""}" onclick="state.tab='${k}';hentikanTimer();tampilkanJenisBackup()">${NAMA_JENIS[k]}${state.watch.has(k) ? ' <span class="ck">✔</span>' : ""}</button>`).join("")}</div>
 <div class="wrap">
      <table class="g"><tr><th></th>${HARI.map((d) => `<th>${d}</th>`).join("")}</tr>${rows}</table></div>
 <div class="legend"><span>▢ garis merah = file berubah</span><span>■ biru = disalin ke backup</span><span>■ kuning = sedang disalin</span></div>
 <div class="cap2" aria-live="polite">${KETERANGAN[t][st]}</div>
 <div class="row"><button class="pri" onclick="putarAnimasi()">Putar</button><button class="ghost" onclick="hentikanTimer()">Jeda</button><button class="ghost" onclick="hentikanTimer();state.st[state.tab]=0;tampilkanJenisBackup()">Ulangi</button></div></div>
 ${tombolNavigasi(all ? "Lanjut ke Simulasi" : "Lanjut ke Simulasi", all)}${all ? "" : `<p class="hint">Tonton ketiga animasi sampai selesai untuk membuka simulasi (${state.watch.size}/3).</p>`}`);
}
// Memajukan animasi satu langkah tiap 2,6 detik.
function putarAnimasi() {
  hentikanTimer();
  const t = state.tab;
  LA.log("anim", { k: t, a: "play" });
  if (state.st[t] >= 3) state.st[t] = 0;
  timerAktif = setInterval(() => {
    if (state.tab != t) {
      hentikanTimer();
      return;
    }
    state.st[t]++;
    if (state.st[t] >= 3) {
      hentikanTimer();
      state.watch.add(t);
      LA.log("anim", { k: t, a: "done" });
    }
    tampilkanJenisBackup();
  }, 2600);
  state.st[t]++;
  if (state.st[t] >= 3) {
    hentikanTimer();
    state.watch.add(t);
    LA.log("anim", { k: t, a: "done" });
  }
  tampilkanJenisBackup();
}
