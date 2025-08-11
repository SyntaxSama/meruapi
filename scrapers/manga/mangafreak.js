const axios = require('axios');
const cheerio = require('cheerio');

const MANGA_BASE = 'https://mangafreak.net';

async function searchMangaFreak(query) {
  const url = `${MANGA_BASE}/Find/${encodeURIComponent(query)}`;
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const results = [];

  $('.manga_search_item').each((_, el) => {
    const title = $(el).find('h3 a').text().trim();
    const relativeUrl = $(el).find('h3 a').attr('href');
    const mangaUrl = new URL(relativeUrl, MANGA_BASE).href;
    const thumbnail = $(el).find('img').attr('src');

    results.push({ title, url: mangaUrl, thumbnail });
  });

  return results;
}

async function getMangaFreakChapters(mangaUrl) {
  if (!mangaUrl || !mangaUrl.startsWith('http')) throw new Error('Invalid manga URL');
  const res = await axios.get(mangaUrl);
  const $ = cheerio.load(res.data);
  const chapters = [];

  $('.manga_series_list tr').slice(1).each((_, row) => {
    const anchor = $(row).find('td a');
    const chapterTitle = anchor.text().trim();
    const chapterLink = new URL(anchor.attr('href'), MANGA_BASE).href;
    chapters.push({ chapter: chapterTitle, url: chapterLink });
  });

  return chapters;
}

async function getMangaFreakPages(chapterUrl) {
  if (!chapterUrl.startsWith('http')) throw new Error('Invalid URL');
  
  const res = await axios.get(chapterUrl);
  const $ = cheerio.load(res.data);
  const imageUrls = [];

  // Extract image URLs directly from HTML
  $('img#gohere').each((_, img) => {
    imageUrls.push($(img).attr('src'));
  });

  return imageUrls;
}

module.exports = {
  searchMangaFreak,
  getMangaFreakChapters,
  getMangaFreakPages
};
