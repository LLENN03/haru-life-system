require('dotenv').config(); // .env 설정을 읽어옵니다

const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const OpenAI = require('openai');
const startScheduler = require('./scheduler');
const { handleAutomationMessage } = require('./autoRouter');

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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const modelPriority = ['gpt-4o', 'gpt-4-turbo', 'gpt-4'];

async function getBestModel() {
  try {
    const list = await openai.models.list();
    const available = list.data.map(m => m.id);

    for (const model of modelPriority) {
      if (available.includes(model)) return model;
    }

    // fallback 자동 정렬
    const gptModels = available.filter(id => id.startsWith('gpt-4'));
    return gptModels.sort().reverse()[0] || 'gpt-3.5-turbo';
  } catch (error) {
    console.error('모델 선택 실패:', error);
    return 'gpt-3.5-turbo';
  }
}



const TODO_CHANNEL_NAME = "할일";
const HARU_CATEGORY_NAME = "하루 집사";

client.once(Events.ClientReady, async () => {
  console.log(`✅ Haru is online as ${client.user.tag}`);

  // 🔁 스케줄러 시작
  startScheduler(client); // ✅ 이 줄 추가

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

// 매주 월요일 오전 9시에 모델 목록 확인 (Asia/Seoul 기준)
const cron = require('node-cron');
const knownModels = new Set(); // 처음엔 비어 있음

cron.schedule('0 9 * * 1', async () => {
  try {
    const list = await openai.models.list();
    const newModels = list.data
      .map(m => m.id)
      .filter(id => id.startsWith('gpt-4') && !knownModels.has(id));

    newModels.forEach(m => knownModels.add(m));

    if (newModels.length > 0) {
      const channel = client.channels.cache.get(process.env.ANNOUNCE_CHANNEL_ID);
      if (channel) {
        channel.send(`📢 도련님, 새로운 GPT 모델이 나왔습니다: \n\`\`\`${newModels.join('\n')}\`\`\``);
      }
    }
  } catch (err) {
    console.error('모델 자동 감지 실패:', err);
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

  const excluded = ['공지', '비용-보고', '하루-시스템로그'];
  if (excluded.includes(message.channel.name)) return;

  // ✅ 자동화 명령 처리 먼저 수행
  if (await handleAutomationMessage(message)) return;

  const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
  if (userMessage.length === 0) return;

  await message.channel.sendTyping();

  try {
    const selectedModel = await getBestModel();
    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: '당신은 중년의 만능 집사 Haru입니다.' },
        { role: 'user', content: userMessage }
      ]
    });

    await message.reply(completion.choices[0].message.content);
  } catch (err) {
    console.error(err);
    await message.reply('죄송합니다, 오류 상태입니다.');
  }
});


client.login(process.env.DISCORD_BOT_TOKEN);
