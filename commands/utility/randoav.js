// commands/fun/randomav.js

import { EmbedBuilder } from 'discord.js';

export default {
  name: 'randomav',
  description: 'Shows a random user’s avatar from the server.',
  async execute(message) {
    try {
      // Fetch all members (requires GUILD_MEMBERS intent)
      const members = await message.guild.members.fetch();
      const randomMember = members.random();

      const avatarEmbed = new EmbedBuilder()
        .setColor(0x36366a)
        .setTitle(`🎲 Random Avatar: ${randomMember.user.username}`)
        .setImage(randomMember.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await message.channel.send({ embeds: [avatarEmbed] });
    } catch (err) {
      console.error(err);
      await message.reply('❌ Could not fetch members. Make sure the bot has the `GUILD_MEMBERS` intent.');
    }
  }
};
