// 📁 firebase.js
// Firebase Admin SDK 초기화 모듈

const admin = require('firebase-admin');

// 도련님이 제공하신 service account 키 경로 또는 환경변수로부터 로딩
const serviceAccount = require('./serviceAccountKey.json'); // 키 파일 이름이 이 파일과 동일해야 함

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

module.exports = admin.firestore();
