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
            valid: false,
            message: 'Method not allowed' 
        });
    }

    const { key, deviceId } = req.body;

    if (!key || !deviceId) {
        return res.json({ 
            valid: false, 
            message: 'Key dan Device ID diperlukan!' 
        });
    }

    try {
        // Baca file data
        const dataPath = path.join(process.cwd(), 'data', 'keys.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.json({ 
                valid: false, 
                message: 'Sistem lisensi belum diinisialisasi!' 
            });
        }

        let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // Cari key
        const keyIndex = data.keys.findIndex(k => k.key === key);

        if (keyIndex === -1) {
            return res.json({ 
                valid: false, 
                message: '❌ Key tidak ditemukan!' 
            });
        }

        const keyData = data.keys[keyIndex];

        // Cek apakah key sudah dipakai device lain
        if (keyData.isActive && keyData.deviceId !== deviceId) {
            return res.json({ 
                valid: false, 
                message: '❌ Key sudah dipakai device lain!' 
            });
        }

        // Update status key
        const now = new Date().toISOString();
        
        if (!keyData.isActive) {
            data.keys[keyIndex].isActive = true;
            data.keys[keyIndex].deviceId = deviceId;
            data.keys[keyIndex].lastUsed = now;
            data.keys[keyIndex].totalUses = (data.keys[keyIndex].totalUses || 0) + 1;

            // Tambah ke active users
            data.activeUsers.push({
                key: key,
                deviceId: deviceId,
                lastSeen: now
            });
        } else {
            // Update last seen
            data.keys[keyIndex].lastUsed = now;
            data.keys[keyIndex].totalUses = (data.keys[keyIndex].totalUses || 0) + 1;
            
            // Update di active users
            const userIndex = data.activeUsers.findIndex(u => u.key === key);
            if (userIndex !== -1) {
                data.activeUsers[userIndex].lastSeen = now;
            } else {
                data.activeUsers.push({
                    key: key,
                    deviceId: deviceId,
                    lastSeen: now
                });
            }
        }

        // Simpan data
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        res.json({ 
            valid: true, 
            message: '✅ Key valid! Script dapat dijalankan.',
            deviceId: deviceId,
            expiresIn: 'Unlimited'
        });

    } catch (error) {
        console.error('Error in validate:', error);
        res.status(500).json({ 
            valid: false, 
            message: '❌ Internal server error' 
        });
    }
}