import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Handle __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildModeration,
    ],
});

const prefix = '&';
client.commands = new Collection();

// Load commands dynamically from /commands subfolders
const loadCommands = async (dir) => {
    const commandFolders = fs.readdirSync(dir);
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(path.join(dir, folder)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const commandPath = pathToFileURL(path.join(dir, folder, file)).href;
            try {
                const commandModule = await import(commandPath);
                const command = commandModule.default;
                if (command?.name) {
                    client.commands.set(command.name, command);
                    console.log(`✅ Loaded command: ${command.name}`);
                } else {
                    console.warn(`⚠️ Skipped file without a valid command name: ${file}`);
                }
            } catch (err) {
                console.error(`❌ Failed to load command ${file}:`, err);
            }
        }
    }
};

// Load all commands before logging in
await loadCommands(path.join(__dirname, 'commands'));

// Bot ready event
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    client.user.setActivity('!help for commands', { type: 'PLAYING' });
});

// Blacklist check on member join
client.on('guildMemberAdd', async member => {
    const blacklistPath = path.join(__dirname, 'data', 'blacklist.json');
    if (!fs.existsSync(blacklistPath)) return;

    let blacklist;
    try {
        blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'));
    } catch (err) {
        console.error('Failed to read blacklist:', err);
        return;
    }

    if (blacklist.includes(member.id)) {
        const embed = {
            title: 'Access Denied',
            description: `You are blacklisted and have been removed from **${member.guild.name}**.`,
            color: 0xFF0000,
            timestamp: new Date(),
            footer: { text: 'Blacklist Enforcement' },
        };

        try {
            await member.send({ embeds: [embed] });
        } catch {}

        await member.kick('User is blacklisted');
        console.log(`🚫 Kicked blacklisted user ${member.user.tag}`);
    }
});

// Command handler
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    if (command.guildOnly && !message.guild) {
        return message.reply('This command can only be used in a server.');
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (command.usage) {
            reply += `\nProper usage: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.reply(reply);
    }

    try {
        await command.execute(message, args, client);
    } catch (err) {
        console.error(err);
        message.reply('There was an error executing that command.');
    }
});

// Interaction handler for dropdowns
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId.startsWith('remove_role_')) {
        const userId = interaction.customId.split('_')[2];
        const roleId = interaction.values[0];

        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const role = interaction.guild.roles.cache.get(roleId);

        if (!member || !role) {
            return interaction.reply({ content: "❌ Member or role not found.", ephemeral: true });
        }

        try {
            await member.roles.remove(role);
            await interaction.reply({ content: `✅ Removed **${role.name}** from **${member.user.tag}**.`, ephemeral: true });
        } catch (err) {
            await interaction.reply({ content: `❌ Failed to remove role: ${err.message}`, ephemeral: true });
        }
    }
});

// Login the bot
client.login(process.env.TOKEN);
