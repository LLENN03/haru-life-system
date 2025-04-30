require('dotenv').config();

// ================= Firebase Admin Initialization =================
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const db = admin.firestore();
db.settings({ databaseId: 'asia-southeast1' });

// ================= Discord Client Setup =================
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const OpenAI = require('openai');
const startScheduler = require('./scheduler');
const { handleAutomationMessage } = require('./autoRouter');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// ================= Core Functionality =================
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

client.once(Events.ClientReady, async () => {
  console.log(`✅ Haru is online as ${client.user.tag}`);
  
  // Initialize Scheduler with Firestore instance
  startScheduler(client, db);

  // Register Commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Command registration failed:', error);
  }
});

// ================= Message Handling =================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  
  // Automation Handling
  if (await handleAutomationMessage(message, db)) return;
  
  // GPT Response
  const userMessage = message.content.replace(/<@!?\d+>/g, '').trim();
  if (!userMessage) return;

  try {
    await message.channel.sendTyping();
    const completion = await openai.chat.completions.create({
      model: await getBestModel(openai),
      messages: [{
        role: 'system',
        content: 'You are Haru, a meticulous and knowledgeable butler.'
      }, {
        role: 'user',
        content: userMessage
      }]
    });
    await message.reply(completion.choices[0].message.content);
  } catch (error) {
    console.error('GPT Error:', error);
    await message.reply('An error occurred while processing your request.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ================= Utilities =================
async function getBestModel(openai) {
  const priority = ['gpt-4o', 'gpt-4-turbo', 'gpt-4'];
  try {
    const models = await openai.models.list();
    return priority.find(model => 
      models.data.some(m => m.id === model)
    ) || 'gpt-3.5-turbo';
  } catch (error) {
    return 'gpt-3.5-turbo';
  }
}
