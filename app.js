const $=s=>document.querySelector(s);
const S={cur:0,max:0,vid:false,vs:-1,hs:new Set(),tab:'full',watch:new Set(),st:{full:0,incr:0,diff:0},q:{i:0,score:0,sent:false,pick:null,done:false,hist:[]},bk:false,rs:false};
let T=null;
const stopT=()=>{clearInterval(T);T=null};
function go(n){stopT();S.cur=n;S.max=Math.max(S.max,n);render()}
function render(){
  $('#dots').innerHTML=[1,2,3,4,5,6,7].map((n,i)=>`<button class="${i==S.cur?'on':i<=S.max?'seen':''}" ${i>S.max?'disabled':''} onclick="go(${i})" aria-label="Layar ${n}">${n}</button>`).join('');
  [L1,L2,L3,L4,L5,L6,L7][S.cur]();window.scrollTo(0,0);
}
const nav=(next,ok=true,extra='')=>`<div class="nav">${S.cur>0?`<button class="ghost" onclick="go(S.cur-1)">Kembali</button>`:'<span></span>'}${extra}${next?`<button class="pri" ${ok?'':'disabled'} onclick="go(S.cur+1)">${next}</button>`:''}</div>`;
const V=h=>$('#v').innerHTML=h;

/* Layar 1 */
function L1(){V(`<div class="card hero"><h1>Yuk, Amankan Data Kita!</h1><p class="lead" style="margin:0 auto">Satu laptop rusak bisa menghapus tugas, foto, dan kerjaanmu. Belajar backup dan restore lewat skenario nyata dan simulasi tanpa risiko.</p><div class="drive" aria-hidden="true"><span>💻</span><span>☁️</span><span>💾</span></div><button class="pri" style="font-size:18px;padding:14px 36px" onclick="go(1)">Mulai</button></div>`)}

/* Layar 2 */
function L2(){V(`<div class="card"><h2>Tujuan pembelajaran</h2><ol class="tj"><li>Menjelaskan konsep dan pentingnya backup dan restore data.</li><li>Mengidentifikasi jenis backup (full, incremental, differential) dan media penyimpanannya.</li><li>Mensimulasikan langkah backup ke media tertentu.</li><li>Mensimulasikan restore data dengan aman.</li><li>Mengevaluasi risiko dan kesalahan umum backup dan restore.</li></ol></div>
<div class="card"><h3>Petunjuk penggunaan</h3><div class="icons"><div><b>Lanjut / Kembali</b><br>Pindah antar layar dengan tombol di bawah.</div><div><b>Nomor di atas</b><br>Menu: kembali ke layar yang sudah dibuka.</div><div><b>Putar / Jeda</b><br>Kendalikan video dan animasi sendiri.</div><div><b>Ulangi</b><br>Putar ulang materi yang belum paham.</div></div></div>${nav('Lanjut')}`)}

