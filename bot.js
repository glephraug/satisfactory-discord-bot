
require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
   console.log(`Logged in as ${client.user.tag}!`);
})

client.on("messageCreate", msg => {
   if (msg.content === "!factory-status") {
      msg.reply("I have no idea");
   } else if (msg.content === "!satisfactory") {
      msg.reply("Start it yourself");
   } else if (msg.content === "!unsatisfactory") {
      msg.reply("Not my problem");
   }
})

client.login(process.env.DISCORD_TOKEN);

