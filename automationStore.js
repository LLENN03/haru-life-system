module.exports = {
  getAllAutomationRules: async (db) => {
    try {
      const snapshot = await db.collection('automation_rules').get();
      
      if (snapshot.empty) {
        console.warn('⚠️ No automation rules found');
        return [];
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('🔥 Firestore Error:', error);
      throw error;
    }
  },

  testDirectDocAccess: async (db) => {
    try {
      const testDoc = await db.collection('automation_rules').doc('test').get();
      console.log(testDoc.exists ? '✅ Test doc exists' : '⚠️ Test doc missing');
    } catch (error) {
      console.error('❌ Test access failed:', error);
    }
  }
};
