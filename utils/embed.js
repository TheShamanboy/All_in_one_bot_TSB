// utils/embed.js

import { EmbedBuilder } from 'discord.js';

export function createEmbed({ title, description, color = '#FF5733' }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: 'Powered by Ippo' });
}
