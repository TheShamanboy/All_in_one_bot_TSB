import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'unban',
  description: 'Unban a user from the server',
  usage: '<userId> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.BanMembers)) return;

    const userId = args[0];

    if (!userId || isNaN(userId)) {
      return message.reply('Please provide a valid user ID to unban.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const banList = await message.guild.bans.fetch();
      const bannedUser = banList.find(ban => ban.user.id === userId);

      if (!bannedUser) {
        return message.reply('This user is not banned.');
      }

      await message.guild.members.unban(userId, reason);

      const embed = createEmbed(
        'User Unbanned',
        `${bannedUser.user.tag} has been unbanned from the server.`,
        0x00FF00,
        [
          { name: 'User ID', value: userId, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        ]
      ).setImage('https://i.redd.it/ixrakxfxc39e1.gif');

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to unban user with ID ${userId}: ${error.message}`);
    }
  }
};

