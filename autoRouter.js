// 📁 autoRouter.js
// 자연어 메시지를 파싱하여 자동화 규칙 생성 및 저장

const { saveAutomationRule } = require('./automationStore');
const { DateTime } = require('luxon');

async function handleAutomationMessage(message) {
  const content = message.content.trim();
  const regex = /매일\s?(\d{1,2})시.*?(.+)알림/;
  const match = content.match(regex);

  if (!match) return false;

  const hour = match[1].padStart(2, '0');
  const time = `${hour}:00`;
  const actionMessage = match[2].trim();

  const rule = {
    user: message.author.username,
    time,
    timezone: 'Asia/Seoul',
    frequency: 'daily',
    channel: message.channel.id,
    message: `📢 ${actionMessage}`,
    type: '알림',
    createdAt: DateTime.now().toISO(),
  };

  await saveAutomationRule(rule);
  await message.reply(`✅ 자동화 알림을 매일 ${time}에 저장했습니다.`);
  return true;
}

module.exports = {
  handleAutomationMessage,
};
