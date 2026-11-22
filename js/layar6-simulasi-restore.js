// Titik pemulihan pada simulasi restore: [waktu backup, keterangan].
const TITIK_PEMULIHAN = [["Senin, 13 Okt 2026 · 20:00", "Laporan.docx versi awal (belum ada bab 4 dan 5)"], ["Selasa, 14 Okt 2026 · 20:00", "Laporan.docx lengkap, 1 jam sebelum terhapus"], ["Kamis, 16 Okt 2026 · 20:00", "Backup setelah file terhapus: Laporan.docx tidak ada"]];
// Layar 6 - Simulasi memilih titik pemulihan dan lokasi restore.
function tampilkanSimulasiRestore() {
  setKonten(`
      <div class="card">
      <h2>Simulasi: restore data dengan aman</h2>
      <div class="scn"><b>Skenario:</b> Laporan.docx terhapus tidak sengaja pada Rabu, 15 Okt pukul 09:00. Sudah ada beberapa file baru di folder asli yang tidak boleh hilang. Pulihkan versi laporan terbaru yang masih utuh.</div>
 <fieldset><legend>1. Pilih titik pemulihan</legend>${TITIK_PEMULIHAN.map((v, i) => `<label class="o"><input type="radio" name="ver" value="${i}"><span><b>${v[0]}</b><br><span class="hint">${v[1]}</span></span></label>`).join("")}</fieldset>
 <fieldset><legend>2. Lokasi restore</legend>${[["asli", "Timpa folder asli langsung"], ["baru", "Folder baru: Hasil_Restore"], ["usb", "Flashdisk milik teman"]].map((m) => `<label class="o"><input type="radio" name="loc" value="${m[0]}">${m[1]}</label>`).join("")}</fieldset>
 <button class="pri" onclick="jalankanRestore()">Mulai Restore</button>
      <div id="fb" aria-live="polite"></div></div>
 ${tombolNavigasi("Lanjut ke Evaluasi", state.rs)}`);
}
// Memeriksa titik pemulihan dan lokasi restore yang dipilih siswa.
function jalankanRestore() {
  const v = document.querySelector("[name=ver]:checked"), l = document.querySelector("[name=loc]:checked"), fb = $("#fb");
  const bad = (c, m) => {
    LA.log("rs", { ok: 0, err: c });
    fb.innerHTML = `
      <div class="fb no">${m}</div><button class="ghost" onclick="tampilkanSimulasiRestore()">Coba Lagi</button>`;
  };
  if (!v) return bad("nover", "Pilih dulu titik pemulihan yang akan dipulihkan.");
  if (!l) return bad("noloc", "Pilih dulu lokasi tujuan restore.");
  if (v.value == "0") return bad("old", "Versi Senin terlalu lama: bab 4 dan 5 belum ada. Pilih titik pemulihan terbaru SEBELUM file terhapus.");
  if (v.value == "2") return bad("after", "Backup Kamis dibuat setelah file terhapus, jadi Laporan.docx tidak ada di dalamnya. Pilih titik sebelum Rabu 09:00.");
  if (l.value == "asli") return bad("asli", "Sebaiknya restore ke folder baru dulu untuk menghindari risiko menimpa data yang masih dibutuhkan.");
  if (l.value == "usb") return bad("usb", "Memulihkan ke perangkat orang lain berisiko membocorkan data dan tidak praktis. Gunakan folder baru di perangkatmu sendiri.");
  state.rs = true;
  LA.log("rs", { ok: 1 });
  fb.innerHTML = `
      <div class="fb ok"><b>Data Berhasil Dipulihkan</b> ke Hasil_Restore. Cek isi file, lalu salin ke folder asli jika sudah benar. Data lain di folder asli tetap aman.</div>`;
  $(".nav .pri").disabled = false;
}
