const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('하루-체크인')
    .setDescription('오늘 하루를 체크인합니다.'),
  execute: async (interaction) => {
    await interaction.reply('기록을 시작합니다!');
  }
};
