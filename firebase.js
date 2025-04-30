// 📁 firebase.js
// Firebase Admin SDK 초기화 모듈
const admin = require('firebase-admin');

try {
  const decodedKey = Buffer.from(process.env.FIREBASE_KEY_JSON, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decodedKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin 초기화 성공');
} catch (err) {
  console.error('❌ Firebase Admin 초기화 실패:', err);
}

module.exports = admin.firestore();
console.log('프로젝트 ID:', admin.app().options.credential.projectId);
