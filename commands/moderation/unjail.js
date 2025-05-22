import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'unjail',
  description: 'Remove a user from jail',
  usage: '<@user | userId> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageRoles)) return;

    const userIdOrMention = args[0];
    let target;

    if (message.mentions.members.first()) {
      target = message.mentions.members.first();
    } else {
      try {
        target = await message.guild.members.fetch(userIdOrMention);
      } catch {
        return message.reply('Please provide a valid user mention or ID.');
      }
    }

    if (!target) {
      return message.reply('Could not find that user in the server.');
    }

    if (!target.manageable) {
      return message.reply("I cannot unjail this user. They may have higher permissions than me, or I don't have role management permissions.");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const jailRole = message.guild.roles.cache.find(role => role.name === 'Jailed');

      if (!jailRole) {
        return message.reply('There is no jail role set up on this server.');
      }

      if (!target.roles.cache.has(jailRole.id)) {
        return message.reply('This user is not currently jailed.');
      }

      if (!global.jailedUsers) global.jailedUsers = new Map();
      const userData = global.jailedUsers.get(target.id);

      await target.roles.remove(jailRole);

      if (userData && userData.guildId === message.guild.id && userData.roles) {
        for (const roleId of userData.roles) {
          try {
            const role = message.guild.roles.cache.get(roleId);
            if (role) await target.roles.add(role);
          } catch (error) {
            console.error(`Failed to add role ${roleId}: ${error.message}`);
          }
        }
        global.jailedUsers.delete(target.id);
      }

      // DM notification
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`You have been unjailed in ${message.guild.name}`)
          .setColor(0x00FF99)
          .setDescription(`You are no longer jailed in **${message.guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: `${message.author.tag}`, inline: false }
          )
          .setTimestamp()
          .setFooter({
            text: 'Follow the rules to avoid being jailed again.',
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        await target.send({ embeds: [dmEmbed] });
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      // Public confirmation embed with gif
      const embed = new EmbedBuilder()
        .setTitle('User Unjailed')
        .setDescription(`${target.user.tag} has been released from jail.`)
        .setColor(0x00FF99)
        .setThumbnail('https://media.tenor.com/Sz1XWY2clm8AAAAC/unlocked-jail.gif') // 🔓 Unjail GIF
        .addFields(
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to unjail ${target.user.tag}: ${error.message}`);
    }
  }
};
