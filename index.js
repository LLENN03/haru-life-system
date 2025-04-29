require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Haru is online as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.channel.send('pong! (테스트 성공 🟢)');
    }
});

client.login(process.env.DISCORD_TOKEN);
