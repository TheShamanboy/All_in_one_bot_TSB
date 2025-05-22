import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'ban',
  description: 'Ban a user from the server',
  usage: '<user> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("❌ You don't have permission to use this command.");
    }

    const target = message.mentions.members.first() ||
                   message.guild.members.cache.get(args[0]);

    if (!target) {
      return message.reply('Please mention a valid user to ban.');
    }

    if (!target.bannable) {
      return message.reply("I cannot ban this user. They may have higher permissions than me, or I don't have ban permissions.");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`You have been banned from ${message.guild.name}`)
          .setColor(0x990000)
          .setDescription(`You have been **banned** from **${message.guild.name}**.`)
          .addFields(
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

      await target.ban({ reason });

      const embed = new EmbedBuilder()
        .setTitle('User Banned')
        .setDescription(`${target.user.tag} has been banned from the server.`)
        .setColor(0x990000)
        .addFields(
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({
          text: `Banned by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setImage('https://pa1.aminoapps.com/7430/e356c121c37afa741180a805ee9903e70b7fc86er1-540-406_hq.gif');

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to ban ${target.user.tag}: ${error.message}`);
    }
  }
};
