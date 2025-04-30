// 📁 firebase.js
const admin = require('firebase-admin');

let db = null;

try {
  const decodedKey = Buffer.from(process.env.FIREBASE_KEY_JSON, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decodedKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin 초기화 성공');
  console.log('프로젝트 ID:', admin.app().options.credential.projectId);

  db = admin.firestore();
} catch (err) {
  console.error('❌ Firebase Admin 초기화 실패:', err);
}

module.exports = db;
