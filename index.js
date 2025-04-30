const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const OpenAI = require('openai');

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

const openai = new OpenAI({
  apiKey: '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',
});

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

  const rest = new REST({ version: '10' }).setToken('MTM2NjcwNjQ1ODMwNDk3MDc2Mw.GigUQw.eR2X1JVcuT9TQ8zCiHA6emyNPFGdhQm_n2d-hY');
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, '1366991158374305824'),
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
      const channel = client.channels.cache.get('공지');
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
      const selectedModel = await getBestModel();
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: [{ role: 'user', content: userMessage }],
      });

      await message.reply(completion.choices[0].message.content);
    } catch (err) {
      console.error(err);
      await message.reply('죄송해요, 지금은 대답을 못하고 있어요.');
    }
  }
});

client.login('MTM2NjcwNjQ1ODMwNDk3MDc2Mw.GigUQw.eR2X1JVcuT9TQ8zCiHA6emyNPFGdhQm_n2d-hY');
