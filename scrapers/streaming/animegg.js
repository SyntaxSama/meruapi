const { chromium } = require('playwright');
const asyncRetry = require('async-retry');

const BASE_URL = 'https://www.animegg.org';
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

async function scrapeAnimeggSearch(query) {
  let browser;
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    const searchUrl = `${BASE_URL}/search/?q=${encodeURIComponent(query)}`;

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

    await page.waitForSelector('.cblock2 .moose.page .mse', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Search results selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const articles = $('.cblock2 .moose.page .mse');
    const results = SearchResults();

    articles.each((i, article) => {
      const $article = $(article);
      const url = $article.attr('href');
      if (!url) return;

      const title = $article.find('.media-body .first h2').text().trim() || 'Unknown Title';
      const imageTag = $article.find('.media.searchre img.media-object');
      const imageUrl = imageTag.attr('src') || imageTag.attr('data-src') || null;
      const yearMatch = title.match(/\((\d{4})\)/);
      const year = yearMatch ? yearMatch[1] : null;

      if (year) title = title.replace(/\(\d{4}\)/, '').trim();

      const mediaType = determineMediaTypeFromTitle(title);
      const commonData = {
        title,
        url: url.startsWith('http') ? url : new URL(url, BASE_URL).href,
        image: imageUrl,
        year,
        media_type: mediaType,
        source: 'AnimeGG',
        session_id: null
      };

      if (mediaType === 'TV Show') results.tv_shows.push(commonData);
      else if (mediaType === 'Movie') results.movies.push(commonData);
      else if (mediaType === 'ONA') results.onas.push(commonData);
      else if (mediaType === 'OVA') results.ovas.push(commonData);
      else if (mediaType === 'Special') results.specials.push(commonData);
      else results.tv_shows.push(commonData);
    });

    if (!results.tv_shows.length && !results.movies.length && !results.onas.length && !results.ovas.length && !results.specials.length) {
      console.log(`No anime found for '${query}' on AnimeGG`);
    }

    return results;
  } catch (err) {
    console.error(`❌ AnimeGG search error: ${err.message}`);
    throw new Error(`Error while searching AnimeGG: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeAnimeggEpList(url) {
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
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    await page.waitForSelector('ul.newmanga li', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Episode selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const listItems = $('ul.newmanga li');
    const episodes = [];

    listItems.each((i, li) => {
      const $li = $(li);
      const aTag = $li.find('a.anm_det_pop');
      if (!aTag.length) return;

      const href = aTag.attr('href');
      const episodeNumStr = $li.find('i.anititle').text().trim().match(/Episode (\d+)/i)?.[1] || `${i + 1}`;
      const title = $li.find('i.anititle').text().trim() || `Episode ${episodeNumStr}`;
      const releaseDate = null; 

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
        url: href && href.startsWith('http') ? href : new URL(href, BASE_URL).href,
        episode_session_id: '',
        date: releaseDate
      });
    });

    const seenUrls = new Set();
    const uniqueEpisodes = episodes.filter(ep => {
      if (seenUrls.has(ep.url)) return false;
      seenUrls.add(ep.url);
      return true;
    }).sort((a, b) => a.number - b.number);

    if (!uniqueEpisodes.length) {
      console.error('No episodes found on AnimeGG.');
      throw new Error('No episodes found on AnimeGG', { cause: { statusCode: 404 } });
    }

    return EpisodeList(uniqueEpisodes);
  } catch (err) {
    console.error(`❌ AnimeGG episodes error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping AnimeGG episode list: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeAnimeggEpStream(url) {
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
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    await page.waitForSelector('iframe.video', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Stream selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const streams = [];
    const addedUrls = new Set();

    const iframe = $('iframe.video');
    if (iframe.length && iframe.attr('src')) {
      const rawUrl = iframe.attr('src');
      const streamUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, BASE_URL).href;
      if (!addedUrls.has(streamUrl)) {
        addedUrls.add(streamUrl);
        streams.push({
          url: streamUrl,
          server: 'AnimeGG Hoster',
          type: 'embed',
          source: 'AnimeGG',
          audio_type: 'sub' 
        });
      }
    }

    if (!streams.length) {
      console.error(`No streaming URLs found on AnimeGG for ${url}`);
      throw new Error('No streaming URLs found on AnimeGG', { cause: { statusCode: 404 } });
    }

    return StreamSources(streams);
  } catch (err) {
    console.error(`❌ AnimeGG stream error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping AnimeGG episode stream: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeAnimeggSearch, scrapeAnimeggEpList, scrapeAnimeggEpStream };