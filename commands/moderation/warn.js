import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'warn',
  description: 'Warn a user for rule violation',
  usage: '<user> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageMessages)) return;

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply('Please mention a valid user to warn.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      if (!global.warnings) global.warnings = new Map();

      const userWarnings = global.warnings.get(target.id) || [];

      userWarnings.push({
        moderator: message.author.id,
        reason,
        timestamp: Date.now(),
        guild: message.guild.id,
      });

      global.warnings.set(target.id, userWarnings);

      try {
        await target.send(`You have been warned in ${message.guild.name} for: ${reason}`);
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      const embed = createEmbed(
        'User Warned',
        `${target.user.tag} has been warned.`,
        0xFFFF00,
        [
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Warning Count', value: `${userWarnings.length}`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ]
      );

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to warn ${target.user.tag}: ${error.message}`);
    }
  }
};
