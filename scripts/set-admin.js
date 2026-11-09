// Jalankan LOKAL di komputer administrator, jangan unggah service-account.json ke GitHub.
const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json"); // unduh dari Firebase Console > Project settings > Service accounts
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Pemakaian: node scripts/set-admin.js admin@email.id");
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: "admin", district: "*" });
  await admin.firestore().collection("users").doc(user.uid).set({
    name: user.displayName || "Administrator",
    email: user.email,
    role: "admin",
    district: "*"
  }, { merge: true });
  console.log("Role admin berhasil diberikan untuk", email);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
