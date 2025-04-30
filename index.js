require('dotenv').config(); // Load .env

// ================= Firebase Admin Setup =================
const admin = require('firebase-admin');

// Initialize Firebase Admin with Singapore region
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

// Configure Firestore for Singapore region
const db = admin.firestore();
db.settings({ databaseId: 'asia-southeast1' }); // ⚠️ Confirm exact region in Firebase Console

// ================= Discord Bot Setup =================
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const OpenAI = require('openai');
const startScheduler = require('./scheduler');
const { handleAutomationMessage } = require('./autoRouter');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Load commands
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

// ================= Core Functionality =================
const modelPriority = ['gpt-4o', 'gpt-4-turbo', 'gpt-4'];

async function getBestModel() {
  try {
    const list = await openai.models.list();
    const available = list.data.map(m => m.id);
    for (const model of modelPriority) {
      if (available.includes(model)) return model;
    }
    const gptModels = available.filter(id => id.startsWith('gpt-4'));
    return gptModels.sort().reverse()[0] || 'gpt-3.5-turbo';
  } catch (error) {
    console.error('Model selection failed:', error);
    return 'gpt-3.5-turbo';
  }
}

// ================= Event Handlers =================
client.once(Events.ClientReady, async () => {
  console.log(`✅ Haru is online as ${client.user.tag}`);

  // Start scheduler with Firestore instance
  startScheduler(client, db); // Pass db to scheduler

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('❌ Command registration error:', error);
  }
});

// ================= Scheduled Tasks =================
const cron = require('node-cron');
const knownModels = new Set();

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
        channel.send(`📢 New GPT models available:\n\`\`\`${newModels.join('\n')}\`\`\``);
      }
    }
  } catch (err) {
    console.error('Model detection failed:', err);
  }
});

// ================= Interaction Handling =================
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Command execution failed', ephemeral: true });
  }
});

// ================= Message Handling =================
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  const excluded = ['공지', '비용-보고', '하루-시스템로그'];
  if (excluded.includes(message.channel.name)) return;
  if (await handleAutomationMessage(message)) return;
  
  const userMessage = message.content.replace(/<@!?\d+>/, '').trim();
  if (!userMessage) return;

  await message.channel.sendTyping();
  try {
    const selectedModel = await getBestModel();
    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: 'You are Haru, a versatile butler.' },
        { role: 'user', content: userMessage }
      ]
    });
    await message.reply(completion.choices[0].message.content);
  } catch (err) {
    console.error(err);
    await message.reply('Error processing request');
  }
});

// ================= Startup =================
client.login(process.env.DISCORD_BOT_TOKEN);

// ================= Firestore Test =================
const { testDirectDocAccess } = require('./automationStore');
// Pass db to test function
testDirectDocAccess(db);