/* Layar 3 */
const SC=[{e:'💻🦠',c:'Laptop Dina terkena virus. Semua file tugas terenkripsi dan tidak bisa dibuka.'},{e:'🗑️📄',c:'Raka tidak sengaja menghapus laporan akhir semester, lalu mengosongkan Recycle Bin.'},{e:'💥💻',c:'Laptop jatuh dan hard disk rusak. Foto dan data tugas hilang. Tanpa backup, semua tidak bisa kembali.'},{e:'☁️✅',c:'Beda cerita jika Dina rutin backup: ganti laptop, restore, dan semua kembali dalam hitungan menit.'}];
const MD={hdd:['💽','Hard disk eksternal','Kapasitas besar, murah per GB, tanpa internet.','Bisa rusak atau hilang, harus dicolokkan manual.'],fd:['💾','Flashdisk','Kecil, praktis, murah.','Kapasitas kecil, mudah hilang dan rusak.'],nas:['🗄️','NAS','Penyimpanan jaringan, bisa otomatis dan dipakai bersama.','Biaya awal tinggi, butuh pengaturan jaringan.'],cl:['☁️','Cloud storage','Bisa diakses dari mana saja, lokasinya terpisah dari perangkat.','Butuh internet, kuota gratis terbatas, ada biaya langganan.']};
function L3(){
 V(`<div class="card"><h2>Kenapa backup penting?</h2><div class="stage" role="img" aria-live="polite"><div class="big" id="vb">▶️</div><div class="cap" id="vc">Tekan Putar untuk menonton skenario singkat.</div></div><div class="bar"><i id="vp"></i></div><div class="row"><button class="pri" onclick="vPlay()">${S.vid?'Putar ulang':'Putar'}</button><button class="ghost" onclick="stopT()">Jeda</button>${S.vid?'<span class="hint" style="align-self:center">✔ Video sudah ditonton</span>':''}</div></div>
<div class="card"><h2>Media penyimpanan backup</h2><p class="hint">Klik tiap media untuk melihat kelebihan dan kekurangannya (${S.hs.size}/4 dibuka).</p><div class="hs">${Object.entries(MD).map(([k,m])=>`<button id="h_${k}" onclick="hot('${k}')" class="${S.hs.has(k)?'':''}"><span class="e">${m[0]}</span>${m[1]}${S.hs.has(k)?'<span class="ck">✔</span>':''}</button>`).join('')}</div><div id="pop"></div></div>
${nav('Lanjut',S.vid&&S.hs.size==4)}${!(S.vid&&S.hs.size==4)?'<p class="hint">Tombol Lanjut aktif setelah video ditonton dan keempat media dibuka.</p>':''}`)}
function vShow(i){$('#vb').textContent=SC[i].e;$('#vc').textContent=SC[i].c;$('#vp').style.width=((i+1)/SC.length*100)+'%'}
function vPlay(){stopT();let i=0;vShow(0);T=setInterval(()=>{i++;if(i>=SC.length){stopT();S.vid=true;L3();vShow(SC.length-1);return}vShow(i)},3500)}
function hot(k){S.hs.add(k);const m=MD[k];L3();$('#h_'+k).classList.add('sel');$('#pop').innerHTML=`<div class="pop"><h3>${m[1]}</h3><p><b class="p">Kelebihan:</b> ${m[2]}</p><p><b class="k">Kekurangan:</b> ${m[3]}</p></div>`}

