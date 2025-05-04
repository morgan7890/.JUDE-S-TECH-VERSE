require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ytsr = require('ytsr');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Search endpoint
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Please provide a search query' });

        const filters = await ytsr.getFilters(query);
        const filter = filters.get('Type').get('Video');
        const searchResults = await ytsr(filter.url, { limit: 1 });

        if (!searchResults.items.length) {
            return res.status(404).json({ error: 'No results found' });
        }

        const video = searchResults.items[0];
        res.json({
            title: video.title,
            thumbnail: video.bestThumbnail.url,
            duration: video.duration,
            channel: video.author.name,
            views: video.views,
            url: video.url
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
});

// Download endpoint - Fixed to handle David Cyril's API properly
app.get('/api/download', async (req, res) => {
    try {
        const { url, type } = req.query;
        if (!url || !type) return res.status(400).json({ error: 'Missing parameters' });

        // David Cyril's API endpoints
        const apiUrl = type === 'audio' 
            ? `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(url)}`
            : `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(url)}`;

        // First get the JSON response with download URL
        const apiResponse = await axios.get(apiUrl);
        
        if (!apiResponse.data?.success || !apiResponse.data?.result?.download_url) {
            throw new Error('Invalid response from David API');
        }

        // Get the actual media file
        const mediaResponse = await axios.get(apiResponse.data.result.download_url, {
            responseType: 'stream'
        });

        // Set proper headers for file download
        res.header('Content-Disposition', `attachment; filename="${apiResponse.data.result.title.replace(/[^\w\s]/gi, '')}.${type === 'audio' ? 'mp3' : 'mp4'}"`);
        res.header('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');

        // Stream the media file to client
        mediaResponse.data.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: 'Download failed',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
