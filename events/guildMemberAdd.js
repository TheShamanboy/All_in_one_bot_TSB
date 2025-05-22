client.on('guildMemberAdd', async member => {
    console.log(`Member joined: ${member.user.tag} (${member.id})`); // debug

    const blacklistPath = path.join(__dirname, 'data', 'blacklist.json');
    if (!fs.existsSync(blacklistPath)) {
        console.log('Blacklist file not found.');
        return;
    }

    let blacklist;
    try {
        blacklist = JSON.parse(fs.readFileSync(blacklistPath));
    } catch (err) {
        console.error('Failed to read blacklist file:', err);
        return;
    }

    if (blacklist.includes(member.id)) {
        console.log(`Blacklisted user ${member.user.tag} tried to join.`);

        const embed = {
            title: 'Access Denied',
            description: `You are blacklisted and have been removed from **${member.guild.name}**.`,
            color: 0xFF0000,
            timestamp: new Date(),
            footer: { text: 'Blacklist Enforcement' },
        };

        try {
            await member.send({ embeds: [embed] }).catch(() => {
                console.log(`Couldn't DM ${member.user.tag}`);
            });

            await member.kick('User is blacklisted');
            console.log(`Kicked blacklisted user ${member.user.tag}`);
        } catch (err) {
            console.error(`Failed to kick blacklisted user ${member.user.tag}:`, err);
        }
    }
});

