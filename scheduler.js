// 📁 scheduler.js
const cron = require('node-cron');
const { getAllAutomationRules } = require('./automationStore');

function startScheduler(client) {
  console.log('✅ 자동화 스케줄러 작동 중 (매 분)');

  cron.schedule('* * * * *', async () => {
    console.log('🔍 [스케줄러] 매 분 실행됨 - 규칙 로딩 시도');

    try {
      const rules = await getAllAutomationRules();
      console.log('📦 [스케줄러] 규칙 개수:', rules.length);

      for (const rule of rules) {
        if (rule.type === 'weekly_cron' && rule.active) {
          const now = new Date();
          const day = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Seoul' }).toLowerCase();
          const hour = now.getHours().toString().padStart(2, '0');
          const minute = now.getMinutes().toString().padStart(2, '0');
          const currentTime = `${hour}:${minute}`;

          if (rule.day === day && rule.time === currentTime) {
            const channel = client.channels.cache.get(rule.channelId);
            if (channel) {
              channel.send(`⏰ [자동화 규칙 실행] ${rule.name} (${rule.target})`);
            } else {
              console.warn(`⚠️ [스케줄러] 채널 ID(${rule.channelId})를 찾을 수 없습니다.`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [스케줄러 오류] 규칙 로딩 실패:', error);
    }
  });
}

module.exports = startScheduler;
