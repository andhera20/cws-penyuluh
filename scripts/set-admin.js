// Firebase Admin SDK modular
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

// Service Account
const serviceAccount = require("../service-account.json");

// Inisialisasi Firebase
const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const email = (process.argv[2] || "").trim();

  if (!email) {
    throw new Error(
      "Pemakaian: node scripts/set-admin.js admin@email.id"
    );
  }

  // Cari akun berdasarkan email
  const user = await auth.getUserByEmail(email);

  // Pertahankan custom claims yang sudah ada
  const existingClaims = user.customClaims || {};

  // Berikan hak akses Admin
  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    role: "admin",
    district: "*"
  });

  // Simpan data Admin ke Firestore
  await db.collection("users").doc(user.uid).set({
    name: user.displayName || "Administrator",
    email: user.email,
    role: "admin",
    district: "*"
  }, { merge: true });

  console.log("--------------------------------");
  console.log("BERHASIL!");
  console.log("Email :", email);
  console.log("Role  : ADMIN");
  console.log("District : *");
  console.log("--------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("GAGAL MEMBERIKAN ROLE ADMIN:");
    console.error(error);
    process.exit(1);
  });
