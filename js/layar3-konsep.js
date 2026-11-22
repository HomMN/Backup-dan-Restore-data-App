// Adegan pada video skenario.
const ADEGAN_VIDEO = [{ emoji: "💻🦠", teks: "Laptop Dina terkena virus. Semua file tugas terenkripsi dan tidak bisa dibuka." }, { emoji: "🗑️📄", teks: "Raka tidak sengaja menghapus laporan akhir semester, lalu mengosongkan Recycle Bin." }, { emoji: "💥💻", teks: "Laptop jatuh dan hard disk rusak. Foto dan data tugas hilang. Tanpa backup, semua tidak bisa kembali." }, { emoji: "☁️✅", teks: "Beda cerita jika Dina rutin backup: ganti laptop, restore, dan semua kembali dalam hitungan menit." }];
// Data hotspot: [ikon, nama, kelebihan, kekurangan].
const MEDIA_BACKUP = { hdd: ["💽", "Hard disk eksternal", "Kapasitas besar, murah per GB, tanpa internet.", "Bisa rusak atau hilang, harus dicolokkan manual."], fd: ["💾", "Flashdisk", "Kecil, praktis, murah.", "Kapasitas kecil, mudah hilang dan rusak."], nas: ["🗄️", "NAS", "Penyimpanan jaringan, bisa otomatis dan dipakai bersama.", "Biaya awal tinggi, butuh pengaturan jaringan."], cl: ["☁️", "Cloud storage", "Bisa diakses dari mana saja, lokasinya terpisah dari perangkat.", "Butuh internet, kuota gratis terbatas, ada biaya langganan."] };
// Layar 3 - Video skenario + hotspot media penyimpanan.
// Lanjut aktif setelah video ditonton dan keempat hotspot dibuka.
function tampilkanKonsep() {
  setKonten(`
      <div class="card">
      <h2>Kenapa backup penting?</h2>
      <div class="stage" role="img" aria-live="polite">
      <div class="big" id="vb">▶️</div>
      <div class="cap" id="vc">Tekan Putar untuk menonton skenario singkat.</div></div>
      <div class="bar"><i id="vp"></i></div>
      <div class="row"><button class="pri" onclick="putarVideo()">${state.vid ? "Putar ulang" : "Putar"}</button><button class="ghost" onclick="hentikanTimer()">Jeda</button>${state.vid ? '<span class="hint" style="align-self:center">✔ Video sudah ditonton</span>' : ""}</div></div>
<div class="card">
      <h2>Media penyimpanan backup</h2><p class="hint">Klik tiap media untuk melihat kelebihan dan kekurangannya (${state.hs.size}/4 dibuka).</p>
      <div class="hs">${Object.entries(MEDIA_BACKUP).map(([k, m]) => `<button id="h_${k}" onclick="bukaHotspot('${k}')" class="${state.hs.has(k) ? "" : ""}"><span class="e">${m[0]}</span>${m[1]}${state.hs.has(k) ? '<span class="ck">✔</span>' : ""}</button>`).join("")}</div>
      <div id="pop"></div></div>
${tombolNavigasi("Lanjut", state.vid && state.hs.size == 4)}${!(state.vid && state.hs.size == 4) ? '<p class="hint">Tombol Lanjut aktif setelah video ditonton dan keempat media dibuka.</p>' : ""}`);
}
// Menampilkan satu adegan video beserta progress bar-nya.
function tampilkanAdegan(i) {
  $("#vb").textContent = ADEGAN_VIDEO[i].emoji;
  $("#vc").textContent = ADEGAN_VIDEO[i].teks;
  $("#vp").style.width = (i + 1) / ADEGAN_VIDEO.length * 100 + "%";
}
// Memutar adegan satu per satu, tiap 3,5 detik.
function putarVideo() {
  hentikanTimer();
  LA.log("vid", { a: "play" });
  let i = 0;
  tampilkanAdegan(0);
  timerAktif = setInterval(() => {
    i++;
    if (i >= ADEGAN_VIDEO.length) {
      hentikanTimer();
      state.vid = true;
      LA.log("vid", { a: "done" });
      tampilkanKonsep();
      tampilkanAdegan(ADEGAN_VIDEO.length - 1);
      return;
    }
    tampilkanAdegan(i);
  }, 3500);
}
// Menandai hotspot sudah dibuka lalu menampilkan pop-up kelebihan dan kekurangannya.
function bukaHotspot(k) {
  state.hs.add(k);
  LA.log("hot", { k });
  const m = MEDIA_BACKUP[k];
  tampilkanKonsep();
  $("#h_" + k).classList.add("sel");
  $("#pop").innerHTML = `
      <div class="pop">
      <h3>${m[1]}</h3><p><b class="p">Kelebihan:</b> ${m[2]}</p><p><b class="k">Kekurangan:</b> ${m[3]}</p></div>`;
}
