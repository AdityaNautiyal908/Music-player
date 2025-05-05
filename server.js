const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

// Replace with your actual RapidAPI key
const RAPIDAPI_KEY = 'bf4a0f48bdmsh1561abafaae5a89p1101b8jsn167d7655c41e';

// Route to get lyrics by Spotify track ID
app.get('/api/lyrics', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Missing track id' });
    }

    const options = {
        method: 'GET',
        url: 'https://spotify23.p.rapidapi.com/track_lyrics/',
        params: { id },
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'spotify23.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lyrics', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});