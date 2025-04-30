// automationStore.js
const axios = require('axios');

const COLLECTION_NAME = 'automation_rules';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const ACCESS_TOKEN = process.env.FIREBASE_ACCESS_TOKEN; // 환경변수에 서비스계정 access_token 미리 발급

async function getAllAutomationRules() {
  try {
    console.log(`📡 Firestore REST API 호출 시작 (${COLLECTION_NAME})`);

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}`;
    
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      }
    });

    const rules = res.data.documents.map((doc) => {
      const fields = doc.fields;
      const rule = {};

      for (let key in fields) {
        const val = Object.values(fields[key])[0];
        rule[key] = val;
      }

      return rule;
    });

    console.log('✅ [자동화 규칙] 문서 개수:', rules.length);
    return rules;

  } catch (err) {
    console.error('❌ [자동화 규칙] Firestore 규칙 로딩 실패:', err.response?.data || err);
    throw err;
  }
}

async function saveAutomationRule(rule) {
  throw new Error('⚠️ saveAutomationRule은 REST API 미구현');
}

// ✅ 여기 추가
async function testDirectDocAccess() {
  console.log('🔍 [테스트] 문서 목록 불러오기 시작');
  await getAllAutomationRules();
}

module.exports = {
  getAllAutomationRules,
  saveAutomationRule,
  testDirectDocAccess // ✅ export 추가
};
