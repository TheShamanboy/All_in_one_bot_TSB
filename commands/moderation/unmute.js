import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'unmute',
  description: 'Unmute a user in the server',
  usage: '<user> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageRoles)) return;

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply('Please mention a valid user to unmute.');
    }

    if (!target.manageable) {
      return message.reply("I cannot unmute this user. They may have higher permissions than me, or I don't have role management permissions.");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

      if (!muteRole) {
        return message.reply('There is no mute role set up on this server.');
      }

      if (!target.roles.cache.has(muteRole.id)) {
        return message.reply('This user is not currently muted.');
      }

      await target.roles.remove(muteRole);

      try {
        await target.send(`You have been unmuted in ${message.guild.name}. Reason: ${reason}`);
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      const embed = new EmbedBuilder()
        .setTitle('User Unmuted')
        .setDescription(`${target.user.tag} has been unmuted.`)
        .setColor(0x00FF00)
        .addFields(
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to unmute ${target.user.tag}: ${error.message}`);
    }
  }
};

