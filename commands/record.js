const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('하루-기록')
    .setDescription('오늘 하루 기록을 조회합니다.'),
  execute: async (interaction) => {
    await interaction.reply('오늘 기록 보여드릴게요.');
  }
};
