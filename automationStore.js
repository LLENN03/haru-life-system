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

// ✅ 테스트용: 특정 문서 직접 접근해서 존재 여부 확인
async function testDirectDocAccess() {
  try {
    const collectionRef = await db.collection('automation_rules').get();

    console.log('📂 전체 문서 목록');
    collectionRef.forEach((doc) => {
      console.log(`- ${doc.id}`);
    });
  } catch (err) {
    console.error('❌ [테스트] 문서 목록 불러오기 실패:', err);
  }
}


// ❗ 이 함수는 index.js에서 한 번 실행해줘야 해!
// 예: index.js 맨 아래에
// const { testDirectDocAccess } = require('./automationStore');
// testDirectDocAccess();

module.exports = {
  getAllAutomationRules,
  saveAutomationRule,
  testDirectDocAccess, // 👈 추가!
};
