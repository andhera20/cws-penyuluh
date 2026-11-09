import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
let auth, db, functions, currentUser, profile, map, charts = {};
const configReady = firebaseConfig.apiKey !== "ISI_API_KEY" && firebaseConfig.projectId !== "NAMA-PROJECT";

function showLogin() { $("loginView").classList.remove("hidden"); $("appView").classList.add("hidden"); }
function showApp() { $("loginView").classList.add("hidden"); $("appView").classList.remove("hidden"); }
function message(el, text, error=false) { el.textContent=text; el.className=`mt-3 text-sm ${error?"text-red-600":"text-emerald-700"}`; }
function safe(v="") { return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmt(v) { return new Intl.NumberFormat("id-ID").format(v||0); }

if (!configReady) {
  $("loginError").textContent = "Firebase belum dikonfigurasi. Isi assets/js/firebase-config.js sesuai panduan README.md.";
  $("loginError").classList.remove("hidden");
} else {
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app); db=getFirestore(app); functions=getFunctions(app);
  onAuthStateChanged(auth, async user => {
    if (!user) { currentUser=null; profile=null; showLogin(); return; }
    currentUser=user;
    try {
      const snap=await getDoc(doc(db,"users",user.uid));
      if (!snap.exists() || !["admin","user"].includes(snap.data().role)) {
        await signOut(auth);
        $("loginError").textContent="Profil akun belum disiapkan administrator. Hubungi admin CWS.";
        $("loginError").classList.remove("hidden"); return;
      }
      profile=snap.data();
      showApp(); await initializeWorkspace();
    } catch(err) { console.error(err); await signOut(auth); alert("Gagal memuat profil. Periksa konfigurasi dan Firestore Rules."); }
  });
}

$("loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); if(!configReady)return;
  $("loginButton").disabled=true; $("loginButton").textContent="Memeriksa...";
  $("loginError").classList.add("hidden");
  try { await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value); }
  catch(err) { $("loginError").textContent=authError(err.code); $("loginError").classList.remove("hidden"); }
  finally { $("loginButton").disabled=false; $("loginButton").textContent="Masuk"; }
});
function authError(code) {
  const map={"auth/invalid-credential":"Email atau kata sandi tidak sesuai.","auth/user-disabled":"Akun dinonaktifkan.","auth/too-many-requests":"Terlalu banyak percobaan. Coba beberapa saat lagi.","auth/network-request-failed":"Periksa koneksi internet."};
  return map[code] || "Login gagal. Periksa email, kata sandi, dan konfigurasi Firebase.";
}
$("togglePassword").addEventListener("click",()=>{const p=$("loginPassword");p.type=p.type==="password"?"text":"password";$("togglePassword").textContent=p.type==="password"?"Lihat":"Sembunyikan";});
$("logoutButton").addEventListener("click",()=>signOut(auth));
$("year").textContent=new Date().getFullYear();

async function initializeWorkspace() {
  $("userName").textContent=profile.name || currentUser.email;
  $("userRole").textContent=profile.role==="admin"?"Administrator":"Penyuluh • "+(profile.district||"Wilayah belum diatur");
  $("scopeText").textContent=profile.role==="admin"?"Menampilkan data seluruh wilayah.":"Wilayah kerja: "+(profile.district||"Belum ditentukan");
  document.querySelectorAll(".admin-only").forEach(el=>el.classList.toggle("hidden",profile.role!=="admin"));
  document.querySelectorAll(".nav-link").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
  $("menuToggle").onclick=()=>{$("sidebar").classList.toggle("-translate-x-full");$("sidebarOverlay").classList.toggle("hidden");};
  $("sidebarOverlay").onclick=()=>{$("sidebar").classList.add("-translate-x-full");$("sidebarOverlay").classList.add("hidden");};
  await Promise.all([loadEmployees(),loadAreas()]);
  renderDashboard();
  if(profile.role==="admin") setupCreateUser();
}
function showPage(page) {
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $("page-"+page).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("pageTitle").textContent=({dashboard:"Dashboard Data",kepegawaian:"Data Kepegawaian",wilayah:"Data Wilayah",akun:"Manajemen Akun"})[page];
  $("sidebar").classList.add("-translate-x-full"); $("sidebarOverlay").classList.add("hidden");
  if(page==="wilayah" && map) setTimeout(()=>map.invalidateSize(),100);
}

