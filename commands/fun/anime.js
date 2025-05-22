import { EmbedBuilder } from 'discord.js';
import axios from 'axios';

export default {
  name: 'randomanime',
  description: 'Fetches a random anime with details',

  async execute(message) {
    try {
      // Call Jikan API v4 for a random anime
      const response = await axios.get('https://api.jikan.moe/v4/random/anime');
      const anime = response.data.data;

      if (!anime) {
        return message.reply('Could not retrieve anime data. Please try again later.');
      }

      const animeTitle = anime.title || 'No title';
      const animeDescription = anime.synopsis || 'No description available.';
      const animeImage = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null;
      const animeUrl = anime.url || '';

      const embed = new EmbedBuilder()
        .setColor('#FF5733')
        .setTitle(animeTitle)
        .setDescription(animeDescription.substring(0, 1024))
        .setURL(animeUrl)
        .setFooter({ text: 'Powered by Jikan API' });

      if (animeImage) embed.setImage(animeImage);

      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching random anime:', error.response?.data || error.message || error);
      message.reply('Oops! Something went wrong while fetching anime data.');
    }
  }
};
