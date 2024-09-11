
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
const fs = require('fs')
const openai = require('openai');
const util = require('node:util');

const openai = new OpenAI();
const params = { InstanceIds: [process.env.INSTANCE_ID] };
const messages = [{
   role: 'user',
   content: ''
}];

function server_status(msg, text) {
   const conn = new SSH.Client();
   conn.on('error', error => {
      msg.reply(text + "Cannot connect to server")
   });
   conn.on('ready', () => {
      var data = '';
      conn.exec('sh /home/ubuntu/aws-game-server/status.sh', (err, stream) => {
         stream.on('close', (code, signal) => {
            msg.reply(text + data);
            conn.end();
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
      msg.reply(text);
      conn.exec("sh /home/ubuntu/aws-game-server/run.sh " + name, (err, stream) => {
         stream.on('close', (code, signal) => {
            conn.end();
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
      console.log("Trying to start satisfactory");
      server_run(msg, "satisfactory", "Oh ho, you wanna make them items? " + greet);
   } else if (msg.content === "!server-valheim") {
      console.log("Trying to start valheim");
      server_run(msg, "valheim", "How soft your fields so green can whisper tales of gore. " + greet);
   } else if (msg.content === "fat") {
      msg.reply("no u");
   } else if (msg.content === "luv u") {
      msg.reply("Oh, I luv u 2 " + msg.author.username);
   } else if (msg.mentions.has(client.user)) {
      msg.reply("You have mentioned my name and accessed helpful help! \nValid commands are !server-start !server-stop !server-status. \n" +
         "After starting the server, select the game to host with one of !server-satisfactory !server-valheim. \n" +
         "Only one game at a time! When you start a game all others will be shut down. ");
   } else if (msg?.channel?.name === 'beep-beep-bots') {
      // check to make sure we actually have a key configured before we bother
      const { OPENAI_API_KEY } = process.env;
      if (OPENAI_API_KEY) {
         messages.push({role: 'user', content: msg.content});

         console.log(`talking to chatgpt with ${messages.length} context messages...`)
         openai.chat.completions.create({messages, model: 'gpt-4o-mini'}).then(reply => {
            const gptMessage = reply?.choices?.[0].message;
            if (gptMessage && gptMessage.content) {
               messages.push(gptMessage);
               msg.reply(gptMessage.content);
            } else {
               msg.reply(`There was some kind of error talking to chat gpt sry ${util.inspect(reply)}`);
            }
         }).catch(err => console.error(`errors talking to openai ${util.inspect(err)}`));

         while (messages.length > (process.env.MAX_MESSAGE_CONTEXT ?? 5000)) {
            messages.unshift();
         }
      }
   }
})

client.login(process.env.DISCORD_TOKEN);

