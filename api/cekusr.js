const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    const { chatId } = req.query;

    // Verifikasi admin
    if (chatId !== process.env.ADMIN_CHAT_ID) {
        return res.status(403).json({ 
            success: false,
            error: 'Unauthorized' 
        });
    }

    try {
        // Baca file data
        const dataPath = path.join(process.cwd(), 'data', 'keys.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.json({ 
                totalActive: 0, 
                users: [],
                peakToday: 0
            });
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // Filter user yang aktif (last seen < 5 menit)
        const now = new Date();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        
        const activeUsers = data.activeUsers.filter(user => {
            const lastSeen = new Date(user.lastSeen);
            return lastSeen > fiveMinutesAgo;
        });

        // Hitung peak hari ini
        const today = new Date().toDateString();
        const peakToday = data.peakHistory?.[today] || activeUsers.length;

        // Update active users (hapus yang expired)
        data.activeUsers = activeUsers;
        
        // Simpan peak hari ini
        if (!data.peakHistory) data.peakHistory = {};
        if (activeUsers.length > (data.peakHistory[today] || 0)) {
            data.peakHistory[today] = activeUsers.length;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        }

        res.json({
            success: true,
            totalActive: activeUsers.length,
            users: activeUsers,
            peakToday: data.peakHistory[today] || activeUsers.length
        });

    } catch (error) {
        console.error('Error in cekusr:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}