/* Layar 4 */
const FL=['Laporan.docx','Foto.jpg','Tugas.xlsx','Musik.mp3','Video.mp4','Catatan.txt'],DAY=['Senin','Selasa','Rabu'],CH=[[0,1,2,3,4,5],[0,2],[3]];
const CP={full:[[0,1,2,3,4,5],[0,1,2,3,4,5],[0,1,2,3,4,5]],incr:[[0,1,2,3,4,5],[0,2],[3]],diff:[[0,1,2,3,4,5],[0,2],[0,2,3]]};
const TN={full:'Full backup',incr:'Incremental backup',diff:'Differential backup'};
const CAPT={full:['Tekan Putar. Full menyalin SEMUA file setiap sesi.','Senin: semua 6 file disalin.','Selasa: Laporan dan Tugas berubah, tetapi full tetap menyalin semua 6 file lagi.','Rabu: lagi-lagi semua file disalin. Restore mudah (cukup 1 set), tetapi paling lama dan boros ruang.'],incr:['Tekan Putar. Incremental hanya menyalin yang berubah sejak backup TERAKHIR (jenis apa pun).','Senin: backup pertama, semua file disalin.','Selasa: hanya Laporan dan Tugas (yang berubah sejak Senin) yang disalin.','Rabu: hanya Musik (berubah sejak Selasa). Hemat dan cepat, tetapi restore butuh set Senin + Selasa + Rabu, berurutan.'],diff:['Tekan Putar. Differential menyalin semua perubahan sejak backup FULL terakhir.','Senin: backup full pertama, semua file disalin.','Selasa: Laporan dan Tugas disalin (berubah sejak full Senin).','Rabu: Laporan, Tugas, DAN Musik disalin, karena semuanya berubah sejak full Senin. Restore cukup butuh full + differential terakhir.']};
function L4(){
 const t=S.tab,st=S.st[t],all=['full','incr','diff'].every(x=>S.watch.has(x));
 let rows=FL.map((f,r)=>`<tr><td class="f">${f}</td>${[0,1,2].map(d=>{const cp=CP[t][d].includes(r),chg=d>0&&CH[d].includes(r)||d==0;let c='c'+(chg?' ch':''),x=chg&&d>0?'berubah':'';if(d<st&&cp){c='c cp';x='disalin'}if(d==st-1&&cp)c='c now';if(d==st-1&&cp)x='disalin';return`<td class="${c}">${x}</td>`}).join('')}</tr>`).join('');
 V(`<div class="card"><h2>Tiga jenis backup, tahap demi tahap</h2><div class="tabs" role="tablist">${Object.keys(TN).map(k=>`<button role="tab" class="${k==t?'on':''}" onclick="S.tab='${k}';stopT();L4()">${TN[k]}${S.watch.has(k)?' <span class="ck">✔</span>':''}</button>`).join('')}</div>
 <div class="wrap"><table class="g"><tr><th></th>${DAY.map(d=>`<th>${d}</th>`).join('')}</tr>${rows}</table></div>
 <div class="legend"><span>▢ garis merah = file berubah</span><span>■ biru = disalin ke backup</span><span>■ kuning = sedang disalin</span></div>
 <div class="cap2" aria-live="polite">${CAPT[t][st]}</div>
 <div class="row"><button class="pri" onclick="a4Play()">Putar</button><button class="ghost" onclick="stopT()">Jeda</button><button class="ghost" onclick="stopT();S.st[S.tab]=0;L4()">Ulangi</button></div></div>
 ${nav(all?'Lanjut ke Simulasi':'Lanjut ke Simulasi',all)}${all?'':`<p class="hint">Tonton ketiga animasi sampai selesai untuk membuka simulasi (${S.watch.size}/3).</p>`}`)}
function a4Play(){stopT();const t=S.tab;if(S.st[t]>=3)S.st[t]=0;T=setInterval(()=>{if(S.tab!=t){stopT();return}S.st[t]++;if(S.st[t]>=3){stopT();S.watch.add(t)}L4()},2600);S.st[t]++;if(S.st[t]>=3){stopT();S.watch.add(t)}L4()}

/* Layar 5 */
function L5(){
 V(`<div class="card"><h2>Simulasi: lakukan backup</h2><div class="scn"><b>Skenario:</b> Ini pertama kalinya kamu backup. Cadangkan folder <b>Tugas Sekolah</b> dan <b>Foto Kelas</b> ke media tujuan yang kamu pilih. Folder Game tidak perlu.</div>
 <fieldset><legend>1. Pilih folder</legend>${['Tugas Sekolah','Foto Kelas','Game'].map(f=>`<label class="o"><input type="checkbox" name="fo" value="${f}">${f}</label>`).join('')}</fieldset>
 <fieldset><legend>2. Media tujuan</legend>${[['cl','Cloud (Google Drive)'],['hdd','Hard disk eksternal']].map(m=>`<label class="o"><input type="radio" name="dst" value="${m[0]}">${m[1]}</label>`).join('')}</fieldset>
 <fieldset><legend>3. Jenis backup</legend>${[['full','Full'],['incr','Incremental'],['diff','Differential']].map(m=>`<label class="o"><input type="radio" name="typ" value="${m[0]}">${m[1]}</label>`).join('')}</fieldset>
 <button class="pri" onclick="doBackup()">Mulai Backup</button><div id="fb" aria-live="polite"></div></div>
 ${nav('Lanjut ke Simulasi Restore',S.bk)}`)}
