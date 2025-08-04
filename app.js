const express = require('express');
const path = require('path');
const axiosRetry = require('axios-retry');

// Torrent Servers
const { scrapeAnimeTosho } = require('./scrapers/torrents/animetosho');
const { scrapeNyaa } = require('./scrapers/torrents/nyaa');
const { scrapeAniRena } = require('./scrapers/torrents/anirena');
const { scrapeSeadex } = require('./scrapers/torrents/seadex');

// Manga Servers
const { searchMangaFreak, getMangaFreakChapters, getMangaFreakPages } = require('./scrapers/manga/mangafreak');
const { searchComicK, getComicKChapters, getComicKPages } = require('./scrapers/manga/comick');
const { searchMangaFox, getMangaFoxChapters, getMangaFoxPages } = require('./scrapers/manga/mangafox');
const { searchMangaPill, getMangaPillChapters, getMangaPillPages } = require('./scrapers/manga/mangapill');

// Streaming Servers
const { scrapeZoroEpList, scrapeZoroEpStream, scrapeZoroSearch } = require('./scrapers/streaming/zorotv');
const { scrapeAnimeggSearch, scrapeAnimeggEpList, scrapeAnimeggEpStream } = require('./scrapers/streaming/animegg');

const { scrapeAnimepaheSearch, scrapeAnimepaheEpList, scrapeAnimepaheEpStream } = require('./scrapers/streaming/animepahe');
const { scrape123AnimesSearch, scrape123AnimesEpList, scrape123AnimesEpStream } = require('./scrapers/streaming/123animes');

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
// ========== 123Animes ==========
//
app.get('/api/streaming/123animes/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const results = await scrape123AnimesSearch(query);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/123animes/search: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/123animes/episodes', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const episodeList = await scrape123AnimesEpList(url);
    res.json(episodeList);
  } catch (err) {
    console.error(`Error in /api/streaming/123animes/episodes: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/123animes/stream', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const streamSources = await scrape123AnimesEpStream(url);
    res.json(streamSources);
  } catch (err) {
    console.error(`Error in /api/streaming/123animes/stream: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

//
// ========== Animepahe ==========
//
app.get('/api/streaming/animepahe/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });
    const results = await scrapeAnimepaheSearch(query);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animepahe/search: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/animepahe/episodes', async (req, res) => {
  try {
    const animeSessionId = req.query.anime_session_id;
    if (!animeSessionId) return res.status(400).json({ error: 'Anime session ID parameter is required' });
    const results = await scrapeAnimepaheEpList(animeSessionId);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animepahe/episodes: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/streaming/animepahe/stream', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });
    const results = await scrapeAnimepaheEpStream(url);
    res.json(results);
  } catch (err) {
    console.error(`Error in /api/streaming/animepahe/stream: ${err.message}`);
    res.status(err.cause?.statusCode || 500).json({ error: err.message });
  }
});

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
// ========== ComicK ==========
//
app.get('/api/manga/comick/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await searchComicK(query);
    if (!results.length) {
      return res.status(404).json({ error: 'No manga found for the query' });
    }
    res.json(results);
  } catch (error) {
    console.error(`API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to search manga', details: error.message });
  }
});

app.get('/api/manga/comick/chapters', async (req, res) => {
  const hid = req.query.hid;
  const page = parseInt(req.query.page) || undefined;
  const limit = parseInt(req.query.limit) || undefined;

  if (!hid) {
    return res.status(400).json({ error: 'HID parameter is required' });
  }
  if (page && page < 1) {
    return res.status(400).json({ error: 'Page must be at least 1' });
  }
  if (limit && limit < 1) {
    return res.status(400).json({ error: 'Limit must be at least 1' });
  }

  try {
    const { chapters, total } = await getComicKChapters(hid, page, limit);
    if (!chapters.length) {
      return res.status(404).json({ error: 'No chapters found for the manga' });
    }
    res.json({
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
      chapters
    });
  } catch (error) {
    console.error(`API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch chapters', details: error.message });
  }
});

app.get('/api/manga/comick/pages', async (req, res) => {
  const hid = req.query.hid;
  if (!hid) {
    return res.status(400).json({ error: 'Chapter HID parameter is required' });
  }

  try {
    const pages = await getComicKPages(hid);
    if (!pages.length) {
      return res.status(404).json({ error: 'No pages found for the chapter' });
    }
    res.json(pages);
  } catch (error) {
    console.error(`API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch pages', details: error.message });
  }
});

//
// ========== MangaFreak ==========
//
app.get('/api/manga/mangafreak/search', async (req, res) => {
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


//
// ========== MangaFox ==========
//
app.get('/api/manga/mangafox/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const results = await searchMangaFox(q);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to search MangaFox' });
  }
});

app.get('/api/manga/mangafox/chapters', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid manga url' });

  try {
    const chapters = await getMangaFoxChapters(url);
    res.json(chapters);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

app.get('/api/manga/mangafox/pages', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid chapter url' });

  try {
    const pages = await getMangaFoxPages(url);
    res.json(pages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

//
// ========== MangaPill ==========
//
app.get('/api/manga/mangapill/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const results = await searchMangaPill(q);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to search MangaPill' });
  }
});

app.get('/api/manga/mangapill/chapters', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid manga url' });

  try {
    const chapters = await getMangaPillChapters(url);
    res.json(chapters);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

app.get('/api/manga/mangapill/pages', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid chapter url' });

  try {
    const pages = await getMangaPillPages(url);
    res.json(pages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

app.get('/api/manga/mangapill/image', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('http'))
    return res.status(400).json({ error: 'Invalid image url' });

  try {
    const imageData = await getMangaPillImage(url);
    if (!imageData) {
      return res.status(500).json({ error: 'Failed to fetch image' });
    }
    res.json({ image: imageData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch image' });
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