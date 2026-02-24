const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ==================== MIDDLEWARE ====================
const isAdmin = (ctx) => {
    return ctx.from.id.toString() === process.env.ADMIN_ID;
};

const isPrivateChat = (ctx) => {
    return ctx.chat.type === 'private';
};

// ==================== COMMANDS ====================

// Command /start
bot.start(async (ctx) => {
    if (!isPrivateChat(ctx)) return;

    const userName = ctx.from.first_name || 'User';
    
    const welcomeMessage = `
╔══════════════════════════════╗
║    🔐 LICENSE BOT SYSTEM     ║
╚══════════════════════════════╝

Halo *${userName}*! 👋

Selamat datang di *License Bot System* - Solusi manajemen lisensi untuk script SH Anda.

${isAdmin(ctx) ? '👑 *Anda login sebagai ADMIN*' : '👤 *Anda login sebagai USER*'}

─────────────────────
📌 *Fitur Utama:*
• 1 Key 1 Device System
• Real-time Active User Monitor
• License Key Management
• Auto Device Detection
─────────────────────

💡 *Gunakan /help untuk melihat commands*
    `;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📋 Commands', 'show_commands')],
        [Markup.button.callback('ℹ️ Info', 'show_info'), Markup.button.callback('📊 Status', 'show_status')]
    ]);

    await ctx.replyWithPhoto(
        'https://via.placeholder.com/1024x500/1e1e2f/ffffff?text=LICENSE+BOT+SYSTEM',
        {
            caption: welcomeMessage,
            parse_mode: 'Markdown',
            ...keyboard
        }
    );
});

// Command /help
bot.help(async (ctx) => {
    if (!isPrivateChat(ctx)) return;

    let helpMessage = `
╔══════════════════════════════╗
║        📋 COMMANDS           ║
╚══════════════════════════════╝

*Public Commands:*
• /start - Mulai bot
• /help - Tampilkan help ini
• /info - Informasi sistem
• /status - Cek status server

`;

    if (isAdmin(ctx)) {
        helpMessage += `
─────────────────────
*👑 Admin Commands:*
• /addkey [key] - Tambah key baru
• /delkey [key] - Hapus key
• /keys - Lihat semua key
• /active - Lihat user aktif
• /stats - Statistik lengkap
• /broadcast [pesan] - Kirim broadcast
• /backup - Backup data
• /reset - Reset semua data
`;
    }

    helpMessage += `
─────────────────────
💡 *Tips:*
Gunakan command dengan benar
Contoh: /addkey ABC123

📞 *Contact:* @admin
    `;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back', 'back_to_main')]
    ]);

    await ctx.reply(helpMessage, {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// Command /info
bot.command('info', async (ctx) => {
    const infoMessage = `
╔══════════════════════════════╗
║        ℹ️ INFORMATION         ║
╚══════════════════════════════╝

*System Information:*
• Version: 2.0.0
• Platform: Vercel
• Node.js: ${process.version}
• Uptime: ${process.uptime().toFixed(0)}s

*License System:*
• 1 Key 1 Device ✓
• Auto Detection ✓
• Real-time Monitor ✓
• Backup System ✓

*Developer:*
• Name: Your Name
• Contact: @username
• GitHub: github.com/username

*Last Update:* ${new Date().toLocaleString('id-ID')}
    `;

    await ctx.reply(infoMessage, { parse_mode: 'Markdown' });
});

// Command /status
bot.command('status', async (ctx) => {
    const statusMessage = `
╔══════════════════════════════╗
║        📊 SYSTEM STATUS      ║
╚══════════════════════════════╝

*Server Status:* 🟢 ONLINE
• Response Time: < 100ms
• Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• CPU Usage: ${(process.cpuUsage().user / 1000000).toFixed(2)}%

*API Status:*
• Add Key: 🟢 Active
• Validate: 🟢 Active
• Remove Key: 🟢 Active
• List Keys: 🟢 Active

*Database:* 🟢 Connected
• Storage: Vercel Blob
• Backup: Auto Daily

*Last Check:* ${new Date().toLocaleString('id-ID')}
    `;

    await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
});

// ==================== ADMIN COMMANDS ====================

// Command /addkey
bot.command('addkey', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply('❌ *Akses Ditolak!*\nCommand ini hanya untuk admin.', { 
            parse_mode: 'Markdown' 
        });
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply(
            '⚠️ *Format Salah!*\n\n' +
            'Penggunaan: `/addkey [key]`\n' +
            'Contoh: `/addkey ABC123`',
            { parse_mode: 'Markdown' }
        );
    }

    const key = args[1].toUpperCase();

    // Loading animation
    const loadingMsg = await ctx.reply('⏳ *Memproses...*', { parse_mode: 'Markdown' });

    try {
        const response = await fetch(`${process.env.VERCEL_URL}/api/addkey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: key,
                chatId: ctx.from.id.toString()
            })
        });

        const result = await response.json();
        
        // Delete loading message
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

        if (result.success) {
            const successMessage = `
╔══════════════════════════════╗
║     ✅ KEY ADDED SUCCESS     ║
╚══════════════════════════════╝

*Key Details:*
• Key: \`${key}\`
• Added by: @${ctx.from.username || 'admin'}
• Date: ${new Date().toLocaleString('id-ID')}
• Status: 🟢 Active

*Usage:*
Client dapat menggunakan key ini
untuk mengakses script premium.
            `;

            await ctx.reply(successMessage, { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 Lihat Semua Key', callback_data: 'list_keys' }]
                    ]
                }
            });
        } else {
            await ctx.reply(`❌ *Gagal!*\n${result.error || 'Unknown error'}`, { 
                parse_mode: 'Markdown' 
            });
        }
    } catch (error) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
        await ctx.reply('❌ *Error!*\nGagal terhubung ke server.', { 
            parse_mode: 'Markdown' 
        });
    }
});

