// 📁 automationStore.js
const db = require('./firebase');
const COLLECTION_NAME = 'automation_rules';

async function getAllAutomationRules() {
  try {
    console.log(`📡 Firestore 연결 테스트 시작 (${COLLECTION_NAME})`);

    const snapshot = await db.collection(COLLECTION_NAME).get();
    console.log('✅ [자동화 규칙] 문서 개수:', snapshot.size);

    const rules = [];
    snapshot.forEach((doc) => {
      try {
        const data = doc.data();
        console.log('📘 규칙 문서:', doc.id, data);
        rules.push(data);
      } catch (innerErr) {
        console.error(`❌ [문서 파싱 실패] ${doc.id}:`, innerErr);
      }
    });

    return rules;

  } catch (err) {
    console.error('❌ [자동화 규칙] Firestore 규칙 로딩 실패:', err);
    throw err;
  }
}

async function saveAutomationRule(rule) {
  const ref = db.collection(COLLECTION_NAME).doc();
  await ref.set(rule);
  return ref.id;
}

module.exports = {
  getAllAutomationRules,
  saveAutomationRule,
};