function doBackup(){
 const fo=[...document.querySelectorAll('[name=fo]:checked')].map(x=>x.value),d=document.querySelector('[name=dst]:checked'),t=document.querySelector('[name=typ]:checked'),fb=$('#fb');
 const bad=m=>{fb.innerHTML=`<div class="fb no">${m}</div><button class="ghost" onclick="L5()">Coba Lagi</button>`};
 if(!fo.length)return bad('Pilih dulu minimal satu folder yang akan dicadangkan.');
 if(!d)return bad('Pilih dulu media penyimpanan tujuan sebelum memulai backup.');
 if(!t)return bad('Pilih dulu jenis backup (full, incremental, atau differential).');
 if(fo.includes('Game'))return bad('Folder Game bukan data penting dan memakan banyak ruang. Skenario hanya meminta Tugas Sekolah dan Foto Kelas.');
 if(fo.length<2)return bad('Skenario meminta dua folder: Tugas Sekolah dan Foto Kelas. Satu folder belum lengkap.');
 if(t.value!='full')return bad('Backup pertama belum punya acuan. Incremental dan differential hanya menyalin perubahan, jadi harus ada full backup lebih dulu. Pilih Full.');
 fb.innerHTML=`<div class="bar"><i id="pb"></i></div><div id="pt" class="hint">Menyalin file…</div>`;
 setTimeout(()=>$('#pb').style.width='100%',50);
 setTimeout(()=>{S.bk=true;fb.innerHTML=`<div class="fb ok"><b>Backup Berhasil.</b> 2 folder disalin dengan jenis Full ke ${d.value=='cl'?'Cloud':'hard disk eksternal'}.</div>`;$('.nav .pri').disabled=false},1500)}

/* Layar 6 */
const VR=[['Senin, 13 Okt 2026 · 20:00','Laporan.docx versi awal (belum ada bab 4 dan 5)'],['Selasa, 14 Okt 2026 · 20:00','Laporan.docx lengkap, 1 jam sebelum terhapus'],['Kamis, 16 Okt 2026 · 20:00','Backup setelah file terhapus: Laporan.docx tidak ada']];
function L6(){
 V(`<div class="card"><h2>Simulasi: restore data dengan aman</h2><div class="scn"><b>Skenario:</b> Laporan.docx terhapus tidak sengaja pada Rabu, 15 Okt pukul 09:00. Sudah ada beberapa file baru di folder asli yang tidak boleh hilang. Pulihkan versi laporan terbaru yang masih utuh.</div>
 <fieldset><legend>1. Pilih titik pemulihan</legend>${VR.map((v,i)=>`<label class="o"><input type="radio" name="ver" value="${i}"><span><b>${v[0]}</b><br><span class="hint">${v[1]}</span></span></label>`).join('')}</fieldset>
 <fieldset><legend>2. Lokasi restore</legend>${[['asli','Timpa folder asli langsung'],['baru','Folder baru: Hasil_Restore'],['usb','Flashdisk milik teman']].map(m=>`<label class="o"><input type="radio" name="loc" value="${m[0]}">${m[1]}</label>`).join('')}</fieldset>
 <button class="pri" onclick="doRestore()">Mulai Restore</button><div id="fb" aria-live="polite"></div></div>
 ${nav('Lanjut ke Evaluasi',S.rs)}`)}
