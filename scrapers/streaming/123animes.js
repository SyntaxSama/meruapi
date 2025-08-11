const { chromium } = require('playwright');
const asyncRetry = require('async-retry');

const BASE_URL = 'https://w1.123animes.ru';
const DEFAULT_PAGE_TIMEOUT = 15000;

function determineMediaTypeFromTitle(title) {
  title = title.toLowerCase();
  if (title.includes('movie')) return 'Movie';
  if (title.includes('ona')) return 'ONA';
  if (title.includes('ova')) return 'OVA';
  if (title.includes('special')) return 'Special';
  return 'TV Show';
}

function SearchResults() {
  return {
    tv_shows: [],
    movies: [],
    onas: [],
    ovas: [],
    specials: []
  };
}

function EpisodeList(episodes = []) {
  return { episodes };
}

function StreamSources(streams = []) {
  return { streams };
}

async function scrape123AnimesSearch(query) {
  let browser;
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    const searchUrl = `${BASE_URL}/search?keyword=${encodeURIComponent(query)}`;

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });

    const page = await context.newPage();
    await asyncRetry(async () => {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    await page.waitForSelector('.widget-body .film-list .item', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Search results selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const articles = $('.widget-body .film-list .item');
    const results = SearchResults();

    articles.each((i, article) => {
      const $article = $(article);
      const url = $article.find('a.poster').attr('href');
      if (!url) return;

      const title = $article.find('a.name').attr('data-jtitle') || $article.find('a.name').text().trim() || 'Unknown Title';
      const imageTag = $article.find('img');
      const imageUrl = imageTag.attr('src') || imageTag.attr('data-src') || null;
      const yearMatch = title.match(/\((\d{4})\)/);
      let year = yearMatch ? yearMatch[1] : null;

      const tooltipUrl = $article.find('a.poster').attr('data-tip');
      if (tooltipUrl && !year) {
        const tooltipMatch = tooltipUrl.match(/\/(\d{4})\//);
        year = tooltipMatch ? tooltipMatch[1] : null;
      }

      let cleanTitle = title;
      if (year) cleanTitle = title.replace(/\(\d{4}\)/, '').trim();

      const mediaType = determineMediaTypeFromTitle(cleanTitle);
      const audioType = $article.find('.status .sub').length ? 'sub' : ($article.find('.status .dub').length ? 'dub' : 'sub');

      const commonData = {
        title: cleanTitle,
        url: url.startsWith('http') ? url : new URL(url, BASE_URL).href,
        image: BASE_URL + imageUrl,
        media_type: mediaType,
        audio_type: audioType,
        source: '123Animes',
      };

      if (mediaType === 'TV Show') results.tv_shows.push(commonData);
      else if (mediaType === 'Movie') results.movies.push(commonData);
      else if (mediaType === 'ONA') results.onas.push(commonData);
      else if (mediaType === 'OVA') results.ovas.push(commonData);
      else if (mediaType === 'Special') results.specials.push(commonData);
      else results.tv_shows.push(commonData);
    });

    if (!results.tv_shows.length && !results.movies.length && !results.onas.length && !results.ovas.length && !results.specials.length) {
      console.log(`No anime found for '${query}' on 123Animes`);
    }

    return results;
  } catch (err) {
    console.error(`❌ 123Animes search error: ${err.message}`);
    throw new Error(`Error while searching 123Animes: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrape123AnimesEpList(url) {
  let browser;
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL. Must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });

    const page = await context.newPage();
    await asyncRetry(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 2, minTimeout: 1000, maxTimeout: 5000 });

    await page.waitForSelector('ul.episodes.range li', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Episode selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const listItems = $('ul.episodes.range li');
    const episodes = [];

    listItems.each((i, li) => {
      const $li = $(li);
      const aTag = $li.find('a');
      if (!aTag.length) return;

      const href = aTag.attr('href');
      const episodeNumStr = $li.text().trim().match(/Episode (\d+)/i)?.[1] || `${i + 1}`;
      const title = $li.text().trim() || `Episode ${episodeNumStr}`;

      let episodeNum;
      try {
        episodeNum = parseInt(episodeNumStr, 10);
      } catch (err) {
        console.warn(`Could not parse episode number: '${episodeNumStr}' for URL: ${href}`);
        episodeNum = i + 1;
      }

      episodes.push({
        number: episodeNum,
        title,
        url: href && href.startsWith('http') ? href : new URL(href, BASE_URL).href
      });
    });

    const seenUrls = new Set();
    const uniqueEpisodes = episodes.filter(ep => {
      if (seenUrls.has(ep.url)) return false;
      seenUrls.add(ep.url);
      return true;
    }).sort((a, b) => a.number - b.number);

    if (!uniqueEpisodes.length) {
      console.error('No episodes found on 123Animes.');
      throw new Error('No episodes found on 123Animes', { cause: { statusCode: 404 } });
    }

    return EpisodeList(uniqueEpisodes);
  } catch (err) {
    console.error(`❌ 123Animes episodes error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping 123Animes episode list: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrape123AnimesEpStream(url) {
  let browser;
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL. Must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });

    const page = await context.newPage();
    await asyncRetry(async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 2, minTimeout: 1000, maxTimeout: 5000 });

    const serverName = 'F5 - HQ';

    await page.waitForSelector('.player-container #player #iframe_ext82377 iframe', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Stream selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const streams = [];
    const addedUrls = new Set();

    const iframe = $('.player-container #player #iframe_ext82377 iframe');
    if (iframe.length && iframe.attr('src')) {
      const rawUrl = iframe.attr('src');
      const streamUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, BASE_URL).href;

      let audioType = 'sub';
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      if (pageText.includes('dub') || url.toLowerCase().includes('dub')) {
        audioType = 'dub';
      }

      if (!addedUrls.has(streamUrl)) {
        addedUrls.add(streamUrl);
        streams.push({
          url: streamUrl,
          server: serverName,
          type: 'embed',
          source: '123Animes',
          audio_type: audioType
        });
      }
    }

    if (!streams.length) {
      console.error(`No streaming URLs found on 123Animes for ${url}`);
      throw new Error('No streaming URLs found on 123Animes', { cause: { statusCode: 404 } });
    }

    return StreamSources(streams);
  } catch (err) {
    console.error(`❌ 123Animes stream error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping 123Animes episode stream: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrape123AnimesSearch, scrape123AnimesEpList, scrape123AnimesEpStream };