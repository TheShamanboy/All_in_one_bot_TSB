import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'unwarn',
  description: 'Remove a warning from a user',
  usage: '<user> <warning_number or "all">',
  args: true,
  guildOnly: true,
  execute: async (message, args) => {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageMessages)) return;

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply('Please mention a valid user to remove warnings from.');
    }

    const warningIndex = args[1];

    if (!warningIndex) {
      return message.reply('Please specify a warning number to remove or "all" to remove all warnings.');
    }

    try {
      if (!global.warnings || !global.warnings.has(target.id)) {
        return message.reply(`${target.user.tag} has no warnings to remove.`);
      }

      const userWarnings = global.warnings.get(target.id);
      const guildWarnings = userWarnings.filter(warning => warning.guild === message.guild.id);

      if (guildWarnings.length === 0) {
        return message.reply(`${target.user.tag} has no warnings in this server.`);
      }

      if (warningIndex.toLowerCase() === 'all') {
        const newWarnings = userWarnings.filter(warning => warning.guild !== message.guild.id);

        if (newWarnings.length === 0) {
          global.warnings.delete(target.id);
        } else {
          global.warnings.set(target.id, newWarnings);
        }

        const embed = createEmbed(
          'All Warnings Removed',
          `All warnings for ${target.user.tag} have been removed.`,
          0x008000,
          [
            { name: 'User', value: `<@${target.id}>`, inline: true },
            { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
            { name: 'Warnings Removed', value: `${guildWarnings.length}`, inline: true },
          ]
        );

        return message.channel.send({ embeds: [embed] });
      }

      const index = parseInt(warningIndex) - 1;

      if (isNaN(index) || index < 0 || index >= guildWarnings.length) {
        return message.reply(`Please provide a valid warning number between 1 and ${guildWarnings.length}.`);
      }

      let actualIndex = -1;
      let count = -1;

      for (let i = 0; i < userWarnings.length; i++) {
        if (userWarnings[i].guild === message.guild.id) {
          count++;
          if (count === index) {
            actualIndex = i;
            break;
          }
        }
      }

      if (actualIndex === -1) {
        return message.reply('Could not find that warning.');
      }

      const removedWarning = userWarnings[actualIndex];
      userWarnings.splice(actualIndex, 1);

      if (userWarnings.length === 0) {
        global.warnings.delete(target.id);
      } else {
        global.warnings.set(target.id, userWarnings);
      }

      const embed = createEmbed(
        'Warning Removed',
        `A warning has been removed from ${target.user.tag}.`,
        0x008000,
        [
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Warning Reason', value: removedWarning.reason, inline: false },
          { name: 'Remaining Warnings', value: `${guildWarnings.length - 1}`, inline: true },
        ]
      );

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to remove warning from ${target.user.tag}: ${error.message}`);
    }
  }
};
