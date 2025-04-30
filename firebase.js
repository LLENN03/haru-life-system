// 📁 firebase.js
const admin = require('firebase-admin');

try {
  const decodedKey = Buffer.from(process.env.FIREBASE_KEY_JSON, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decodedKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log('✅ Firebase Admin 초기화 성공');
  console.log('Firestore 설정:', admin.app().options);
} catch (err) {
  console.error('❌ Firebase Admin 초기화 실패:', err);
}

const firestore = admin.firestore();

// 🔥 리전 명시적으로 설정
firestore.settings({
  host: `${serviceAccount.project_id}.asia-southeast1.firebasedatabase.app`,
  ssl: true,
});

module.exports = firestore;
