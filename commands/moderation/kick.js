import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'kick',
  description: 'Kick a user from the server',
  usage: '<user> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.KickMembers)) {
      return message.reply("❌ You don't have permission to kick members.");
    }

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) {
      return message.reply('Please mention a valid user to kick.');
    }

    if (!target.kickable) {
      return message.reply("I cannot kick this user. They may have higher permissions than me, or I don't have kick permissions.");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // Attempt to DM user before kicking
      try {
        await target.send(`You have been kicked from **${message.guild.name}** for: ${reason}`);
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      await target.kick(reason);

      const embed = createEmbed(
        'User Kicked',
        `${target.user.tag} has been kicked from the server.`,
        0xFFA500,
        [
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        ]
      );

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to kick ${target.user.tag}: ${error.message}`);
    }
  }
};
