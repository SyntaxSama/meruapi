const fastify = require('fastify')({ logger: false });
const path = require('path');

// Import all your scrapers (same as before)
const { scrapeAnimeTosho } = require('./scrapers/torrents/animetosho');
const { scrapeNyaa } = require('./scrapers/torrents/nyaa');
const { scrapeAniRena } = require('./scrapers/torrents/anirena');
const { scrapeSeadex } = require('./scrapers/torrents/seadex');

// Manga scrapers
const { searchMangaFreak, getMangaFreakChapters, getMangaFreakPages } = require('./scrapers/manga/mangafreak');
const { searchComicK, getComicKChapters, getComicKPages } = require('./scrapers/manga/comick');
const { searchMangaFox, getMangaFoxChapters, getMangaFoxPages } = require('./scrapers/manga/mangafox');
const { searchMangaPill, getMangaPillChapters, getMangaPillPages } = require('./scrapers/manga/mangapill');

// Streaming scrapers
const { scrapeZoroEpList, scrapeZoroEpStream, scrapeZoroSearch } = require('./scrapers/streaming/zorotv');
const { scrapeAnimeggSearch, scrapeAnimeggEpList, scrapeAnimeggEpStream } = require('./scrapers/streaming/animegg');
const { scrapeAnimepaheSearch, scrapeAnimepaheEpList, scrapeAnimepaheEpStream } = require('./scrapers/streaming/animepahe');
const { scrape123AnimesSearch, scrape123AnimesEpList, scrape123AnimesEpStream } = require('./scrapers/streaming/123animes');

// Novel scrapers
const { scrapeNovelbinSearch, scrapeNovelbinChapters, scrapeNovelbinChapterContent } = require('./scrapers/novels/novelbin');

// Metadata scrapers
const { searchTheTVDB, scrapeTVDBMetadata } = require('./scrapers/metadata/thetvdb');
const { fetchNewAnimeEpisodes } = require('./scrapers/metadata/newepisodes');
const { fetchTrendingAnime } = require('./scrapers/metadata/trending');

// Serve static files
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Basic route
fastify.get('/api', async (request, reply) => {
  return reply.sendFile('index.html');
});

// ================================
//         Novel Scrapers
// ================================

