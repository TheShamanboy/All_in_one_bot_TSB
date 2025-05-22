// commands/utility/removerole.js

import { PermissionsBitField } from 'discord.js';

export default {
    name: 'removerole',
    description: 'Removes a role from a user.',
    usage: '<@user> <@role>',
    args: true,
    guildOnly: true,
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ You don't have permission to manage roles.");
        }

        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!member || !role) {
            return message.reply("❌ Please mention both a user and a role.");
        }

        if (!member.roles.cache.has(role.id)) {
            return message.reply("❌ That user doesn't have the specified role.");
        }

        try {
            await member.roles.remove(role);
            message.channel.send(`✅ Removed **${role.name}** from **${member.user.tag}**.`);
        } catch (error) {
            console.error(error);
            message.reply("❌ I couldn't remove that role.");
        }
    }
};
