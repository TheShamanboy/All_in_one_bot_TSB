import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';

function checkModPermissions(message, permission) {
  if (!message.member) return false;
  return message.member.permissions.has(permission);
}

export default {
  name: 'jail',
  description: 'Restrict a user to a specific jail/timeout channel',
  usage: '<@user | userId> [reason]',
  args: true,
  guildOnly: true,

  async execute(message, args) {
    if (!checkModPermissions(message, PermissionFlagsBits.ManageRoles)) {
      return message.reply("❌ You don't have permission to jail members.");
    }

    const userIdOrMention = args[0];
    let target;

    // Fetch target member by mention or ID
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
      return message.reply("I cannot jail this user. They may have higher permissions than me or I lack role management permissions.");
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // Find or create jail role
      let jailRole = message.guild.roles.cache.find(role => role.name === 'Jailed');

      if (!jailRole) {
        jailRole = await message.guild.roles.create({
          name: 'Jailed',
          color: '#808080',
          permissions: []
        });

        // Remove permissions in all channels for the jail role
        message.guild.channels.cache.forEach(async (channel) => {
          await channel.permissionOverwrites.edit(jailRole, {
            SendMessages: false,
            AddReactions: false,
            Speak: false,
            Stream: false,
            ViewChannel: false
          });
        });

        // Create jail channel with proper permissions
        let jailChannel = message.guild.channels.cache.find(channel => channel.name === 'jail');

        if (!jailChannel) {
          jailChannel = await message.guild.channels.create({
            name: 'jail',
            type: 0, // GUILD_TEXT
            permissionOverwrites: [
              {
                id: message.guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: jailRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages]
              }
            ]
          });

          await jailChannel.send('This is the jail channel. Users who are jailed can only see this channel.');
        }
      }

      // Backup user roles and replace with jail role
      const userRoles = target.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.id);
      await target.roles.remove(userRoles);
      await target.roles.add(jailRole);

      // Store jailed user roles globally for later restoration
      if (!global.jailedUsers) global.jailedUsers = new Map();
      global.jailedUsers.set(target.id, {
        roles: userRoles,
        guildId: message.guild.id
      });

      // DM the user
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`You have been jailed in ${message.guild.name}`)
          .setColor(0xFFA500)
          .setDescription(`You have been **jailed** in **${message.guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: `${message.author.tag}`, inline: false }
          )
          .setTimestamp()
          .setFooter({
            text: 'Contact staff if you believe this was a mistake.',
            iconURL: message.guild.iconURL({ dynamic: true })
          });

        await target.send({ embeds: [dmEmbed] });
      } catch {
        console.log(`Could not send DM to ${target.user.tag}.`);
      }

      // Public embed
      const embed = new EmbedBuilder()
        .setTitle('User Jailed')
        .setDescription(`${target.user.tag} has been jailed.`)
        .setColor(0xFFA500)
        .setThumbnail('') // Add your GIF URL if you want
        .addFields(
          { name: 'User', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        );

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      message.reply(`Failed to jail ${target.user.tag}: ${error.message}`);
    }
  }
};
