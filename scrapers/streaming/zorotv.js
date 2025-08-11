const { chromium } = require('playwright');
const asyncRetry = require('async-retry');

const BASE_URL = 'https://zoroto.com.in';
const DEFAULT_PAGE_TIMEOUT = 30000;

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

async function scrapeZoroSearch(query) {
  let browser;
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });
    const page = await context.newPage();

    await asyncRetry(async () => {
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 3, minTimeout: 5000, maxTimeout: 10000 });

    await page.waitForTimeout(5000); 
    await page.waitForSelector('article.bs, article.post, .anime-item, .search-results .entry', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Search results selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const articles = $('article.bs, article.post, .anime-item, .search-results .entry');
    const results = SearchResults();

    articles.each((i, article) => {
      const $article = $(article);
      const aTag = $article.find('a[href]');
      if (!aTag.length) return;

      const url = aTag.attr('href');
      let title = aTag.attr('title') || $article.find('h2[itemprop="headline"], h3 a, .title a, h2 a').text().trim() || 'Unknown Title';
      const imageTag = $article.find('img.ts-post-image, img.poster, img.anime-image');
      const imageUrl = imageTag.attr('src') || imageTag.attr('data-src') || null;
      const yearMatch = title.match(/\((\d{4})\)/);
      const year = yearMatch ? yearMatch[1] : null;

      if (year) title = title.replace(/\(\d{4}\)/, '').trim();

      const mediaType = determineMediaTypeFromTitle(title);

      const commonData = {
        title,
        url: url && url.startsWith('http') ? url : new URL(url, BASE_URL).href,
        image: imageUrl,
        year,
        media_type: mediaType,
        source: 'Zoro',
        session_id: null
      };

      if (mediaType === 'TV Show') {
        results.tv_shows.push(commonData);
      } else if (mediaType === 'Movie') {
        results.movies.push(commonData);
      } else if (mediaType === 'ONA') {
        results.onas.push(commonData);
      } else if (mediaType === 'OVA') {
        results.ovas.push(commonData);
      } else if (mediaType === 'Special') {
        results.specials.push(commonData);
      } else {
        results.tv_shows.push(commonData);
      }
    });

    if (!results.tv_shows.length && !results.movies.length && !results.onas.length && !results.ovas.length && !results.specials.length) {
      console.log(`No anime found for '${query}' on ZoroTV`);
    }

    return results;
  } catch (err) {
    console.error(`❌ ZoroTV search error: ${err.message}`);
    const statusCode = err.message.includes('timeout') ? 504 : 500;
    throw new Error(`Error while searching Zoro: ${err.message}`, { cause: { statusCode } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeZoroEpList(url) {
  let browser;
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL. Must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });
    const page = await context.newPage();

    await asyncRetry(async () => {
      await page.goto(url, { waitUntil: 'networkidle', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 3, minTimeout: 5000, maxTimeout: 10000 });

    await page.waitForTimeout(5000);
    await page.waitForSelector('div.eplister ul li, .episode-list li, .episodes .episode, ul.episode-list li', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Episode selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const listItems = $('div.eplister ul li, .episode-list li, .episodes .episode, ul.episode-list li');
    const episodes = [];

    listItems.each((i, li) => {
      const $li = $(li);
      const aTag = $li.find('a[href]');
      if (!aTag.length) return;

      const href = aTag.attr('href');
      const episodeNumStr = $li.attr('data-index') || $li.find('.ep-num, .episode-number').text().trim() || `${i + 1}`;
      const epTitleDiv = $li.find('div.epl-title, .episode-title, .title');
      const title = epTitleDiv.length ? epTitleDiv.text().trim() : `Episode ${episodeNumStr}`;
      const epDateDiv = $li.find('div.epl-date, .episode-date, .date');
      const releaseDate = epDateDiv.length ? epDateDiv.text().trim() : null;

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
      console.error('No episodes found on ZoroTV. The page might be empty or structure changed.');
      throw new Error('No episodes found on ZoroTV', { cause: { statusCode: 404 } });
    }

    return EpisodeList(uniqueEpisodes);
  } catch (err) {
    console.error(`❌ ZoroTV episodes error for '${url}': ${err.message}`);
    const statusCode = err.message.includes('timeout') ? 504 : 500;
    throw new Error(`Error while scraping Zoro episode list: ${err.message}`, { cause: { statusCode } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeZoroEpStream(url) {
  let browser;
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL. Must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    });
    const page = await context.newPage();

    await asyncRetry(async () => {
      await page.goto(url, { waitUntil: 'networkidle', timeout: DEFAULT_PAGE_TIMEOUT + 10000 });
    }, { retries: 3, minTimeout: 5000, maxTimeout: 10000 });

    await page.waitForTimeout(5000);
    await page.waitForSelector('div#pembed iframe, .video-content iframe, #embed_holder iframe, video source', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Stream selector not found.');
    });

    const content = await page.content();
    const $ = require('cheerio').load(content);
    const streams = [];
    const addedUrls = new Set();

    function addIframeVariants(rawUrl) {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, BASE_URL).href);
      const query = new URLSearchParams(parsed.search);
      const baseUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      const serverOptions = ['hd-1', 'hd-2', 'vidcdn', 'streamsb'];
      const typeOptions = ['sub', 'dub'];

      for (const srv of serverOptions) {
        for (const typ of typeOptions) {
          query.set('server', srv);
          query.set('type', typ);
          const newUrl = `${baseUrl}?${query.toString()}`;
          if (addedUrls.has(newUrl)) continue;
          addedUrls.add(newUrl);
          streams.push({
            url: newUrl,
            server: 'Zoro Hoster',
            type: 'embed',
            source: 'Zoro',
            audio_type: typ
          });
        }
      }
    }

    const primaryIframe = $('div#pembed iframe');
    if (primaryIframe.length && primaryIframe.attr('src')) {
      addIframeVariants(primaryIframe.attr('src'));
    } else {
      console.warn('[!] Could not find iframe in div#pembed. Falling back to generic iframe selection.');
    }

    if (!streams.length) {
      const fallbackIframe = $('div.video-content iframe, div#embed_holder iframe, .player iframe');
      if (fallbackIframe.length && fallbackIframe.attr('src')) {
        addIframeVariants(fallbackIframe.attr('src'));
      }
    }

    const videoSources = $('video source[src$=".mp4"]');
    videoSources.each((i, source) => {
      const link = $(source).attr('src');
      if (!link || addedUrls.has(link)) return;
      addedUrls.add(link);
      streams.push({
        url: link.startsWith('http') ? link : new URL(link, BASE_URL).href,
        server: 'Zoro Direct',
        type: 'direct',
        quality: $(source).attr('size') || null,
        source: 'Zoro'
      });
    });

    if (!streams.length) {
      console.error(`No streaming URLs found on ZoroTV for ${url}`);
      throw new Error('No streaming URLs found on ZoroTV', { cause: { statusCode: 404 } });
    }

    return StreamSources(streams);
  } catch (err) {
    console.error(`❌ ZoroTV stream error for '${url}': ${err.message}`);
    const statusCode = err.message.includes('timeout') ? 504 : 500;
    throw new Error(`Error while scraping Zoro episode stream: ${err.message}`, { cause: { statusCode } });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeZoroSearch, scrapeZoroEpList, scrapeZoroEpStream };