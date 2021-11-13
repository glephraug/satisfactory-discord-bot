
require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

client.on('ready', () => {
   console.log(`Logged in as ${client.user.tag}!`);
})

client.on("messageCreate", msg => {
   if (msg.content === "!factory-status") {
      var params = { InstanceIds: [ process.env.INSTANCE_ID ] };
      ec2.describeInstanceStatus(params, function(err, data) {
	 if (err) {
            console.log(err, err.stack);
            msg.reply("Error getting instance status. Sorry.");
	 } else {
            if (data.InstanceStatuses.length < 1) {
               msg.reply("Satisfactory server is down");
            } else {
               msg.reply("Satisfactory server is " + data.InstanceStatuses[0].InstanceState.Name);
            }
         }
      });
   } else if (msg.content === "!satisfactory") {
      console.log("Starting ec2 server")
      msg.reply("Start it yourself");
   } else if (msg.content === "!unsatisfactory") {
      console.log("Killing ec2 server")
      msg.reply("Not my problem");
   }
})

client.login(process.env.DISCORD_TOKEN);