let employeeRows=[], areaRows=[];
async function loadEmployees() {
  let qy=collection(db,"employees");
  if(profile.role!=="admin") qy=query(qy,where("uid","==",currentUser.uid));
  const snap=await getDocs(qy); employeeRows=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderEmployees();
}
function renderEmployees() {
  const term=($("employeeSearch").value||"").toLowerCase();
  const rows=employeeRows.filter(e=>[e.nip,e.name,e.position,e.district].join(" ").toLowerCase().includes(term));
  $("employeeTable").innerHTML=rows.map(e=>`<tr><td>${safe(e.nip)}</td><td>${safe(e.name)}</td><td>${safe(e.position)}</td><td><span class="pill">${safe(e.status)}</span></td><td>${safe(e.district)}</td><td>${safe(e.contact)}</td></tr>`).join("") || `<tr><td colspan="6" class="py-8 text-center text-slate-400">Belum ada data atau tidak ada hasil.</td></tr>`;
}
$("employeeSearch").addEventListener("input",renderEmployees);

async function loadAreas() {
  let qy=collection(db,"areas");
  if(profile.role!=="admin") qy=query(qy,where("district","==",profile.district));
  const snap=await getDocs(qy); areaRows=snap.docs.map(d=>({id:d.id,...d.data()}));
  $("areaTable").innerHTML=areaRows.map(a=>`<tr><td>${safe(a.district)}</td><td>${safe(a.village)}</td><td>${fmt(a.groups)}</td><td>${safe(a.commodity)}</td><td>${fmt(a.hectares)}</td></tr>`).join("") || `<tr><td colspan="5" class="py-8 text-center text-slate-400">Belum ada data wilayah.</td></tr>`;
  if(window.L) {
    if(map) map.remove();
    map=L.map("map").setView([-6.35,106.2],10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
    const marks=[];
    areaRows.forEach(a=>{if(Number.isFinite(a.lat)&&Number.isFinite(a.lng)){const m=L.marker([a.lat,a.lng]).addTo(map).bindPopup(`<b>${safe(a.village)}</b><br>${safe(a.district)}<br>${safe(a.commodity||"")}`);marks.push(m);}});
    if(marks.length)map.fitBounds(L.featureGroup(marks).getBounds().pad(.2));
  }
}
function renderDashboard() {
  const totalGroups=areaRows.reduce((s,a)=>s+(Number(a.groups)||0),0);
  const totalArea=areaRows.reduce((s,a)=>s+(Number(a.hectares)||0),0);
  $("statPenyuluh").textContent=fmt(employeeRows.length);
  $("statLahan").innerHTML=`${fmt(totalArea)} <small>Ha</small>`;
  $("statPoktan").textContent=fmt(totalGroups);
  $("statCapaian").textContent="—";
  if(window.Chart) {
    Object.values(charts).forEach(c=>c.destroy());
    charts.status=new Chart($("statusChart"),{type:"doughnut",data:{labels:["PNS","PPPK","THL"],datasets:[{data:["PNS","PPPK","THL"].map(s=>employeeRows.filter(e=>e.status===s).length),backgroundColor:["#059669","#60a5fa","#fbbf24"],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}}}});
    charts.program=new Chart($("programChart"),{type:"bar",data:{labels:["Luas Tambah Tanam","Optimasi Lahan","Perbenihan","Irigasi Perpipaan"],datasets:[{label:"Realisasi (%)",data:[0,0,0,0],backgroundColor:"#059669",borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true,max:100}}}});
  }
}
function setupCreateUser() {
  $("createUserForm").addEventListener("submit",async e=>{
    e.preventDefault(); const btn=$("createUserButton");btn.disabled=true;message($("createUserMessage"),"Membuat akun...");
    try {
      const createCwsUser=httpsCallable(functions,"createCwsUser");
      await createCwsUser({name:$("newName").value.trim(),email:$("newEmail").value.trim(),password:$("newPassword").value,district:$("newDistrict").value.trim()});
      $("createUserForm").reset(); message($("createUserMessage"),"Akun berhasil dibuat. Sampaikan email dan kata sandi awal secara aman kepada pengguna.");
    } catch(err) {console.error(err);message($("createUserMessage"),err.message||"Gagal membuat akun. Pastikan Cloud Function sudah di-deploy.",true);}
    finally {btn.disabled=false;}
  });
}
