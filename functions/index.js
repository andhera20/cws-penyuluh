const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.createCwsUser = onCall(async (request) => {
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Hanya Admin CWS yang dapat membuat akun.");
  }

  const { name, email, password, district } = request.data || {};
  if (![name, email, password, district].every(v => typeof v === "string" && v.trim())) {
    throw new HttpsError("invalid-argument", "Nama, email, kata sandi, dan kecamatan wajib diisi.");
  }
  if (password.length < 8) {
    throw new HttpsError("invalid-argument", "Kata sandi minimal 8 karakter.");
  }

  try {
    const user = await getAuth().createUser({
      email: email.trim(),
      password,
      displayName: name.trim(),
      disabled: false
    });
    await getAuth().setCustomUserClaims(user.uid, {
      role: "user",
      district: district.trim()
    });
    await db.collection("users").doc(user.uid).set({
      name: name.trim(),
      email: email.trim(),
      role: "user",
      district: district.trim(),
      createdAt: FieldValue.serverTimestamp()
    });
    return { uid: user.uid, email: user.email };
  } catch (error) {
    console.error(error);
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Email sudah digunakan.");
    }
    throw new HttpsError("internal", "Tidak dapat membuat akun. Periksa log Firebase Functions.");
  }
});
