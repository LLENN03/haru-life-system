const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('하루-테스트')
    .setDescription('Haru Bot 응답 테스트'),
  execute: async (interaction) => {
    await interaction.reply('테스트 성공 ✅');
  }
};
