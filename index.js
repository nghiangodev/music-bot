const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const { MessageActionRow, MessageButton } = require('discord.js');
const {Player} = require('discord-player');
const express = require('express')
const server = express()
const { Server } = require('https');
const client = new Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}
console.log(client.commands);
const player = new Player(client);


player.on('error', (queue, error) => {
  console.log(`Darth: [${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
  console.log(`Darth: [${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(` > **${track.title}** 
  > ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ **00:00:00** - **00:0${track.duration}**! 
  > **Requestor** 
  > ${track.requestedBy.username} `);

   new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('primary')
          .setLabel('Primary')
          .setStyle('PRIMARY'),
      );

});

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(` > Track **${track.title}** queued!`);
});

player.on('botDisconnect', queue => {
  queue.metadata.send('> Darth was manually disconnected from the voice channel, clearing queue!');
});

player.on('channelEmpty', queue => {
  queue.metadata.send('> Nobody is in the voice channel, Darth is leaving...');
});

player.on('queueEnd', queue => {
  queue.metadata.send('> Darth: Queue finished!');
});

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('ready', function() {
  client.user.setActivity(process.env.activity, { type: process.env.activityType });
});

client.once('reconnecting', () => {
  console.log('> Darth: Reconnecting!');
});

client.once('disconnect', () => {
  console.log('> Darth: Disconnect!');
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('> Darth: Deployed!');
      })
      .catch(err => {
        message.reply('> Darth: Could not deploy commands! Make sure the bot has the application.commands permission!');
        console.error(err);
      });
  }
});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: '> Darth: There was an error trying to execute that command!',
    });
  }
});

server.connect({
  port: process.env.PORT || 3000 
});

client.login(process.env.TOKEN);
