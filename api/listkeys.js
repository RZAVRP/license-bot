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
                total: 0, 
                keys: [] 
            });
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // Sort keys by createdAt (newest first)
        const sortedKeys = data.keys.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            total: sortedKeys.length,
            keys: sortedKeys
        });

    } catch (error) {
        console.error('Error in listkeys:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
}