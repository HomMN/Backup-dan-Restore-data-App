// Layar 5 - Simulasi memilih folder, media tujuan, dan jenis backup.
function tampilkanSimulasiBackup() {
  setKonten(`
      <div class="card">
      <h2>Simulasi: lakukan backup</h2>
      <div class="scn"><b>Skenario:</b> Ini pertama kalinya kamu backup. Cadangkan folder <b>Tugas Sekolah</b> dan <b>Foto Kelas</b> ke media tujuan yang kamu pilih. Folder Game tidak perlu.</div>
 <fieldset><legend>1. Pilih folder</legend>${["Tugas Sekolah", "Foto Kelas", "Game"].map((f) => `<label class="o"><input type="checkbox" name="fo" value="${f}">${f}</label>`).join("")}</fieldset>
 <fieldset><legend>2. Media tujuan</legend>${[["cl", "Cloud (Google Drive)"], ["hdd", "Hard disk eksternal"]].map((m) => `<label class="o"><input type="radio" name="dst" value="${m[0]}">${m[1]}</label>`).join("")}</fieldset>
 <fieldset><legend>3. Jenis backup</legend>${[["full", "Full"], ["incr", "Incremental"], ["diff", "Differential"]].map((m) => `<label class="o"><input type="radio" name="typ" value="${m[0]}">${m[1]}</label>`).join("")}</fieldset>
 <button class="pri" onclick="jalankanBackup()">Mulai Backup</button>
      <div id="fb" aria-live="polite"></div></div>
 ${tombolNavigasi("Lanjut ke Simulasi Restore", state.bk)}`);
}
// Memeriksa pilihan siswa dan mencatat jenis kesalahannya ke Learning Analytics.
function jalankanBackup() {
  const fo = [...document.querySelectorAll("[name=fo]:checked")].map((x) => x.value), d = document.querySelector("[name=dst]:checked"), t = document.querySelector("[name=typ]:checked"), fb = $("#fb");
  const bad = (c, m) => {
    LA.log("bk", { ok: 0, err: c });
    fb.innerHTML = `
      <div class="fb no">${m}</div><button class="ghost" onclick="tampilkanSimulasiBackup()">Coba Lagi</button>`;
  };
  if (!fo.length) return bad("nofolder", "Pilih dulu minimal satu folder yang akan dicadangkan.");
  if (!d) return bad("nodst", "Pilih dulu media penyimpanan tujuan sebelum memulai backup.");
  if (!t) return bad("notype", "Pilih dulu jenis backup (full, incremental, atau differential).");
  if (fo.includes("Game")) return bad("game", "Folder Game bukan data penting dan memakan banyak ruang. Skenario hanya meminta Tugas Sekolah dan Foto Kelas.");
  if (fo.length < 2) return bad("one", "Skenario meminta dua folder: Tugas Sekolah dan Foto Kelas. Satu folder belum lengkap.");
  if (t.value != "full") return bad("notfull", "Backup pertama belum punya acuan. Incremental dan differential hanya menyalin perubahan, jadi harus ada full backup lebih dulu. Pilih Full.");
  LA.log("bk", { ok: 1 });
  fb.innerHTML = `
      <div class="bar"><i id="pb"></i></div>
      <div id="pt" class="hint">Menyalin file…</div>`;
  setTimeout(() => $("#pb").style.width = "100%", 50);
  setTimeout(() => {
    state.bk = true;
    fb.innerHTML = `
      <div class="fb ok"><b>Backup Berhasil.</b> 2 folder disalin dengan jenis Full ke ${d.value == "cl" ? "Cloud" : "hard disk eksternal"}.</div>`;
    $(".nav .pri").disabled = false;
  }, 1500);
}
