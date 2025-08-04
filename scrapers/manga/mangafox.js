const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

// Base URLs
const MANGA_BASE = 'https://fanfox.net';
const MANGA_MOBILE = 'https://m.fanfox.net';

// Configure axios with headers and rate limiting
axios.defaults.headers.common['Referer'] = `${MANGA_BASE}/`;
// Optional: Add rate limiting (1 request per second)
// const rateLimit = require('axios-rate-limit');
// const axiosLimited = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 1000 });
// Use axiosLimited instead of axios if rate limiting is enabled.

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

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    // Set cookies for mobile URL
    await context.addCookies([
      { name: 'readway', value: '2', url: MANGA_MOBILE },
      { name: 'isAdult', value: '1', url: MANGA_BASE }
    ]);

    const page = await context.newPage();
    const mobilePath = chapterUrl.replace(`${MANGA_BASE}/manga/`, `${MANGA_MOBILE}/roll_manga/`);
    await page.goto(mobilePath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const imageElements = await page.$$eval('#viewer img', imgs => imgs.map(img => img.getAttribute('data-original')).filter(src => src));
    return imageElements;
  } catch (err) {
    console.error('Pages error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = {
  searchMangaFox,
  getMangaFoxChapters,
  getMangaFoxPages
};