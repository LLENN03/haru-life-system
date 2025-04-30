// 📁 firebase.js
// Firebase Admin SDK 초기화 모듈
var admin = require("firebase-admin");

var serviceAccount = require("./haru-life-system-firebase-adminsdk-fbsvc-e8434c1739.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin.firestore();
