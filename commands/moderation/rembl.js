import fs from 'fs';
import path from 'path';
import { PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'removebl',
  description: 'Remove a user from the blacklist',
  usage: '<user>',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.KickMembers)) return;

    const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);
    if (!target) {
      return message.reply('Please mention a valid user or provide a valid user ID.');
    }

    const filePath = path.join(new URL(import.meta.url).pathname, '../../data/blacklist.json');
    // For Windows paths fix:
    const normalizedFilePath = filePath.startsWith('/') && process.platform === 'win32' ? filePath.slice(1) : filePath;

    if (!fs.existsSync(normalizedFilePath)) {
      return message.reply('Blacklist file not found.');
    }

    let blacklist;
    try {
      blacklist = JSON.parse(fs.readFileSync(normalizedFilePath, 'utf8'));
    } catch (err) {
      console.error('Error reading blacklist file:', err);
      return message.reply('Failed to read the blacklist file.');
    }

    if (!blacklist.includes(target.id)) {
      return message.reply('That user is not in the blacklist.');
    }

    // Remove the user
    blacklist = blacklist.filter(id => id !== target.id);

    try {
      fs.writeFileSync(normalizedFilePath, JSON.stringify(blacklist, null, 4));
    } catch (err) {
      console.error('Error writing to blacklist file:', err);
      return message.reply('Failed to update the blacklist.');
    }

    const embed = createEmbed(
      'User Removed from Blacklist',
      `${target.tag} has been removed from the blacklist.`,
      0x00FF99,
      [
        { name: 'User', value: `<@${target.id}>`, inline: true },
        { name: 'Moderator', value: `<@${message.author.id}>`, inline: true }
      ]
    );

    message.channel.send({ embeds: [embed] });
  }
};
