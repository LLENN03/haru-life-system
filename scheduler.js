// 📁 scheduler.js
// 자동화 스케줄러 - 매 분마다 조건 검사 및 실행

const cron = require('node-cron');
const { getAllAutomationRules } = require('./automationStore');
const { DateTime } = require('luxon');

module.exports = function startScheduler(client) {
  cron.schedule('* * * * *', async () => {
    try {
      const rules = await getAllAutomationRules();
      const now = DateTime.now().setZone('Asia/Seoul');
      const currentTime = now.toFormat('HH:mm');

      for (const rule of rules) {
        const ruleTime = rule.time;
        const frequency = rule.frequency || 'daily';

        if (ruleTime === currentTime && frequency === 'daily') {
          const channel = client.channels.cache.get(rule.channel);
          if (channel) {
            channel.send(rule.message);
          }
        }
      }
    } catch (error) {
      console.error('자동화 스케줄 실행 오류:', error);
    }
  });

  console.log('✅ 자동화 스케줄러 작동 중 (매 분)');
};
