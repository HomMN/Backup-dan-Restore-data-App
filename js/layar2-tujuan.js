// Layar 2 - Tujuan pembelajaran dan petunjuk penggunaan.
function tampilkanTujuan() {
  setKonten(`
      <div class="card">
      <h2>Tujuan pembelajaran</h2>
      <ol class="tj"><li>Menjelaskan konsep dan pentingnya backup dan restore data.</li><li>Mengidentifikasi jenis backup (full, incremental, differential) dan media penyimpanannya.</li><li>Mensimulasikan langkah backup ke media tertentu.</li><li>Mensimulasikan restore data dengan aman.</li><li>Mengevaluasi risiko dan kesalahan umum backup dan restore.</li></ol></div>
<div class="card">
      <h3>Petunjuk penggunaan</h3>
      <div class="icons">
      <div><b>Lanjut / Kembali</b><br>Pindah antar layar dengan tombol di bawah.</div>
      <div><b>Putar / Jeda</b><br>Kendalikan video dan animasi sendiri.</div>
      <div><b>Ulangi</b><br>Putar ulang materi yang belum paham.</div></div></div>${tombolNavigasi("Lanjut")}`);
}
