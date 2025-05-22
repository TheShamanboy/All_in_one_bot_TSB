// utils/permissions.js

export function checkModPermissions(message, permission) {
    if (!message.member.permissions.has(permission)) {
        message.reply("❌ You don't have permission to use this command.");
        return false;
    }
    return true;
}
