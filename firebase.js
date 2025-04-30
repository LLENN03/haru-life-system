// 📁 firebase.js
const admin = require('firebase-admin');

let firestore;

try {
  const decodedKey = Buffer.from(process.env.FIREBASE_KEY_JSON, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decodedKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log('✅ Firebase Admin 초기화 성공');
  console.log('Firestore 설정:', admin.app().options);

  firestore = admin.firestore();


} catch (err) {
  console.error('❌ Firebase Admin 초기화 실패:', err);
}

module.exports = firestore;
