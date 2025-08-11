const axios = require('axios');
const cheerio = require('cheerio');

const MANGA_BASE = 'https://fanfox.net';
const MANGA_MOBILE = 'https://m.fanfox.net';
axios.defaults.headers.common['Referer'] = `${MANGA_BASE}/`;

async function searchMangaFox(query) {
  try {
    const url = `${MANGA_BASE}/search?title=${encodeURIComponent(query)}&stype=1`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const results = [];

    $('ul.manga-list-4-list li').each((_, el) => {
      const anchor = $(el).find('a').first();
      const title = anchor.attr('title')?.trim() || '';
      const relativeUrl = anchor.attr('href') || '';
      const mangaUrl = new URL(relativeUrl, MANGA_BASE).href;
      const thumbnail = $(el).find('img').attr('src') || '';
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

async function getMangaFoxChapters(mangaUrl) {
  if (!mangaUrl || !mangaUrl.startsWith('http')) {
    throw new Error('Invalid manga URL');
  }
  try {
    const res = await axios.get(mangaUrl);
    const $ = cheerio.load(res.data);
    const chapters = [];

    $('ul.detail-main-list li a').each((_, el) => {
      const relativeUrl = $(el).attr('href') || '';
      const chapterUrl = new URL(relativeUrl, MANGA_BASE).href;
      const chapterTitle = $(el).find('.detail-main-list-main p').first().text().trim() || 'Unknown Chapter';
      const dateText = $(el).find('.detail-main-list-main p').last().text().trim() || '';
      const date = parseChapterDate(dateText);
      if (chapterUrl) {
        chapters.push({ chapter: chapterTitle, url: chapterUrl, date });
      }
    });

    return chapters;
  } catch (err) {
    console.error('Chapters error:', err.message);
    return [];
  }
}

function parseChapterDate(date) {
  try {
    if (date.includes('Today') || date.includes(' ago')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    } else if (date.includes('Yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday.getTime();
    } else {
      const parsed = new Date(Date.parse(date));
      return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }
  } catch (err) {
    console.warn('Date parsing error:', err.message);
    return 0;
  }
}

async function getMangaFoxPages(chapterUrl) {
  if (!chapterUrl || !chapterUrl.startsWith('http')) {
    throw new Error('Invalid chapter URL');
  }
  try {

    const mobilePath = chapterUrl.replace(
      `${MANGA_BASE}/manga/`,
      `${MANGA_MOBILE}/roll_manga/`
    );

    const res = await fetch(mobilePath, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Cookie': `readway=2; isAdult=1`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const imageElements = $('#viewer img')
      .map((_, img) => $(img).attr('data-original'))
      .get()
      .filter(src => !!src);

    return imageElements;
  } catch (err) {
    console.error('Pages error:', err.message);
    return [];
  }
}

module.exports = {
  searchMangaFox,
  getMangaFoxChapters,
  getMangaFoxPages
};