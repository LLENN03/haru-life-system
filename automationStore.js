// 📁 automationStore.js
// Firestore에서 자동화 규칙을 저장하고 불러오는 함수

const db = require('./firebase');
const COLLECTION_NAME = 'automation_rules';

async function getAllAutomationRules() {
  const snapshot = await db.collection(COLLECTION_NAME).get();
  const rules = [];
  snapshot.forEach((doc) => {
    rules.push(doc.data());
  });
  return rules;
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
