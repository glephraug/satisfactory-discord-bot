
greets = new Map([
   ['porcupines', "I love you, merciful master."],
   ['sidfarkus', "Give me a call some time."],
   ['grimoire', "Nice beard!"],
   ['fil', "Also, you're handsome."]
]);

require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

var params = { InstanceIds: [ process.env.INSTANCE_ID ] };

client.on('ready', () => {
   console.log(`Logged in as ${client.user.tag}!`);
})

client.on("messageCreate", msg => {
   var greet = "Do I know you?";
   if(greets.has(msg.author.username)){
      greet = greets.get(msg.author.username);
   }
   if (msg.content === "!factory-status") {
      ec2.describeInstanceStatus(params, function(err, data) {
	 if (err) {
            console.log(err, err.stack);
            msg.reply("Error getting instance status. Sorry.");
	 } else {
            if (data.InstanceStatuses.length < 1) {
               msg.reply("Satisfactory server is down. " + greet);
            } else {
               msg.reply("Satisfactory server is " + data.InstanceStatuses[0].InstanceState.Name + ". " + greet);
            }
         }
      });
   } else if (msg.content === "!satisfactory") {
      console.log("Starting ec2 server")
      ec2.startInstances(params, function(err, data) {
         if (err) {
            console.log(err, err.stack);
            msg.reply("An error occured when starting the server! Please contact nobody@cares.com");
         } else {
            console.log("Success!");
	    msg.reply("The server is starting up. Have a fun time! " + greet);
         }
      });
   } else if (msg.content === "!unsatisfactory") {
      console.log("Killing ec2 server")
      ec2.stopInstances(params, function(err, data) {
         if (err) {
            console.log(err, err.stack);
            msg.reply("An error occured when trying to stop the server");
         } else {
            console.log("Success!");
            msg.reply("The server is off. You're so thoughtful! " + greet);
         }
      });
   }
})

client.login(process.env.DISCORD_TOKEN);

