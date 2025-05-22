import { PermissionFlagsBits } from 'discord.js';
import { checkModPermissions } from '../../utils/permissions.js';
import { createEmbed } from '../../utils/embed.js';

export default {
    name: 'watchlist',
    description: 'Add or remove a user from the watchlist or view all flagged members',
    usage: '<add/remove/list> [user] [reason]',
    args: true,
    guildOnly: true,
    async execute(message, args) {
        if (!checkModPermissions(message, PermissionFlagsBits.ManageRoles)) return;

        if (!global.watchlist) global.watchlist = new Map();

        const action = args[0]?.toLowerCase();

        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply('Please specify a valid action: `add`, `remove`, or `list`.');
        }

        if (action === 'list') {
            const guildWatchlist = [];

            global.watchlist.forEach((data, userId) => {
                if (data.guild === message.guild.id) {
                    guildWatchlist.push({
                        userId,
                        reason: data.reason,
                        moderator: data.moderator,
                        timestamp: data.timestamp
                    });
                }
            });

            if (guildWatchlist.length === 0) {
                return message.reply('No users are currently on the watchlist in this server.');
            }

            const watchlistEntries = await Promise.all(guildWatchlist.map(async (entry, index) => {
                const date = new Date(entry.timestamp);
                let username = 'Unknown User';

                try {
                    const user = await message.client.users.fetch(entry.userId);
                    username = user.tag;
                } catch {
                    // keep username as 'Unknown User'
                }

                return `**${index + 1}.** ${username} (<@${entry.userId}>)\n**Reason:** ${entry.reason}\n**Added by:** <@${entry.moderator}> on ${date.toLocaleDateString()}`;
            }));

            const embed = createEmbed(
                'Server Watchlist',
                `There are ${guildWatchlist.length} user(s) on the watchlist.`,
                0xFF0000, // Red
                [
                    { name: 'Flagged Members', value: watchlistEntries.join('\n\n'), inline: false }
                ]
            );

            return message.channel.send({ embeds: [embed] });
        }

        // For add/remove actions, get target user
        const target = message.mentions.members.first() ||
                       message.guild.members.cache.get(args[1]);

        if (!target) {
            return message.reply('Please mention a valid user or provide a user ID.');
        }

        if (action === 'add') {
            const reason = args.slice(2).join(' ') || 'No reason provided';

            if (global.watchlist.has(target.id)) {
                const data = global.watchlist.get(target.id);
                if (data.guild === message.guild.id) {
                    return message.reply(`${target.user.tag} is already on the watchlist.`);
                }
            }

            global.watchlist.set(target.id, {
                guild: message.guild.id,
                reason,
                moderator: message.author.id,
                timestamp: Date.now()
            });

            const embed = createEmbed(
                'User Added to Watchlist',
                `${target.user.tag} has been added to the watchlist.`,
                0xFFA500, // Orange
                [
                    { name: 'User', value: `<@${target.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ]
            );

            return message.channel.send({ embeds: [embed] });
        }

        if (action === 'remove') {
            if (!global.watchlist.has(target.id) || global.watchlist.get(target.id).guild !== message.guild.id) {
                return message.reply(`${target.user.tag} is not on the watchlist.`);
            }

            global.watchlist.delete(target.id);

            const embed = createEmbed(
                'User Removed from Watchlist',
                `${target.user.tag} has been removed from the watchlist.`,
                0x00FF00, // Green
                [
                    { name: 'User', value: `<@${target.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${message.author.id}>`, inline: true }
                ]
            );

            return message.channel.send({ embeds: [embed] });
        }
    }
};

