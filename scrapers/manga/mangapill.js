const axios = require('axios');
const cheerio = require('cheerio');

const MANGA_BASE = 'https://mangapill.com';

const http = axios.create({
  baseURL: MANGA_BASE,
  headers: {
    'Referer': `${MANGA_BASE}/`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  },
  timeout: 10000
});

async function searchMangaPill(query) {
  try {
    const url = `/search?page=1&q=${encodeURIComponent(query)}`;
    const { data } = await http.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $('.grid > div:not([class])').each((_, el) => {
      const anchor = $(el).find('a').first();
      const title = $(el).find('div[class] > a').text().trim();
      const relativeUrl = anchor.attr('href');
      const mangaUrl = new URL(relativeUrl, MANGA_BASE).href;
      const thumbnail = $(el).find('img').attr('data-src');

      if (title && mangaUrl) {
        results.push({ title, url: mangaUrl, thumbnail });
      }
    });

    return results;
  } catch (err) {
    console.error('Search error:', err.message);
    return [];
  }
}

async function getMangaPillChapters(mangaUrl) {
  if (!mangaUrl?.startsWith('http')) {
    throw new Error('Invalid manga URL');
  }

  try {
    const { data } = await http.get(new URL(mangaUrl).pathname);
    const $ = cheerio.load(data);
    const chapters = [];

    $('#chapters > div > a').each((_, el) => {
      const relativeUrl = $(el).attr('href');
      const chapterUrl = new URL(relativeUrl, MANGA_BASE).href;
      const chapterTitle = $(el).text().trim() || 'Unknown Chapter';
      
      if (chapterUrl) {
        chapters.push({ chapter: chapterTitle, url: chapterUrl });
      }
    });

    return chapters;
  } catch (err) {
    console.error('Chapters error:', err.message);
    return [];
  }
}

async function getMangaPillPages(chapterUrl) {
  if (!chapterUrl?.startsWith('http')) {
    throw new Error('Invalid chapter URL');
  }

  try {
    const { data } = await http.get(new URL(chapterUrl).pathname);
    const $ = cheerio.load(data);
    const cheerioImages = $('picture img').map((_, img) => $(img).attr('data-src')).get();

    if (cheerioImages.length > 0) {
      return cheerioImages.map(url => ({
        url,
        headers: { 'Referer': MANGA_BASE + '/' }
      }));
    }
  } catch (err) {
    console.error('Pages error:', err.message);
    return [];
  }
}

module.exports = {
  searchMangaPill,
  getMangaPillChapters,
  getMangaPillPages,
};