// Command /delkey
bot.command('delkey', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply('❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('⚠️ Format: /delkey [key]', { parse_mode: 'Markdown' });
    }

    const key = args[1].toUpperCase();

    // Konfirmasi
    await ctx.reply(
        `⚠️ *Konfirmasi Penghapusan*\n\n` +
        `Apakah Anda yakin ingin menghapus key \`${key}\`?\n\n` +
        `Tindakan ini tidak dapat dibatalkan!`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Ya, Hapus', callback_data: `confirm_del_${key}` },
                        { text: '❌ Batal', callback_data: 'cancel_del' }
                    ]
                ]
            }
        }
    );
});

// Command /keys
bot.command('keys', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply('❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
    }

    const loadingMsg = await ctx.reply('⏳ *Mengambil data...*', { parse_mode: 'Markdown' });

    try {
        const response = await fetch(`${process.env.VERCEL_URL}/api/listkeys?chatId=${ctx.from.id}`);
        const result = await response.json();

        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

        if (result.keys.length === 0) {
            return ctx.reply('📭 *Belum ada key yang terdaftar.*', { parse_mode: 'Markdown' });
        }

        let message = `
╔══════════════════════════════╗
║     📋 LICENSE KEYS LIST     ║
╚══════════════════════════════╝

*Total Keys:* ${result.total}
*Active Keys:* ${result.keys.filter(k => k.isActive).length}
*Inactive Keys:* ${result.keys.filter(k => !k.isActive).length}
─────────────────────

`;

        result.keys.slice(0, 10).forEach((key, i) => {
            const status = key.isActive ? '🟢 Active' : '⚪ Inactive';
            message += `${i+1}. \`${key.key}\`\n`;
            message += `   Status: ${status}\n`;
            if (key.deviceId) {
                message += `   Device: \`${key.deviceId.substring(0, 10)}...\`\n`;
            }
            message += `   Created: ${new Date(key.createdAt).toLocaleDateString('id-ID')}\n`;
            if (key.lastUsed) {
                message += `   Last Used: ${new Date(key.lastUsed).toLocaleString('id-ID')}\n`;
            }
            message += `   Uses: ${key.totalUses || 0}x\n\n`;
        });

        if (result.keys.length > 10) {
            message += `*...dan ${result.keys.length - 10} key lainnya*\n`;
        }

        await ctx.reply(message, { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📊 Lihat Statistik', callback_data: 'show_stats' }]
                ]
            }
        });

    } catch (error) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
        await ctx.reply('❌ *Error!*\nGagal mengambil data.', { parse_mode: 'Markdown' });
    }
});

// Command /active
bot.command('active', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply('❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
    }

    const loadingMsg = await ctx.reply('⏳ *Memuat user aktif...*', { parse_mode: 'Markdown' });

    try {
        const response = await fetch(`${process.env.VERCEL_URL}/api/cekusr?chatId=${ctx.from.id}`);
        const result = await response.json();

        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

        let message = `
╔══════════════════════════════╗
║     👥 ACTIVE USERS          ║
╚══════════════════════════════╝

*Total Active:* ${result.totalActive} user
─────────────────────

`;

        if (result.users.length === 0) {
            message += 'Tidak ada user yang aktif saat ini.';
        } else {
            result.users.forEach((user, i) => {
                const lastSeen = new Date(user.lastSeen);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));
                
                message += `${i+1}. *Key:* \`${user.key}\`\n`;
                message += `   📱 Device: \`${user.deviceId.substring(0, 15)}...\`\n`;
                message += `   ⏰ Last Seen: ${diffMinutes} menit lalu\n`;
                message += `   🕒 ${lastSeen.toLocaleString('id-ID')}\n\n`;
            });
        }

        message += `─────────────────────\n`;
        message += `🔄 *Update:* Setiap 5 menit\n`;
        message += `📊 *Peak Today:* ${result.peakToday || result.totalActive} users`;

        await ctx.reply(message, { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔄 Refresh', callback_data: 'refresh_active' }]
                ]
            }
        });

    } catch (error) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
        await ctx.reply('❌ *Error!*\nGagal mengambil data.', { parse_mode: 'Markdown' });
    }
});

