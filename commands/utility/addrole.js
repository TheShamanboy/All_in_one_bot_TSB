import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';

export default {
  name: 'addrole',
  description: 'Assign a role to a user via dropdown',
  args: true,
  usage: '<userID> <roleNameOrID>',

  async execute(message, args) {
    // args: [userID, roleNameOrID]
    const userId = args[0];
    const roleInput = args.slice(1).join(' ');

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply('User not found in this server.');

    let role = message.guild.roles.cache.get(roleInput)
      || message.guild.roles.cache.find(r => r.name.toLowerCase() === roleInput.toLowerCase())
      || (roleInput.match(/^<@&(\d+)>$/) ? message.guild.roles.cache.get(roleInput.match(/^<@&(\d+)>$/)[1]) : null);

    if (!role) return message.reply('Role not found.');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`assign_role_${member.id}`)
      .setPlaceholder('Click to assign the role')
      .addOptions([
        {
          label: role.name,
          description: `Assign ${role.name} to ${member.user.tag}`,
          value: role.id,
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('Add Role')
      .setDescription(`Click the dropdown below to assign **${role.name}** to **${member.user.tag}**.`)
      .setColor('Blurple');

    await message.reply({ embeds: [embed], components: [row] });
  }
};
