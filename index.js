require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Haru is online as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        return message.channel.send('pong! (테스트 성공 🟢)');
    }

    // GPT 대화 예시
    if (message.content.startsWith('하루야') || message.mentions.has(client.user)) {
        message.channel.send('GPT 대화 기능이 곧 연결됩니다... 🤖');
    }
});

client.login(process.env.DISCORD_TOKEN);
