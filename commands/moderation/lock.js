import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'lock',
  description: 'Lock a channel to prevent members from sending messages',
  usage: '[channel] [reason]',
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageChannels)) {
      return message.reply("❌ You don't have permission to manage channels.");
    }

    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.join(' ') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: false
      });

      const embed = createEmbed(
        'Channel Locked',
        `${channel} has been locked.`,
        0xFF0000,
        [
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        ]
      );

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to lock channel: ${error.message}`);
    }
  }
};
