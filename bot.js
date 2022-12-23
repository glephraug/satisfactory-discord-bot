
greets = new Map([
   ['porcupines', "I need a drink."],
   ['sidfarkus', "What a nice young man."],
   ['grimoire', "Nice beard!"],
   ['xeno28', "Also, you're handsome."]
]);

require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const AWS = require('aws-sdk');
var ec2 = new AWS.EC2();

var SSH = require('simple-ssh')
var fs = require('fs')

var params = { InstanceIds: [process.env.INSTANCE_ID] };

function server_status(msg, text) {
   var ssh = new SSH({
      host: '3.19.154.252',
      user: 'ubuntu',
      key: fs.readFileSync('/home/ubuntu/discord-control.pem')
   });
   var data = '';
   ssh.exec('sh /home/ubuntu/aws-game-server/status.sh', {
      out: function (stdout) {
         data += stdout;
      },
      exit: function (code) {
         msg.reply(text + data)
      }
   }).start();
}

function server_run(name) {
   var ssh = new SSH({
      host: '3.19.154.252',
      user: 'ubuntu',
      key: fs.readFileSync('/home/ubuntu/discord-control.pem')
   });
   ssh.exec("sh /home/ubuntu/aws-game-server/run.sh " + name).start();
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
      msg.reply("Oh ho, you wanna make them items? " + greet);
      server_run("satisfactory");
   } else if (msg.content === "!server-valheim") {
      msg.reply("How soft your fields so green can whisper tales of gore. " + greet);
      server_run("valheim");
   } else if (msg.content === "fat") {
      msg.reply("no u");
   } else if (msg.content === "luv u") {
      msg.reply("Oh, I luv u 2 " + msg.author.username);
   }
})

client.login(process.env.DISCORD_TOKEN);

