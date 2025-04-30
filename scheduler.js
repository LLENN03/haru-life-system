const cron = require('node-cron');
const { getAllAutomationRules } = require('./automationStore');

module.exports = function startScheduler(client, db) {
  console.log('⏰ Initializing scheduler...');
  
  cron.schedule('* * * * *', async () => {
    try {
      console.log('🔄 Loading automation rules...');
      const rules = await getAllAutomationRules(db);
      console.log(`✅ Loaded ${rules.length} automation rules`);
      // Add your rule processing logic here
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  });
};
