const express = require('express');
const path = require('path');

// Torrent Servers
const { scrapeAnimeTosho } = require('./scrapers/torrents/animetosho');
const { scrapeNyaa } = require('./scrapers/torrents/nyaa');
const { scrapeAniRena } = require('./scrapers/torrents/anirena');
const { scrapeSeadex } = require('./scrapers/torrents/seadex');

// Manga Servers
const { searchMangaFreak, getMangaFreakChapters, getMangaFreakPages } = require('./scrapers/manga/mangafreak');

// Streaming Servers
const { scrapeZoroEpList, scrapeZoroEpStream, scrapeZoroSearch } = require('./scrapers/streaming/zorotv');
const { scrapeAnimeggSearch, scrapeAnimeggEpList, scrapeAnimeggEpStream } = require('./scrapers/streaming/animegg');


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================================
//        Streaming Scrapers
// ================================


//
// ========== AnimeGG ==========
//
app.get('/api/streaming/animegg/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });
    const results = await scrapeAnimeggSearch(query);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animegg/search: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/animegg/episodes', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });
    const results = await scrapeAnimeggEpList(url);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animegg/episodes: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/animegg/stream', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });
    const results = await scrapeAnimeggEpStream(url);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animegg/stream: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

//
// ========== ZoroTV ==========
//
app.get('/api/streaming/zoro/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const results = await scrapeZoroSearch(query);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/zoro/search: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/zoro/episodes', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const episodeList = await scrapeZoroEpList(url);
    res.json(episodeList);
  } catch (err) {
    console.error(`Error in /api/streaming/zoro/episodes: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/zoro/stream', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const streamSources = await scrapeZoroEpStream(url);
    res.json(streamSources);
  } catch (err) {
    console.error(`Error in /api/streaming/zoro/stream: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});


// ================================
//          Manga Scrapers
// ================================


//
// ========== MangaFreak ==========
//
app.get('/api/manga/mangafreak', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const results = await searchMangaFreak(q);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to search MangaFreak' });
  }
});

app.get('/api/manga/mangafreak/chapters', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid manga url' });

  try {
    const chapters = await getMangaFreakChapters(url);
    res.json(chapters);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

app.get('/api/manga/mangafreak/pages', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid chapter url' });

  try {
    const pages = await getMangaFreakPages(url);
    res.json(pages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// ================================
//     Anime Torrent Scrapers
// ================================
app.get('/api/torrent/animetosho', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const torrents = await scrapeAnimeTosho(query);
    res.status(200).json({ result: torrents });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Failed to fetch torrents', details: err.message });
  }
});

app.get('/api/torrent/nyaa', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const torrents = await scrapeNyaa(query);
    res.status(200).json({ result: torrents });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Failed to fetch torrents', details: err.message });
  }
});

app.get('/api/torrent/anirena', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const torrents = await scrapeAniRena(query);
    res.status(200).json({ result: torrents });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Failed to fetch torrents', details: err.message });
  }
});

app.get('/api/torrent/seadex', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const torrents = await scrapeSeadex(query);
    if (!torrents.length) {
      return res.status(404).json({ error: 'No torrents found for the query' });
    }
    const bestTorrent = torrents[0];
    res.json({ success: true, torrent: bestTorrent });
  } catch (error) {
    console.error(`API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to scrape torrents', details: error.message });
  }
});




// ================================
//        Start API Server
// ================================
app.listen(3000, () => {
  console.log(`Server running at http://localhost:3000`);
});