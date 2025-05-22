// commands/utility/quote.js

import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  name: 'quote',
  description: 'Quote a message and send it to the quotes channel (requires Quote role)',
  usage: '<reply to a message> [comment]',
  guildOnly: true,
  async execute(message, args) {
    try {
      const quoteRole = message.guild.roles.cache.find(role =>
        role.name.toLowerCase() === 'quote' || role.name.toLowerCase() === 'quotes'
      );

      if (!quoteRole) {
        return message.reply('There is no "Quote" role set up on this server. Ask an admin to create this role first.');
      }

      if (!message.member.roles.cache.has(quoteRole.id)) {
        return message.reply('You need the "Quote" role to use this command.');
      }

      if (!message.reference) {
        return message.reply('Please reply to a message to quote it.');
      }

      const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
      if (!repliedTo) {
        return message.reply('Could not find the message you replied to.');
      }

      let quotesChannel = message.guild.channels.cache.find(channel =>
        channel.name.toLowerCase().includes('quote') ||
        channel.name.toLowerCase() === 'quotes'
      );

      if (!quotesChannel) {
        if (message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
          try {
            quotesChannel = await message.guild.channels.create({
              name: 'quotes',
              type: ChannelType.GuildText,
              topic: 'Quoted messages from server members',
            });
            await message.channel.send(`Created a new #quotes channel since one didn't exist.`);
          } catch (error) {
            console.error('Error creating quotes channel:', error);
            return message.reply("I couldn't find a quotes channel and failed to create one. Please ask an admin to create a channel with 'quote' or 'quotes' in the name.");
          }
        } else {
          return message.reply("I couldn't find a quotes channel and don't have permission to create one. Please ask an admin to create a channel with 'quote' or 'quotes' in the name.");
        }
      }

      const comment = args.join(' ');
      const hasContent = repliedTo.content && repliedTo.content.trim().length > 0;
      const hasAttachments = repliedTo.attachments.size > 0;

      if (!hasContent && !hasAttachments) {
        return message.reply('The message has no text or attachments to quote.');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setAuthor({
          name: repliedTo.author.tag,
          iconURL: repliedTo.author.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: `Quoted by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      if (hasContent) {
        embed.setDescription(repliedTo.content);
      }

      embed.addFields([{
        name: 'Original Message',
        value: `[Jump to message](${repliedTo.url})`,
      }]);

      if (comment) {
        embed.addFields([{
          name: 'Comment',
          value: comment,
        }]);
      }

      const imageAttachment = repliedTo.attachments.find(attachment => {
        const fileExt = attachment.name.split('.').pop().toLowerCase();
        return fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png';
      });

      if (imageAttachment) {
        embed.setImage(imageAttachment.url);
      }

      await quotesChannel.send({ embeds: [embed] });
      message.reply(`Your quote has been sent to <#${quotesChannel.id}>.`);
    } catch (error) {
      console.error(error);
      message.reply(`Error creating quote: ${error.message}`);
    }
  }
};
