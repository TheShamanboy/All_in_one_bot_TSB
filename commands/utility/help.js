// commands/utility/help.js

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';

export default {
  name: 'help',
  description: 'Displays a list of all available commands.',
  async execute(message) {
    const BASE_IMAGE = 'https://cdn.discordapp.com/attachments/1370432368204320871/1373404712765882479/ippppee_1.png';

    const getMainEmbed = () =>
      new EmbedBuilder()
        .setColor(0x36366a)
        .setTitle('Ippo Bot Help Center - Introduction')
        .setDescription(
          '**Ippo Bot** is the ultimate tool for server owners and moderators who want to maintain a fun, safe, and organized environment on their Discord servers.\n\n' +
          "Whether you're running a small community or a large gaming group, Ippo Bot provides powerful moderation tools and handy utilities to keep things running smoothly.\n\n" +
          "If you have any problems, don't hesitate to contact the creator Jude or join our support server:\n[Support Server](https://discord.gg/QPSaZhYBFH)"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp()
        .setImage(BASE_IMAGE);

    const getCommandsIntroEmbed = () =>
      new EmbedBuilder()
        .setColor(0x36366a)
        .setTitle('Ippo Bot Help Center - Commands')
        .setDescription(
          'This bot is equipped with a variety of commands that make your experience smoother and more interactive. ' +
          'Whether you need assistance, information, or just want to explore, the commands are here to help you navigate through different tasks quickly and efficiently.\n\n' +
          'Feel free to explore and try out different commands. If you ever need guidance, just check list down below.'
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp()
        .setImage(BASE_IMAGE);

    const embedsByCategory = {
      moderation: {
        name: 'Moderation Commands',
        commands: {
          unban: 'Unban a user from the server',
          unmute: 'Unmute a user in the server',
          unwarn: 'Remove a warning from a user',
          warn: 'Warn a user for rule violation',
          warnings: 'Display warnings for a user',
          watchlist: 'Add/remove/view users in the watchlist',
          ban: 'Ban a user from the server',
          jail: 'Restrict a user to a timeout channel',
          kick: 'Kick a user from the server',
          unjail: 'Remove a user from jail',
          addrole: 'Add a role to a user',
          removerole: 'Remove a role from a user'
        }
      },
      fun: {
        name: 'Fun Commands',
        commands: {
          randomanime: 'Fetch a random anime with details',
          divorce: 'Divorce your current partner',
          married: 'Check marriage status',
          marry: 'Propose to another user'
        }
      },
      utility: {
        name: 'Utility Commands',
        commands: {
          quote: 'Quote a message and send to quotes channel',
          tweet: 'Generate a tweet image from a replied message'
        }
      }
    };

    const mainButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('commands').setLabel('Commands').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setLabel('Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/QPSaZhYBFH')
    );

    const sent = await message.channel.send({ embeds: [getMainEmbed()], components: [mainButtons] });

    const filter = i => i.user.id === message.author.id;
    let currentCategory = null;

    const collector = sent.createMessageComponentCollector({ filter, time: 180000 });

    collector.on('collect', async interaction => {
      if (interaction.isButton()) {
        if (interaction.customId === 'commands') {
          const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('select_category')
            .setPlaceholder('Choose a command category')
            .addOptions(
              Object.keys(embedsByCategory).map(key => ({
                label: embedsByCategory[key].name,
                value: key
              }))
            );

          const backButton = new ButtonBuilder()
            .setCustomId('back_main')
            .setLabel('Back to Main')
            .setStyle(ButtonStyle.Secondary);

          await interaction.update({
            embeds: [getCommandsIntroEmbed()],
            components: [
              new ActionRowBuilder().addComponents(categorySelect),
              new ActionRowBuilder().addComponents(backButton)
            ]
          });

          currentCategory = null;
        } else if (interaction.customId === 'back_main') {
          await interaction.update({ embeds: [getMainEmbed()], components: [mainButtons] });
          currentCategory = null;
        }
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_category') {
          currentCategory = interaction.values[0];
          const category = embedsByCategory[currentCategory];

          const commandSelect = new StringSelectMenuBuilder()
            .setCustomId('select_command')
            .setPlaceholder(`Choose a command from ${category.name}`)
            .addOptions(
              Object.entries(category.commands).map(([cmd, desc]) => ({
                label: cmd,
                description: desc.length > 100 ? desc.slice(0, 97) + '...' : desc,
                value: cmd
              }))
            );

          const backButton = new ButtonBuilder()
            .setCustomId('back_main')
            .setLabel('Back to Main')
            .setStyle(ButtonStyle.Secondary);

          await interaction.update({
            embeds: [new EmbedBuilder()
              .setColor(0x36366a)
              .setTitle('Ippo Bot Help Center - Commands')
              .setDescription(`Category: **${category.name}**\nSelect a command below to see its description.`)
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
              })
              .setTimestamp()
              .setImage(BASE_IMAGE)],
            components: [
              new ActionRowBuilder().addComponents(commandSelect),
              new ActionRowBuilder().addComponents(backButton)
            ]
          });
        } else if (interaction.customId === 'select_command') {
          if (!currentCategory) return interaction.reply({ content: 'Please select a category first.', ephemeral: true });

          const category = embedsByCategory[currentCategory];
          const cmd = interaction.values[0];
          const desc = category.commands[cmd];

          const commandSelect = new StringSelectMenuBuilder()
            .setCustomId('select_command')
            .setPlaceholder(`Choose a command from ${category.name}`)
            .addOptions(
              Object.entries(category.commands).map(([c, d]) => ({
                label: c,
                description: d.length > 100 ? d.slice(0, 97) + '...' : d,
                value: c
              }))
            );

          const backButton = new ButtonBuilder()
            .setCustomId('back_main')
            .setLabel('Back to Main')
            .setStyle(ButtonStyle.Secondary);

          await interaction.update({
            embeds: [new EmbedBuilder()
              .setColor(0x36366a)
              .setTitle('Ippo Bot Help Center - Commands')
              .setDescription(`**Command:** ${cmd}\n**Description:** ${desc}`)
              .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
              })
              .setTimestamp()
              .setImage(BASE_IMAGE)],
            components: [
              new ActionRowBuilder().addComponents(commandSelect),
              new ActionRowBuilder().addComponents(backButton)
            ]
          });
        }
      }
    });
  }
};
