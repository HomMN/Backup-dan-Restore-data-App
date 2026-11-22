// Titik awal tampilan: tombol ganti tema dan layar pertama.

$("#tg").onclick = () => {
  const r = document.documentElement, d = getComputedStyle(r).getPropertyValue("--bg").trim() == "#0e1b1f";
  r.dataset.theme = d ? "light" : "dark";
};
render();
