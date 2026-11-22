// Bank soal. kunci = indeks jawaban benar (dimulai dari 0).
const BANK_SOAL = [
  { soal: "Dina mengedit tugas setiap hari. Ia ingin backup harian yang cepat dan hemat ruang, hanya menyalin yang berubah sejak backup terakhir.", opsi: ["Full backup", "Incremental backup", "Mengopi manual ke flashdisk sesekali", "Differential backup"], kunci: 1, penjelasan: "Incremental hanya menyalin perubahan sejak backup terakhir, jadi paling cepat dan hemat. Differential menyalin semua perubahan sejak full, sehingga makin besar tiap hari." },
  { soal: "Admin lab ingin proses restore sesederhana mungkin: hanya perlu full terakhir ditambah satu backup lainnya.", opsi: ["Incremental", "Full tiap jam", "Differential", "Tidak perlu backup"], kunci: 2, penjelasan: "Pada differential, restore cukup memakai full terakhir ditambah differential terakhir. Incremental butuh seluruh rantai backup." },
  { soal: "Raka menyimpan backup di flashdisk yang selalu dimasukkan ke tas laptop. Laptop dan tasnya hilang dicuri. Apa kesalahannya?", opsi: ["Flashdisk terlalu kecil", "Backup disimpan di lokasi yang sama dengan data asli", "Seharusnya memakai full backup", "Tidak ada kesalahan"], kunci: 1, penjelasan: "Cadangan harus terpisah dari data asli, misalnya cloud atau hard disk di rumah. Jika tidak, satu kejadian menghilangkan keduanya." },
  { soal: "File Tugas.xlsx rusak hari ini karena terkena virus pada pukul 10:00. Backup tersedia kemarin 20:00 dan hari ini 12:00. Mana yang dipilih?", opsi: ["Hari ini 12:00, karena paling baru", "Kemarin 20:00, lalu restore ke folder baru", "Menunggu backup berikutnya", "Hapus semua backup lama"], kunci: 1, penjelasan: "Backup pukul 12:00 dibuat setelah infeksi, jadi kemungkinan ikut rusak. Pilih titik sebelum kejadian dan restore ke folder baru dulu." },
  { soal: "Sekolah rutin backup tiap malam, tetapi tidak pernah mencoba restore. Apa risikonya?", opsi: ["Tidak ada, backup pasti berfungsi", "Backup bisa saja rusak atau tidak lengkap dan baru ketahuan saat darurat", "Backup menjadi lebih cepat", "Cloud otomatis memperbaikinya"], kunci: 1, penjelasan: "Backup yang tidak pernah diuji belum tentu bisa dipulihkan. Lakukan uji restore berkala." },
  { soal: "Studi kasus: Koperasi sekolah mencatat penjualan setiap hari. Ruang cloud terbatas, tetapi data tidak boleh hilang dan restore harus mudah dilakukan petugas non-teknis. Strategi mana yang paling tepat?", opsi: ["Full tiap hari ke flashdisk di meja kasir", "Full tiap Minggu + differential harian, salinan disimpan di cloud", "Hanya incremental, tanpa full sama sekali", "Backup sebulan sekali"], kunci: 1, penjelasan: "Full mingguan memberi titik acuan, differential harian hemat ruang dan restore mudah (full + 1 differential), dan cloud memberi lokasi terpisah. Incremental tanpa full tidak punya acuan." }
];
// Layar 7 - Kuis skenario, satu soal per tampilan.
function tampilkanEvaluasi() {
  const q = state.q;
  if (q.done) return tampilkanHasil();
  if (!q.sent && !q.t0) q.t0 = Date.now();
  const Q = BANK_SOAL[q.i];
  setKonten(`
      <div class="card qq">
      <div class="hint">Soal ${q.i + 1} dari ${BANK_SOAL.length}${q.i == 5 ? " · studi kasus" : ""}</div>
      <div class="bar"><i style="width:${q.i / BANK_SOAL.length * 100}%"></i></div>
      <h3 style="font-size:19px;line-height:1.4">${Q.soal}</h3>${Q.opsi.map((o, i) => {
    let c = "opt";
    if (q.sent) {
      if (i == Q.kunci) c += " right";
      else if (i == q.pick) c += " wrong";
    } else if (i == q.pick) c += " sel";
    return `<button class="${c}" ${q.sent ? "disabled" : ""} onclick="state.q.pick=${i};tampilkanEvaluasi()">${o}</button>`;
  }).join("")}
 ${q.sent ? `
      <div class="fb ${q.pick == Q.kunci ? "ok" : "no"}"><b>${q.pick == Q.kunci ? "Tepat." : "Belum tepat."}</b> ${Q.penjelasan}</div><button class="pri" onclick="soalBerikutnya()">${q.i == 5 ? "Lihat hasil" : "Soal berikutnya"}</button>` : `<button class="pri" ${q.pick === null ? "disabled" : ""} onclick="kirimJawaban()">Kirim Jawaban</button>`}</div>${q.i == 0 && !q.sent ? tombolNavigasi(null) : ""}`);
}
// Mengunci jawaban, menambah skor bila benar, lalu menampilkan penjelasan.
function kirimJawaban() {
  const q = state.q;
  q.sent = true;
  if (!q.att) q.att = LA.nextAtt();
  const ok = q.pick == BANK_SOAL[q.i].kunci;
  if (ok) q.score++;
  q.hist.push(ok);
  LA.log("qa", { att: q.att, q: q.i, pick: q.pick, ok: ok ? 1 : 0, ms: Date.now() - q.t0 });
  tampilkanEvaluasi();
}
// Pindah ke soal berikutnya, atau ke hasil setelah soal terakhir.
function soalBerikutnya() {
  const q = state.q;
  q.sent = false;
  q.pick = null;
  q.t0 = 0;
  if (q.i == 5) q.done = true;
  else q.i++;
  tampilkanEvaluasi();
}
// Rekap skor, pesan motivasi (batas tuntas 75), dan rangkuman materi.
function tampilkanHasil() {
  const q = state.q, p = Math.round(q.score / BANK_SOAL.length * 100), ok = p >= 75;
  if (!q.logged) {
    q.logged = true;
    LA.log("qd", { att: q.att, sc: q.score, tot: BANK_SOAL.length });
  }
  setKonten(`
      <div class="card" style="text-align:center">
      <div class="score" style="color:${ok ? "var(--ok)" : "var(--bad)"}">${p}</div><p>${q.score} dari ${BANK_SOAL.length} soal benar · ${ok ? "Tuntas" : "Belum tuntas (batas 75)"}</p>
      <h3>${ok ? "Mantap, kamu sudah siap menerapkan backup rutin!" : "Yuk, tonton ulang animasi jenis backup dan coba simulasi lagi."}</h3>
 ${ok ? "" : `<p class="hint">Saran: ulangi Layar 4 (jenis backup), lalu Layar 5 dan 6 (simulasi) sebelum mengulang kuis.</p>
      <div class="row" style="justify-content:center"><button class="ghost" onclick="pindahLayar(3)">Ulangi Layar 4</button><button class="ghost" onclick="pindahLayar(4)">Ulangi Layar 5</button><button class="ghost" onclick="pindahLayar(5)">Ulangi Layar 6</button></div>`}</div>
 <div class="card">
      <h3>Rangkuman</h3>
      <ul class="sum"><li>Backup melindungi data dari virus, kerusakan perangkat, dan salah hapus.</li><li><b>Full</b>: semua file. <b>Incremental</b>: perubahan sejak backup terakhir. <b>Differential</b>: perubahan sejak full terakhir.</li><li>Simpan cadangan di lokasi berbeda dari data asli.</li><li>Saat restore, pilih titik sebelum kejadian dan pulihkan ke folder baru dulu.</li><li>Uji restore secara berkala.</li></ul><p class="hint"><b>Pengayaan:</b> susun jadwal backup rutin untuk laptop atau HP-mu (media, jenis backup, hari).</p></div>
 <div class="nav"><button class="ghost" onclick="state.q=kuisBaru();tampilkanEvaluasi()">Ulangi Kuis</button><button class="pri" onclick="tampilkanPenutup()">Selesai</button></div>`);
}
// Halaman penutup setelah siswa menekan Selesai.
function tampilkanPenutup() {
  setKonten(`
      <div class="card hero"><h1>Terima kasih!</h1><p class="lead" style="margin:0 auto 20px">Mulai hari ini, jadwalkan backup rutinmu.</p><button class="ghost" onclick="state.cur=0;pindahLayar(0)">Kembali ke awal</button></div>`);
}
