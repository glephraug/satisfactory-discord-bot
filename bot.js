
greets = new Map([
   ['porcupines', "I need a drink."],
   ['sidfarkus', "What a nice young man."],
   ['grimoire', "Nice beard!"],
   ['xeno28', "Also, you're handsome."]
]);

require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

const SSH = require('ssh2')
var fs = require('fs')

var params = { InstanceIds: [process.env.INSTANCE_ID] };

function server_status(msg, text) {
   const conn = new SSH.Client();
   conn.on('error', error => {
      msg.reply(text + "Cannot connect to server")
   });
   conn.on('ready', () => {
      var data = '';
      conn.exec('sh /home/ubuntu/aws-game-server/status.sh', (err, stream) => {
         stream.on('close', (code, signal) => {
            msg.reply(text + data)
         }).on('data', stdout => {
            data += stdout
         });
      });
   }).connect({
      host: '3.19.154.252',
      port: 22,
      readyTimeout: 3000,
      username: 'ubuntu',
      privateKey: fs.readFileSync('/home/ubuntu/discord-control.pem')
   });
}

function server_run(msg, name, text) {
   const conn = new SSH.Client();
   conn.on('error', error => {
      msg.reply("Failed to start " + name + ", cannot connect to server. Oh bother.")
   });
   conn.on('ready', () => {
      conn.exec("sh /home/ubuntu/aws-game-server/run.sh " + name, (err, stream) => {
         stream.on('close', (code, signal) => {
            msg.reply(text)
         });
      });
   }).connect({
      host: '3.19.154.252',
      port: 22,
      readyTimeout: 3000,
      username: 'ubuntu',
      privateKey: fs.readFileSync('/home/ubuntu/discord-control.pem')
   });
}

client.on('ready', () => {
   console.log(`Logged in as ${client.user.tag}!`);
})

client.on("messageCreate", msg => {
   var greet = "Do I know you?";
   if (greets.has(msg.author.username)) {
      greet = greets.get(msg.author.username);
   }
   if (msg.content === "!server-status") {
      ec2.describeInstanceStatus(params, function (err, data) {
         if (err) {
            console.log(err, err.stack);
            msg.reply("Error getting instance status. Sorry.");
         } else {
            if (data.InstanceStatuses.length < 1) {
               msg.reply("Server is down. " + greet);
            } else {
               server_status(msg, "Server is " + data.InstanceStatuses[0].InstanceState.Name + ". ")
            }
         }
      });
   } else if (msg.content === "!server-start") {
      console.log("Starting ec2 server");
      ec2.startInstances(params, function (err, data) {
         if (err) {
            console.log(err, err.stack);
            msg.reply("An error occured when starting the server! Please contact nobody@cares.com");
         } else {
            console.log("Success!");
            msg.reply("The server is starting up. Please choose a game. Have a fun time! " + greet);
         }
      });
   } else if (msg.content === "!server-stop") {
      console.log("Killing ec2 server");
      ec2.stopInstances(params, function (err, data) {
         if (err) {
            console.log(err, err.stack);
            msg.reply("An error occured when trying to stop the server");
         } else {
            console.log("Success!");
            msg.reply("The server is off. You're so thoughtful! " + greet);
         }
      });
   } else if (msg.content === "!server-satisfactory") {
      server_run(msg, "satisfactory", "Oh ho, you wanna make them items? " + greet);
   } else if (msg.content === "!server-valheim") {
      server_run(msg, "valheim", "How soft your fields so green can whisper tales of gore. " + greet);
   } else if (msg.content === "fat") {
      msg.reply("no u");
   } else if (msg.content === "luv u") {
      msg.reply("Oh, I luv u 2 " + msg.author.username);
   } else if (msg.isMemberMentioned(client.user)) {
      msg.reply("You have mentioned my name and accessed helpful help! Valid commands are !server-start !server-stop !server-status." +
         "After starting the server, select the game to host with one of !server-satisfactory !server-valheim. " +
         "Only one game at a time! When you start a game all others will be shut down.");
   }
})

client.login(process.env.DISCORD_TOKEN);

