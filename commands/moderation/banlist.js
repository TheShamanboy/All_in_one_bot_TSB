import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'banlist',
  description: 'Displays a list of banned users in this server.',
  guildOnly: true,

  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("You don't have permission to view the ban list.");
    }

    try {
      const bans = await message.guild.bans.fetch();

      if (!bans.size) {
        return message.reply('There are no banned users in this server.');
      }

      // Prepare list
      const banList = bans
        .map((ban, index) => `**${index + 1}.** ${ban.user.tag} (${ban.user.id})`)
        .join('\n');

      const MAX_LENGTH = 2000;
      if (banList.length > MAX_LENGTH) {
        return message.reply('Ban list is too long to display.');
      }

      const embed = new EmbedBuilder()
        .setTitle('🔨 Ban List')
        .setDescription(banList)
        .setColor(0xFF5555)
        .setFooter({ text: `Total banned users: ${bans.size}` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching ban list:', error);
      message.reply('An error occurred while fetching the ban list.');
    }
  }
};
