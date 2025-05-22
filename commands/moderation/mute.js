import { PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
  name: 'mute',
  description: 'Mute a user in the server (prevent them from sending messages)',
  usage: '<user> [duration] [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageRoles)) return;

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!target) return message.reply('Please mention a valid user to mute.');
    if (!target.manageable)
      return message.reply(
        "I cannot mute this user. They may have higher permissions than me, or I lack role management permissions."
      );

    let duration = 0;
    let reasonStartIndex = 1;

    if (args[1] && !isNaN(args[1])) {
      duration = parseInt(args[1], 10);
      reasonStartIndex = 2;
    }

    const reason = args.slice(reasonStartIndex).join(' ') || 'No reason provided';

    try {
      let muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');

      if (!muteRole) {
        muteRole = await message.guild.roles.create({
          name: 'Muted',
          color: 0x808080,
          permissions: []
        });

        message.guild.channels.cache.forEach(async channel => {
          if ([ChannelType.GuildText, ChannelType.GuildVoice].includes(channel.type)) {
            await channel.permissionOverwrites.create(muteRole, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
              Stream: false
            });
          }
        });
      }

      await target.roles.add(muteRole);

      if (duration > 0) {
        setTimeout(async () => {
          try {
            if (target.roles.cache.has(muteRole.id)) {
              await target.roles.remove(muteRole);

              const autoUnmuteEmbed = createEmbed(
                'User Automatically Unmuted',
                `${target.user.tag} has been automatically unmuted after ${duration} minutes.`,
                0x008000,
                [{ name: 'User', value: `<@${target.id}>`, inline: true }]
              );

              message.channel.send({ embeds: [autoUnmuteEmbed] });
            }
          } catch (error) {
            console.error(`Failed to auto-unmute ${target.user.tag}: ${error.message}`);
          }
        }, duration * 60000);
      }

      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`You have been muted in ${message.guild.name}`)
          .setColor(0xFFA500)
          .setDescription(`You have been **muted** in **${message.guild.name}**.`)
          .addFields(
            { name: 'Duration', value: duration > 0 ? `${duration} minutes` : 'Indefinite', inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: `${message.author.tag}`, inline: false }
          )
          .setTimestamp()
          .setFooter({
            text: 'This action was taken by the moderation team.',
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        await target.send({ embeds: [dmEmbed] });
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      const embed = createEmbed(
        'User Muted',
        duration > 0
          ? `${target.user.tag} has been muted for ${duration} minutes.`
          : `${target.user.tag} has been muted indefinitely.`,
        0xFFA500,
        [
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Duration', value: duration > 0 ? `${duration} minutes` : 'Indefinite', inline: true },
          { name: 'Reason', value: reason, inline: false }
        ]
      );

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to mute ${target.user.tag}: ${error.message}`);
    }
  }
};