// NovelBin Search
fastify.get('/api/novels/novelbin/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    const results = await scrapeNovelbinSearch(q);
    return results;
  } catch (err) {
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// NovelBin Chapters
fastify.get('/api/novels/novelbin/chapters', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const chapters = await scrapeNovelbinChapters(url);
    return chapters;
  } catch (err) {
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// NovelBin Read
fastify.get('/api/novels/novelbin/read', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const chapterContent = await scrapeNovelbinChapterContent(url);
    return chapterContent;
  } catch (err) {
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// ================================
//        Streaming Scrapers
// ================================

// 123Animes Search
fastify.get('/api/streaming/123animes/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    const results = await scrape123AnimesSearch(q);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/123animes/search: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// 123Animes Episodes
fastify.get('/api/streaming/123animes/episodes', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const episodeList = await scrape123AnimesEpList(url);
    return episodeList;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/123animes/episodes: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// 123Animes Stream
fastify.get('/api/streaming/123animes/stream', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const streamSources = await scrape123AnimesEpStream(url);
    return streamSources;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/123animes/stream: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// Animepahe Search
fastify.get('/api/streaming/animepahe/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    const results = await scrapeAnimepaheSearch(q);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animepahe/search: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// Animepahe Episodes
fastify.get('/api/streaming/animepahe/episodes', {
  schema: {
    querystring: {
      type: 'object',
      required: ['anime_session_id'],
      properties: {
        anime_session_id: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { anime_session_id } = request.query;
    const results = await scrapeAnimepaheEpList(anime_session_id);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animepahe/episodes: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// Animepahe Stream
fastify.get('/api/streaming/animepahe/stream', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const results = await scrapeAnimepaheEpStream(url);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animepahe/stream: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// AnimeGG Search
fastify.get('/api/streaming/animegg/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    const results = await scrapeAnimeggSearch(q);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animegg/search: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// AnimeGG Episodes
fastify.get('/api/streaming/animegg/episodes', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const results = await scrapeAnimeggEpList(url);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animegg/episodes: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// AnimeGG Stream
fastify.get('/api/streaming/animegg/stream', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const results = await scrapeAnimeggEpStream(url);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/animegg/stream: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// ZoroTV Search
fastify.get('/api/streaming/zoro/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    const results = await scrapeZoroSearch(q);
    return results;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/zoro/search: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// ZoroTV Episodes
fastify.get('/api/streaming/zoro/episodes', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const episodeList = await scrapeZoroEpList(url);
    return episodeList;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/zoro/episodes: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// ZoroTV Stream
fastify.get('/api/streaming/zoro/stream', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    const streamSources = await scrapeZoroEpStream(url);
    return streamSources;
  } catch (err) {
    fastify.log.error(`Error in /api/streaming/zoro/stream: ${err.message}`);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message });
  }
});

// ================================
//          Manga Scrapers
// ================================

// ComicK Search
fastify.get('/api/manga/comick/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { q } = request.query;
  try {
    const results = await searchComicK(q);
    if (!results.length) {
      reply.code(404).send({ error: 'No manga found for the query' });
      return;
    }
    return results;
  } catch (error) {
    fastify.log.error(`API error: ${error.message}`);
    reply.code(500).send({ error: 'Failed to search manga', details: error.message });
  }
});

fastify.get('/api/manga/comick/chapters', {
  schema: {
    querystring: {
      type: 'object',
      required: ['hid'],
      properties: {
        hid: { type: 'string' },
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1 }
      }
    }
  }
}, async (request, reply) => {
  const { hid, page = 1, limit } = request.query;
  try {
    const { chapters, total } = await getComicKChapters(hid, page, limit);
    if (!chapters.length) {
      reply.code(404).send({ error: 'No chapters found for the manga' });
      return;
    }
    return {
      total,
      page,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
      chapters
    };
  } catch (error) {
    fastify.log.error(`API error: ${error.message}`);
    reply.code(500).send({ error: 'Failed to fetch chapters', details: error.message });
  }
});

fastify.get('/api/manga/comick/pages', {
  schema: {
    querystring: {
      type: 'object',
      required: ['hid'],
      properties: {
        hid: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { hid } = request.query;
  try {
    const pages = await getComicKPages(hid);
    if (!pages.length) {
      reply.code(404).send({ error: 'No pages found for the chapter' });
      return;
    }
    return pages;
  } catch (error) {
    fastify.log.error(`API error: ${error.message}`);
    reply.code(500).send({ error: 'Failed to fetch pages', details: error.message });
  }
});

// MangaFreak Search
fastify.get('/api/manga/mangafreak/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { q } = request.query;
  try {
    const results = await searchMangaFreak(q);
    return results;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to search MangaFreak' });
  }
});

// MangaFreak Chapters
fastify.get('/api/manga/mangafreak/chapters', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const chapters = await getMangaFreakChapters(url);
    return chapters;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch chapters' });
  }
});

// MangaFreak Pages
fastify.get('/api/manga/mangafreak/pages', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const pages = await getMangaFreakPages(url);
    return pages;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch pages' });
  }
});

// MangaFox Search
fastify.get('/api/manga/mangafox/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { q } = request.query;
  try {
    const results = await searchMangaFox(q);
    return results;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to search MangaFox' });
  }
});

// MangaFox Chapters
fastify.get('/api/manga/mangafox/chapters', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const chapters = await getMangaFoxChapters(url);
    return chapters;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch chapters' });
  }
});

// MangaFox Pages
fastify.get('/api/manga/mangafox/pages', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const pages = await getMangaFoxPages(url);
    return pages;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch pages' });
  }
});

// MangaPill Search
fastify.get('/api/manga/mangapill/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { q } = request.query;
  try {
    const results = await searchMangaPill(q);
    return results;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to search MangaPill' });
  }
});

// MangaPill Chapters
fastify.get('/api/manga/mangapill/chapters', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const chapters = await getMangaPillChapters(url);
    return chapters;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch chapters' });
  }
});

// MangaPill Pages
fastify.get('/api/manga/mangapill/pages', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', format: 'uri' }
      }
    }
  }
}, async (request, reply) => {
  const { url } = request.query;
  try {
    const pages = await getMangaPillPages(url);
    return pages;
  } catch (err) {
    fastify.log.error(err.message);
    reply.code(500).send({ error: 'Failed to fetch pages' });
  }
});

