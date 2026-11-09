let charts = {};
let mapInstance = null;

const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);

function showPage(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.add("hidden"));
  $("page-" + page).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  const titles = {dashboard:"Dashboard Data",kepegawaian:"Data Kepegawaian",wilayah:"Data Wilayah"};
  $("pageTitle").textContent = titles[page];
  $("sidebar").classList.add("-translate-x-full");
  $("sidebarOverlay").classList.add("hidden");
  if (page === "wilayah") setTimeout(() => mapInstance && mapInstance.invalidateSize(), 120);
}
document.querySelectorAll(".nav-link").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
$("menuToggle").addEventListener("click", () => {$("sidebar").classList.toggle("-translate-x-full");$("sidebarOverlay").classList.toggle("hidden");});
$("sidebarOverlay").addEventListener("click", () => {$("sidebar").classList.add("-translate-x-full");$("sidebarOverlay").classList.add("hidden");});

function renderDashboard() {
  const d = CWS_DATA;
  $("statPenyuluh").textContent = fmt(d.employees.length);
  $("statLahan").innerHTML = `${fmt(d.stats.landArea)} <small>Ha</small>`;
  $("statPoktan").textContent = fmt(d.areas.reduce((s,a)=>s+a.groups,0));
  $("statCapaian").textContent = `${d.stats.programAchievement}%`;
  $("updateDate").textContent = new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
  const statusCounts = ["PNS","PPPK","THL"].map(s => d.employees.filter(e=>e.status===s).length);
  charts.program = new Chart($("programChart"),{type:"bar",data:{labels:d.programs.map(p=>p.name),datasets:[{label:"Target",data:d.programs.map(p=>p.target),backgroundColor:"#dbeafe",borderRadius:7},{label:"Realisasi",data:d.programs.map(p=>p.realization),backgroundColor:"#059669",borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:8}}},scales:{y:{beginAtZero:true,max:100,grid:{color:"#f1f5f9"},ticks:{callback:v=>v+"%"}},x:{grid:{display:false}}}}});
  charts.status = new Chart($("statusChart"),{type:"doughnut",data:{labels:["PNS","PPPK","THL"],datasets:[{data:statusCounts,backgroundColor:["#059669","#60a5fa","#fbbf24"],borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:8}}}}});
  const commodities = [...new Set(d.areas.map(a=>a.commodity))];
  charts.commodity = new Chart($("commodityChart"),{type:"bar",data:{labels:commodities,datasets:[{label:"Jumlah desa/wilayah",data:commodities.map(c=>d.areas.filter(a=>a.commodity===c).length),backgroundColor:"#10b981",borderRadius:7}]},options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0},grid:{color:"#f1f5f9"}},y:{grid:{display:false}}}}});
}

function renderEmployees() {
  const q = $("employeeSearch").value.toLowerCase();
  const status = $("statusFilter").value, position = $("positionFilter").value;
  const rows = CWS_DATA.employees.filter(e => [e.nip,e.name,e.area].join(" ").toLowerCase().includes(q) && (!status || e.status===status) && (!position || e.position===position));
  $("employeeCount").textContent = `Menampilkan ${rows.length} dari ${CWS_DATA.employees.length} penyuluh`;
  $("employeeTable").innerHTML = rows.map(e=>`<tr><td>${escapeHTML(e.nip)}</td><td>${escapeHTML(e.name)}</td><td>${escapeHTML(e.position)}</td><td><span class="pill">${escapeHTML(e.status)}</span></td><td>${escapeHTML(e.area)}</td><td>${escapeHTML(e.contact)}</td></tr>`).join("") || `<tr><td colspan="6" class="py-8 text-center text-slate-400">Data tidak ditemukan</td></tr>`;
}
["employeeSearch","statusFilter","positionFilter"].forEach(id=>$(id).addEventListener(id==="employeeSearch"?"input":"change",renderEmployees));

function renderAreas() {
  const q = $("areaSearch").value.toLowerCase();
  const rows = CWS_DATA.areas.filter(a=>`${a.district} ${a.village} ${a.commodity}`.toLowerCase().includes(q));
  $("areaTable").innerHTML = rows.map(a=>`<tr><td>${escapeHTML(a.district)}</td><td>${escapeHTML(a.village)}</td><td>${fmt(a.groups)}</td><td><span class="pill">${escapeHTML(a.commodity)}</span></td><td>${fmt(a.hectares)}</td></tr>`).join("") || `<tr><td colspan="5" class="py-8 text-center text-slate-400">Data tidak ditemukan</td></tr>`;
  const districts = [...new Set(CWS_DATA.areas.map(a=>a.district))];
  $("areaSummary").innerHTML = districts.map(d=>{const list=CWS_DATA.areas.filter(a=>a.district===d);return `<div class="rounded-xl bg-slate-50 p-3"><div class="flex justify-between"><b class="text-sm">${escapeHTML(d)}</b><span class="text-xs text-emerald-700">${list.length} desa</span></div><p class="mt-1 text-xs text-slate-500">${fmt(list.reduce((s,a)=>s+a.groups,0))} kelompok tani • ${fmt(list.reduce((s,a)=>s+a.hectares,0))} Ha</p></div>`}).join("");
}
$("areaSearch").addEventListener("input",renderAreas);

function initMap() {
  if (!window.L) return;
  mapInstance = L.map("map").setView([-6.38,106.22],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(mapInstance);
  const markers = [];
  CWS_DATA.areas.forEach(a=>{
    const marker=L.marker([a.lat,a.lng]).addTo(mapInstance);
    marker.bindPopup(`<b>${escapeHTML(a.village)}</b><br>Kecamatan: ${escapeHTML(a.district)}<br>Poktan: ${a.groups}<br>Komoditas: ${escapeHTML(a.commodity)}<br>Luas: ${fmt(a.hectares)} Ha`);
    markers.push(marker);
  });
  if(markers.length) mapInstance.fitBounds(L.featureGroup(markers).getBounds().pad(.2));
}
function escapeHTML(value) {return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function downloadCSV() {
  const headers=["NIP","Nama","Jabatan","Status Kepegawaian","Wilayah Kerja","Kontak"];
  const rows=CWS_DATA.employees.map(e=>[e.nip,e.name,e.position,e.status,e.area,e.contact]);
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="data-kepegawaian-penyuluh.csv";a.click();URL.revokeObjectURL(url);
}
$("downloadEmployees").addEventListener("click",downloadCSV);
$("year").textContent=new Date().getFullYear();
renderDashboard();renderEmployees();renderAreas();initMap();
