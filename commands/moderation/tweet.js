import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embed.js';

export default {
    name: 'tweet',
    description: 'Generate a tweet image from a replied message',
    usage: '<reply to a message>',
    guildOnly: true,
    execute: async (message) => {
        try {
            if (!message.reference) {
                return message.reply('Please reply to a message to create a tweet from it.');
            }

            const repliedTo = await message.channel.messages.fetch(message.reference.messageId);

            if (!repliedTo) {
                return message.reply('Could not find the message you replied to.');
            }

            const tweetContent = repliedTo.content;

            if (!tweetContent || tweetContent.length === 0) {
                return message.reply('The message has no text content to create a tweet.');
            }

            const author = repliedTo.author;
            const authorName = author.username;
            const authorDisplayName = author.globalName || authorName;

            const loadingMessage = await message.channel.send('Generating tweet image...');

            const attachment = await createTweetImage(tweetContent, author, authorName, authorDisplayName);

            await message.channel.send({ files: [attachment] });

            await loadingMessage.delete().catch(console.error);
        } catch (error) {
            console.error(error);
            message.reply(`Error creating tweet: ${error.message}`);
        }
    }
};

async function createTweetImage(tweetText, author, authorName, authorDisplayName) {
    const width = 600;
    const padding = 20;
    const avatarSize = 48;
    const fontSize = 22;
    const lineHeight = fontSize * 1.2;

    // Temporary canvas for measuring text
    const tempCanvas = createCanvas(width, 100);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${fontSize}px Arial, sans-serif`;

    // Word wrap
    const lines = [];
    const words = tweetText.split(' ');
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = tempCtx.measureText(testLine);

        if (metrics.width > width - (padding * 2) - avatarSize - 10) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);

    const textAreaHeight = lines.length * lineHeight;
    const totalHeight = Math.max(textAreaHeight + (padding * 3) + 60, 180);

    // Now create the real canvas with correct height
    const canvas = createCanvas(width, totalHeight);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
        const avatarURL = author.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);

        // Draw avatar (circle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(padding + avatarSize / 2, padding + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, padding, padding, avatarSize, avatarSize);
        ctx.restore();

        // Display name (bold)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText(authorDisplayName, padding + avatarSize + 10, padding + 20);

        // Username (gray)
        ctx.fillStyle = '#657786';
        ctx.font = '16px Arial, sans-serif';
        const usernameText = `@${authorName}`;
        ctx.fillText(usernameText, padding + avatarSize + 10, padding + 42);

        // Tweet text
        ctx.fillStyle = '#000000';
        ctx.font = `${fontSize}px Arial, sans-serif`;

        lines.forEach((line, i) => {
            ctx.fillText(line, padding, padding + avatarSize + 25 + i * lineHeight);
        });

        // Separator line
        ctx.strokeStyle = '#E1E8ED';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, totalHeight - 60);
        ctx.lineTo(width - padding, totalHeight - 60);
        ctx.stroke();

        // Interaction icons (visual only)
        ctx.fillStyle = '#657786';
        ctx.font = '14px Arial, sans-serif';

        ctx.fillText('💬 0', padding + 10, totalHeight - 30);
        ctx.fillText('🔄 0', padding + 90, totalHeight - 30);
        ctx.fillText('❤️ 0', padding + 170, totalHeight - 30);
        ctx.fillText('📤', padding + 250, totalHeight - 30);

        // Timestamp (right aligned)
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} · ${now.toLocaleDateString()}`;
        ctx.font = '14px Arial, sans-serif';
        const timeWidth = ctx.measureText(timeString).width;
        ctx.fillText(timeString, width - padding - timeWidth, totalHeight - 30);

        const buffer = canvas.toBuffer();
        return new AttachmentBuilder(buffer, { name: 'tweet.png' });
    } catch (error) {
        console.error('Error generating tweet:', error);

        // Fallback: draw without avatar
        ctx.fillStyle = '#000000';
        ctx.font = `${fontSize}px Arial, sans-serif`;

        lines.forEach((line, i) => {
            ctx.fillText(line, padding, padding + 60 + i * lineHeight);
        });

        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText(authorDisplayName, padding, padding + 20);

        ctx.fillStyle = '#657786';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`@${authorName}`, padding, padding + 40);

        const buffer = canvas.toBuffer();
        return new AttachmentBuilder(buffer, { name: 'tweet.png' });
    }
}