function doRestore(){
 const v=document.querySelector('[name=ver]:checked'),l=document.querySelector('[name=loc]:checked'),fb=$('#fb');
 const bad=m=>{fb.innerHTML=`<div class="fb no">${m}</div><button class="ghost" onclick="L6()">Coba Lagi</button>`};
 if(!v)return bad('Pilih dulu titik pemulihan yang akan dipulihkan.');
 if(!l)return bad('Pilih dulu lokasi tujuan restore.');
 if(v.value=='0')return bad('Versi Senin terlalu lama: bab 4 dan 5 belum ada. Pilih titik pemulihan terbaru SEBELUM file terhapus.');
 if(v.value=='2')return bad('Backup Kamis dibuat setelah file terhapus, jadi Laporan.docx tidak ada di dalamnya. Pilih titik sebelum Rabu 09:00.');
 if(l.value=='asli')return bad('Sebaiknya restore ke folder baru dulu untuk menghindari risiko menimpa data yang masih dibutuhkan.');
 if(l.value=='usb')return bad('Memulihkan ke perangkat orang lain berisiko membocorkan data dan tidak praktis. Gunakan folder baru di perangkatmu sendiri.');
 S.rs=true;fb.innerHTML=`<div class="fb ok"><b>Data Berhasil Dipulihkan</b> ke Hasil_Restore. Cek isi file, lalu salin ke folder asli jika sudah benar. Data lain di folder asli tetap aman.</div>`;$('.nav .pri').disabled=false}

/* Layar 7 */
const QS=[
{s:'Dina mengedit tugas setiap hari. Ia ingin backup harian yang cepat dan hemat ruang, hanya menyalin yang berubah sejak backup terakhir.',o:['Full backup','Incremental backup','Mengopi manual ke flashdisk sesekali','Differential backup'],a:1,e:'Incremental hanya menyalin perubahan sejak backup terakhir, jadi paling cepat dan hemat. Differential menyalin semua perubahan sejak full, sehingga makin besar tiap hari.'},
{s:'Admin lab ingin proses restore sesederhana mungkin: hanya perlu full terakhir ditambah satu backup lainnya.',o:['Incremental','Full tiap jam','Differential','Tidak perlu backup'],a:2,e:'Pada differential, restore cukup memakai full terakhir ditambah differential terakhir. Incremental butuh seluruh rantai backup.'},
{s:'Raka menyimpan backup di flashdisk yang selalu dimasukkan ke tas laptop. Laptop dan tasnya hilang dicuri. Apa kesalahannya?',o:['Flashdisk terlalu kecil','Backup disimpan di lokasi yang sama dengan data asli','Seharusnya memakai full backup','Tidak ada kesalahan'],a:1,e:'Cadangan harus terpisah dari data asli, misalnya cloud atau hard disk di rumah. Jika tidak, satu kejadian menghilangkan keduanya.'},
{s:'File Tugas.xlsx rusak hari ini karena terkena virus pada pukul 10:00. Backup tersedia kemarin 20:00 dan hari ini 12:00. Mana yang dipilih?',o:['Hari ini 12:00, karena paling baru','Kemarin 20:00, lalu restore ke folder baru','Menunggu backup berikutnya','Hapus semua backup lama'],a:1,e:'Backup pukul 12:00 dibuat setelah infeksi, jadi kemungkinan ikut rusak. Pilih titik sebelum kejadian dan restore ke folder baru dulu.'},
{s:'Sekolah rutin backup tiap malam, tetapi tidak pernah mencoba restore. Apa risikonya?',o:['Tidak ada, backup pasti berfungsi','Backup bisa saja rusak atau tidak lengkap dan baru ketahuan saat darurat','Backup menjadi lebih cepat','Cloud otomatis memperbaikinya'],a:1,e:'Backup yang tidak pernah diuji belum tentu bisa dipulihkan. Lakukan uji restore berkala.'},
{s:'Studi kasus: Koperasi sekolah mencatat penjualan setiap hari. Ruang cloud terbatas, tetapi data tidak boleh hilang dan restore harus mudah dilakukan petugas non-teknis. Strategi mana yang paling tepat?',o:['Full tiap hari ke flashdisk di meja kasir','Full tiap Minggu + differential harian, salinan disimpan di cloud','Hanya incremental, tanpa full sama sekali','Backup sebulan sekali'],a:1,e:'Full mingguan memberi titik acuan, differential harian hemat ruang dan restore mudah (full + 1 differential), dan cloud memberi lokasi terpisah. Incremental tanpa full tidak punya acuan.'}];
function L7(){
 const q=S.q;
 if(q.done)return fin();
 const Q=QS[q.i];
 V(`<div class="card qq"><div class="hint">Soal ${q.i+1} dari ${QS.length}${q.i==5?' · studi kasus':''}</div><div class="bar"><i style="width:${q.i/QS.length*100}%"></i></div><h3 style="font-size:19px;line-height:1.4">${Q.s}</h3>${Q.o.map((o,i)=>{let c='opt';if(q.sent){if(i==Q.a)c+=' right';else if(i==q.pick)c+=' wrong'}else if(i==q.pick)c+=' sel';return`<button class="${c}" ${q.sent?'disabled':''} onclick="S.q.pick=${i};L7()">${o}</button>`}).join('')}
 ${q.sent?`<div class="fb ${q.pick==Q.a?'ok':'no'}"><b>${q.pick==Q.a?'Tepat.':'Belum tepat.'}</b> ${Q.e}</div><button class="pri" onclick="nextQ()">${q.i==5?'Lihat hasil':'Soal berikutnya'}</button>`:`<button class="pri" ${q.pick===null?'disabled':''} onclick="sendQ()">Kirim Jawaban</button>`}</div>${q.i==0&&!q.sent?nav(null):''}`)}
