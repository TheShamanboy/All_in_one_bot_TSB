import { EmbedBuilder } from 'discord.js';

export default {
  name: 'avatar',
  description: 'Displays the avatar of a user or yourself.',
  async execute(message, args) {
    let targetUser;

    // Check for mention
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } 
    // Check if an ID was passed
    else if (args[0]) {
      try {
        targetUser = await message.client.users.fetch(args[0]);
      } catch (err) {
        return message.reply('⚠️ Could not find a user with that ID.');
      }
    } 
    // Default to message author
    else {
      targetUser = message.author;
    }

    const avatarEmbed = new EmbedBuilder()
      .setColor(0x36366a)
      .setTitle(`${targetUser.username}'s Avatar`)
      .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await message.channel.send({ embeds: [avatarEmbed] });
  }
};
