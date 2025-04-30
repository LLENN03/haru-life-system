// 📁 automationStore.js
const db = require('./firebase');
const COLLECTION_NAME = 'automation_rules';

async function getAllAutomationRules() {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    console.log('✅ [자동화 규칙] 문서 개수:', snapshot.size); // 🔍 추가

    const rules = [];
    snapshot.forEach((doc) => {
      console.log('📄 [자동화 규칙] 문서 로드됨:', doc.id, doc.data()); // 🔍 추가
      rules.push(doc.data());
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
