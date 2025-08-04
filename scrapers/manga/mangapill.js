const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

// Base URL
const MANGA_BASE = 'https://mangapill.com';

// Configure axios with headers
axios.defaults.headers.common['Referer'] = `${MANGA_BASE}/`;

async function searchMangaPill(query) {
  try {
    const url = `${MANGA_BASE}/search?page=1&q=${encodeURIComponent(query)}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const results = [];

    $('.grid > div:not([class])').each((_, el) => {
      const anchor = $(el).find('a').first();
      const title = $(el).find('div[class] > a').text().trim() || '';
      const relativeUrl = anchor.attr('href') || '';
      const mangaUrl = new URL(relativeUrl, MANGA_BASE).href;
      const thumbnail = $(el).find('img').attr('data-src') || '';
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
  if (!mangaUrl || !mangaUrl.startsWith('http')) {
    throw new Error('Invalid manga URL');
  }
  try {
    const res = await axios.get(mangaUrl);
    const $ = cheerio.load(res.data);
    const chapters = [];

    $('#chapters > div > a').each((_, el) => {
      const relativeUrl = $(el).attr('href') || '';
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
  if (!chapterUrl || !chapterUrl.startsWith('http')) {
    throw new Error('Invalid chapter URL');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'Referer': MANGA_BASE + '/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    }
  });
  try {
    const page = await context.newPage();

    // Preload cookies by visiting the homepage
    await page.goto(MANGA_BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Navigate to the chapter page
    await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for CAPTCHA or Cloudflare
    const content = await page.content();
    if (content.includes('captcha') || content.includes('Cloudflare')) {
      console.warn('CAPTCHA or Cloudflare detected. Manual intervention may be required.');
      return [];
    }

    // Extract image URLs
    const imageUrls = await page.$$eval('picture img', imgs => 
      imgs.map(img => img.getAttribute('data-src')).filter(src => src)
    );

    if (!imageUrls.length) {
      console.error('No images found for chapter:', chapterUrl);
      return [];
    }

    return imageUrls.map(url => ({
      url,
      headers: { 'Referer': MANGA_BASE + '/' }
    }));
  } catch (err) {
    console.error('Pages error:', err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = {
  searchMangaPill,
  getMangaPillChapters,
  getMangaPillPages
};