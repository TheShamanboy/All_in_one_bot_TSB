import { PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'warnings',
  description: 'Display warnings for a user',
  usage: '<user>',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    // Resolve target member safely, fallback to message.member if no valid user is found
    const target = message.mentions.members.first() ||
                   message.guild.members.cache.get(args[0]) ||
                   message.member;

    if (!target || !target.user) {
      return message.reply('Please specify a valid user.');
    }

    try {
      if (!global.warnings || !global.warnings.has(target.id)) {
        return message.reply(`${target.user.tag} has no warnings.`);
      }

      const userWarnings = global.warnings.get(target.id);
      const guildWarnings = userWarnings.filter(warning => warning.guild === message.guild.id);

      if (guildWarnings.length === 0) {
        return message.reply(`${target.user.tag} has no warnings in this server.`);
      }

      const warningsList = guildWarnings.map((warning, index) => {
        const date = new Date(warning.timestamp);
        return `**${index + 1}.** Warned by <@${warning.moderator}> on ${date.toLocaleDateString()}\n**Reason:** ${warning.reason}`;
      }).join('\n\n');

      const embed = createEmbed(
        `Warnings for ${target.user.tag}`,
        `This user has ${guildWarnings.length} warning(s) in this server.`,
        0xFFA500, // Orange
        [
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'ID', value: target.id, inline: true },
          { name: 'Warning List', value: warningsList, inline: false }
        ]
      );

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to retrieve warnings: ${error.message}`);
    }
  }
};

