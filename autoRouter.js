module.exports = {
  handleAutomationMessage: async (message, db) => {
    try {
      // Example automation logic
      if (message.content.toLowerCase().startsWith('!todo')) {
        const todos = await db.collection('todos').get();
        await message.reply(`You have ${todos.size} pending tasks`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Automation error:', error);
      return false;
    }
  }
};
