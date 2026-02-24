const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
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

    // Validasi format key (hanya angka dan huruf)
    if (!/^[a-zA-Z0-9]+$/.test(key)) {
        return res.status(400).json({
            success: false,
            error: 'Key hanya boleh berisi huruf dan angka'
        });
    }

    try {
        // Baca file data
        const dataPath = path.join(process.cwd(), 'data', 'keys.json');
        let data = { keys: [], activeUsers: [] };

        // Buat folder data jika belum ada
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Baca file jika ada
        if (fs.existsSync(dataPath)) {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }

        // Cek apakah key sudah ada
        if (data.keys.find(k => k.key === key)) {
            return res.json({ 
                success: false, 
                error: 'Key sudah ada!' 
            });
        }

        // Tambah key baru
        data.keys.push({
            key: key,
            deviceId: null,
            createdAt: new Date().toISOString(),
            isActive: false,
            lastUsed: null,
            totalUses: 0
        });

        // Simpan data
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        res.json({ 
            success: true, 
            message: `✅ Key ${key} berhasil ditambahkan!` 
        });

    } catch (error) {
        console.error('Error in addkey:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}