function sendQ(){const q=S.q;q.sent=true;if(q.pick==QS[q.i].a)q.score++;q.hist.push(q.pick==QS[q.i].a);L7()}
function nextQ(){const q=S.q;q.sent=false;q.pick=null;if(q.i==5)q.done=true;else q.i++;L7()}
function fin(){
 const q=S.q,p=Math.round(q.score/QS.length*100),ok=p>=75;
 V(`<div class="card" style="text-align:center"><div class="score" style="color:${ok?'var(--ok)':'var(--bad)'}">${p}</div><p>${q.score} dari ${QS.length} soal benar · ${ok?'Tuntas':'Belum tuntas (batas 75)'}</p><h3>${ok?'Mantap, kamu sudah siap menerapkan backup rutin!':'Yuk, tonton ulang animasi jenis backup dan coba simulasi lagi.'}</h3>
 ${ok?'':`<p class="hint">Saran: ulangi Layar 4 (jenis backup), lalu Layar 5 dan 6 (simulasi) sebelum mengulang kuis.</p><div class="row" style="justify-content:center"><button class="ghost" onclick="go(3)">Ulangi Layar 4</button><button class="ghost" onclick="go(4)">Ulangi Layar 5</button><button class="ghost" onclick="go(5)">Ulangi Layar 6</button></div>`}</div>
 <div class="card"><h3>Rangkuman</h3><ul class="sum"><li>Backup melindungi data dari virus, kerusakan perangkat, dan salah hapus.</li><li><b>Full</b>: semua file. <b>Incremental</b>: perubahan sejak backup terakhir. <b>Differential</b>: perubahan sejak full terakhir.</li><li>Simpan cadangan di lokasi berbeda dari data asli.</li><li>Saat restore, pilih titik sebelum kejadian dan pulihkan ke folder baru dulu.</li><li>Uji restore secara berkala.</li></ul><p class="hint"><b>Pengayaan:</b> susun jadwal backup rutin untuk laptop atau HP-mu (media, jenis backup, hari).</p></div>
 <div class="nav"><button class="ghost" onclick="S.q={i:0,score:0,sent:false,pick:null,done:false,hist:[]};L7()">Ulangi Kuis</button><button class="pri" onclick="fin2()">Selesai</button></div>`)}
function fin2(){V(`<div class="card hero"><h1>Terima kasih!</h1><p class="lead" style="margin:0 auto 20px">Mulai hari ini, jadwalkan backup rutinmu.</p><button class="ghost" onclick="S.cur=0;go(0)">Kembali ke awal</button></div>`)}
$('#tg').onclick=()=>{const r=document.documentElement,d=getComputedStyle(r).getPropertyValue('--bg').trim()=='#0e1b1f';r.dataset.theme=d?'light':'dark'};
render();