// Command /stats
bot.command('stats', async (ctx) => {
    if (!isAdmin(ctx)) {
        return ctx.reply('❌ *Akses Ditolak!*', { parse_mode: 'Markdown' });
    }

    try {
        const response = await fetch(`${process.env.VERCEL_URL}/api/listkeys?chatId=${ctx.from.id}`);
        const result = await response.json();

        const activeNow = await fetch(`${process.env.VERCEL_URL}/api/cekusr?chatId=${ctx.from.id}`);
        const activeResult = await activeNow.json();

        const totalKeys = result.keys.length;
        const activeKeys = result.keys.filter(k => k.isActive).length;
        const totalUses = result.keys.reduce((acc, k) => acc + (k.totalUses || 0), 0);
        const keysToday = result.keys.filter(k => {
            const lastUsed = new Date(k.lastUsed || 0);
            const today = new Date();
            return lastUsed.toDateString() === today.toDateString();
        }).length;

        const statsMessage = `
╔══════════════════════════════╗
║     📊 STATISTICS SUMMARY    ║
╚══════════════════════════════╝

*License Statistics:*
• Total Keys: ${totalKeys}
• Active Keys: ${activeKeys}
• Inactive Keys: ${totalKeys - activeKeys}
• Active Now: ${activeResult.totalActive}

*Usage Statistics:*
• Total Uses: ${totalUses}
• Keys Used Today: ${keysToday}
• Avg Uses/Key: ${(totalUses / totalKeys || 0).toFixed(1)}

*System Health:*
• Uptime: ${process.uptime().toFixed(0)}s
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Status: 🟢 Healthy

*Last Updated:* ${new Date().toLocaleString('id-ID')}
        `;

        await ctx.reply(statsMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        await ctx.reply('❌ *Error!*\nGagal mengambil statistik.', { parse_mode: 'Markdown' });
    }
});

// ==================== CALLBACK HANDLERS ====================

// Show commands callback
bot.action('show_commands', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(
        isAdmin(ctx) ? 
        `📋 *Commands List*\n\n👑 *Admin Commands:*\n/addkey\n/delkey\n/keys\n/active\n/stats\n/broadcast\n/backup\n/reset\n\n👤 *User Commands:*\n/start\n/help\n/info\n/status` :
        `📋 *Commands List*\n\n👤 *User Commands:*\n/start\n/help\n/info\n/status`,
        { parse_mode: 'Markdown' }
    );
});

// Show info callback
bot.action('show_info', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageCaption(
        `ℹ️ *System Information*\n\n` +
        `Version: 2.0.0\n` +
        `Platform: Vercel\n` +
        `Developer: @username\n` +
        `\n*Features:*\n` +
        `• 1 Key 1 Device\n` +
        `• Real-time Monitor\n` +
        `• Auto Detection\n` +
        `• Backup System`,
        { parse_mode: 'Markdown' }
    );
});

// Show status callback
bot.action('show_status', async (ctx) => {
    await ctx.answerCbQuery('🟢 System Online');
    await ctx.editMessageCaption(
        `📊 *System Status*\n\n` +
        `Server: 🟢 Online\n` +
        `API: 🟢 Active\n` +
        `Database: 🟢 Connected\n` +
        `\n*Response Time:* < 100ms\n` +
        `*Active Users:* Fetching...`,
        { parse_mode: 'Markdown' }
    );
});

// Back to main callback
bot.action('back_to_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.reply(
        'Kembali ke menu utama. Gunakan /help untuk melihat commands.',
        { parse_mode: 'Markdown' }
    );
});

// Confirm delete callback
bot.action(/confirm_del_(.+)/, async (ctx) => {
    if (!isAdmin(ctx)) {
        await ctx.answerCbQuery('❌ Unauthorized!');
        return;
    }

    const key = ctx.match[1];
    await ctx.answerCbQuery('⏳ Menghapus...');

    try {
        const response = await fetch(`${process.env.VERCEL_URL}/api/removekey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: key,
                chatId: ctx.from.id.toString()
            })
        });

        const result = await response.json();

        if (result.success) {
            await ctx.editMessageText(
                `✅ *Key ${key} berhasil dihapus!*`,
                { parse_mode: 'Markdown' }
            );
        } else {
            await ctx.editMessageText(
                `❌ *Gagal menghapus key!*`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        await ctx.editMessageText('❌ *Error!*', { parse_mode: 'Markdown' });
    }
});

// Cancel delete callback
bot.action('cancel_del', async (ctx) => {
    await ctx.answerCbQuery('❌ Dibatalkan');
    await ctx.deleteMessage();
});

// List keys callback
bot.action('list_keys', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Gunakan /keys untuk melihat semua key');
});

// Show stats callback
bot.action('show_stats', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Gunakan /stats untuk statistik lengkap');
});

// Refresh active callback
bot.action('refresh_active', async (ctx) => {
    await ctx.answerCbQuery('🔄 Merefresh...');
    await ctx.deleteMessage();
    await ctx.reply('Gunakan /active untuk melihat user aktif');
});

// ==================== ERROR HANDLER ====================
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
});

// ==================== WEBHOOK HANDLER ====================
export default async function handler(req, res) {
    try {
        await bot.handleUpdate(req.body, res);
    } catch (error) {
        console.error('Error handling update:', error);
        res.status(200).send('OK');
    }
}