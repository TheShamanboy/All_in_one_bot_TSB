import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';

// For __dirname replacement in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'blacklist',
  description: 'Add a user to the blacklist and kick them on join',
  usage: '<user>',
  args: true,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('You need Kick Members permission to use this command.');
    }

    const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Please mention a valid user or provide a valid user ID.');

    const filePath = path.join(__dirname, '../../data/blacklist.json');

    // Create file if not exists
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));

    let blacklist = JSON.parse(fs.readFileSync(filePath));

    if (blacklist.includes(target.id)) {
      return message.reply('That user is already blacklisted.');
    }

    blacklist.push(target.id);
    fs.writeFileSync(filePath, JSON.stringify(blacklist, null, 4));

    const embed = new EmbedBuilder()
      .setTitle('User Blacklisted')
      .setDescription(`${target.tag} has been added to the blacklist.`)
      .setColor(0xff0000)
      .addFields(
        { name: 'User', value: `<@${target.id}>`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true }
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
