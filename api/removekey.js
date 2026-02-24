const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    const { key, chatId } = req.body;

    // Verifikasi admin
    if (chatId !== process.env.ADMIN_CHAT_ID) {
        return res.status(403).json({ 
            success: false,
            error: 'Unauthorized' 
        });
    }

    if (!key) {
        return res.status(400).json({
            success: false,
            error: 'Key tidak boleh kosong'
        });
    }

    try {
        const dataPath = path.join(process.cwd(), 'data', 'keys.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.json({ 
                success: false, 
                error: 'Data tidak ditemukan' 
            });
        }

        let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // Cek apakah key ada
        const keyExists = data.keys.find(k => k.key === key);
        if (!keyExists) {
            return res.json({ 
                success: false, 
                error: 'Key tidak ditemukan' 
            });
        }

        // Hapus key dari daftar keys
        data.keys = data.keys.filter(k => k.key !== key);
        
        // Hapus juga dari active users jika ada
        data.activeUsers = data.activeUsers.filter(u => u.key !== key);

        // Simpan data
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        res.json({ 
            success: true, 
            message: `✅ Key ${key} berhasil dihapus!` 
        });

    } catch (error) {
        console.error('Error in removekey:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}