// ================================
//     Anime Torrent Scrapers
// ================================

// AnimeTosho
fastify.get('/api/torrent/animetosho', {
  schema: {
    querystring: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { query } = request.query;
    const torrents = await scrapeAnimeTosho(query);
    return { result: torrents };
  } catch (err) {
    fastify.log.error('API Error:', err);
    reply.code(500).send({ error: 'Failed to fetch torrents', details: err.message });
  }
});

// Nyaa
fastify.get('/api/torrent/nyaa', {
  schema: {
    querystring: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { query } = request.query;
    const torrents = await scrapeNyaa(query);
    return { result: torrents };
  } catch (err) {
    fastify.log.error('API Error:', err);
    reply.code(500).send({ error: 'Failed to fetch torrents', details: err.message });
  }
});

// AniRena
fastify.get('/api/torrent/anirena', {
  schema: {
    querystring: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { query } = request.query;
    const torrents = await scrapeAniRena(query);
    return { result: torrents };
  } catch (err) {
    fastify.log.error('API Error:', err);
    reply.code(500).send({ error: 'Failed to fetch torrents', details: err.message });
  }
});

// SeaDex
fastify.get('/api/torrent/seadex', {
  schema: {
    querystring: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { query } = request.query;
  try {
    const torrents = await scrapeSeadex(query);
    if (!torrents.length) {
      reply.code(404).send({ error: 'No torrents found for the query' });
      return;
    }
    const bestTorrent = torrents[0];
    return { success: true, torrent: bestTorrent };
  } catch (error) {
    fastify.log.error(`API error: ${error.message}`);
    reply.code(500).send({ error: 'Failed to scrape torrents', details: error.message });
  }
});

// ================================
//        Metadata Scrapers
// ================================

// New Anime Episodes
fastify.get('/api/metadata/animeapi/new', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { page = 1 } = request.query;
    const data = await fetchNewAnimeEpisodes(page);
    const filteredData = data.map(({ link_url, embed_url, ...rest }) => rest);
    return filteredData;
  } catch (err) {
    fastify.log.error('[API Route Error]', err.message);
    reply.code(500).send({ error: err.message || 'Internal server error' });
  }
});

// Trending Anime
fastify.get('/api/metadata/animeapi/trending', async (request, reply) => {
  try {
    const data = await fetchTrendingAnime();
    const filteredData = data.map(({ link_url, embed_url, ...rest }) => rest);
    return filteredData;
  } catch (err) {
    fastify.log.error('[API Route Error]', err.message);
    reply.code(500).send({ error: err.message || 'Internal server error' });
  }
});

// TheTVDB Search
fastify.get('/api/metadata/thetvdb/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { q } = request.query;
    fastify.log.info(`[Search] Query: ${q}`);
    const results = await Promise.race([
      searchTheTVDB(q)
    ]);
    return results;
  } catch (err) {
    fastify.log.error('Search endpoint error:', err.message);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message || 'Internal server error' });
  }
});

// TheTVDB Data
fastify.get('/api/metadata/thetvdb/data', {
  schema: {
    querystring: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', pattern: '^https://www.thetvdb.com' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { url } = request.query;
    fastify.log.info(`[Scrape] URL: ${url}`);
    const metadata = await Promise.race([
      scrapeTVDBMetadata(url)
    ]);

    if (!metadata) {
      reply.code(500).send({ error: 'Failed to scrape metadata' });
      return;
    }

    return metadata;
  } catch (err) {
    fastify.log.error('Scrape endpoint error:', err.message);
    reply.code(err.cause?.statusCode || 500).send({ error: err.message || 'Internal server error' });
  }
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info(`Server running at http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();