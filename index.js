
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { Configuration, OpenAIApi } = require('openai');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const configuration = new Configuration({ apiKey: 'YOUR_OPENAI_API_KEY' });
const openai = new OpenAIApi(configuration);

const TODO_CHANNEL_NAME = "할일";
const HARU_CATEGORY_NAME = "하루 집사";

client.once(Events.ClientReady, async () => {
  console.log(`✅ Haru is online as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken('YOUR_DISCORD_BOT_TOKEN');
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, 'YOUR_GUILD_ID'),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '명령 실행 중 오류가 발생했어요.', ephemeral: true });
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  const isInTodo = message.channel.name === TODO_CHANNEL_NAME;
  const isInHaruCategory = message.channel.parent && message.channel.parent.name === HARU_CATEGORY_NAME;

  if (isInTodo) {
    console.log(`[할일 기록 감지] ${message.author.username}: ${message.content}`);
    // TODO: 자동 저장 → Firebase 연동 후 처리
  }

  if (isInHaruCategory || message.mentions.has(client.user)) {
    const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
    if (userMessage.length === 0) return;
    await message.channel.sendTyping();
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: userMessage }]
      });
      await message.reply(completion.data.choices[0].message.content);
    } catch (err) {
      console.error(err);
      await message.reply('죄송해요, 지금은 대답을 못하고 있어요.');
    }
  }
});

client.login('YOUR_DISCORD_BOT_TOKEN');
