const { chromium } = require('playwright');
const asyncRetry = require('async-retry');

const BASE_URL = 'https://animepahe.ru';
const API_BASE_URL = `${BASE_URL}/api`;
const DEFAULT_PAGE_TIMEOUT = 15000;

function generateDdg2Cookie() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function determineMediaTypeFromType(type) {
  if (type.toLowerCase() === 'movie') return 'Movie';
  if (type.toLowerCase() === 'ona') return 'ONA';
  if (type.toLowerCase() === 'ova') return 'OVA';
  if (type.toLowerCase() === 'special') return 'Special';
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

async function scrapeAnimepaheSearch(query) {
  let browser;
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Cookie': `__ddg2_=${generateDdg2Cookie()}`
      }
    });

    const page = await context.newPage();
    const searchUrl = `${API_BASE_URL}?m=search&q=${encodeURIComponent(query)}`;
    let response;

    await asyncRetry(async () => {
      response = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
      if (response.status() === 403) {
        throw new Error('Request failed with status code 403');
      }
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    const data = await response.json();
    if (!data.data) {
      throw new Error('No data returned from API');
    }

    const results = SearchResults();
    data.data
      .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
      .forEach(item => {
        const mediaType = determineMediaTypeFromType(item.type);
        const commonData = {
          title: item.title,
          url: `${BASE_URL}/anime/${item.session}`,
          image: item.poster,
          year: item.year || null,
          media_type: mediaType,
          source: 'AnimePahe',
          session_id: item.session
        };

        if (mediaType === 'TV Show') results.tv_shows.push(commonData);
        else if (mediaType === 'Movie') results.movies.push(commonData);
        else if (mediaType === 'ONA') results.onas.push(commonData);
        else if (mediaType === 'OVA') results.ovas.push(commonData);
        else if (mediaType === 'Special') results.specials.push(commonData);
        else results.tv_shows.push(commonData);
      });

    if (!results.tv_shows.length && !results.movies.length && !results.onas.length && !results.ovas.length && !results.specials.length) {
      console.log(`No anime found for '${query}' on AnimePahe`);
    }

    return results;
  } catch (err) {
    console.error(`❌ AnimePahe search error: ${err.message}`);
    throw new Error(`Error while searching AnimePahe: ${err.message}`, {
      cause: { statusCode: err.message.includes('403') ? 403 : err.message.includes('timeout') ? 504 : 500 }
    });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeAnimepaheEpList(animeSessionId) {
  let browser;
  try {
    if (!animeSessionId || typeof animeSessionId !== 'string') {
      throw new Error('Invalid anime session ID. Must be a non-empty string');
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': BASE_URL,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Cookie': `__ddg2_=${generateDdg2Cookie()}`
      }
    });

    const page = await context.newPage();
    const episodesUrl = `${API_BASE_URL}?m=release&id=${encodeURIComponent(animeSessionId)}&l=30&sort=episode_asc&page=1`;
    let response;

    await asyncRetry(async () => {
      response = await page.goto(episodesUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
      if (response.status() === 403) {
        throw new Error('Request failed with status code 403');
      }
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    const data = await response.json();
    if (!data.data) {
      throw new Error('No episodes returned from API');
    }

    const episodes = data.data.map(episode => ({
      number: parseInt(episode.episode, 10) || 1,
      title: `Episode ${episode.episode}`,
      url: `${BASE_URL}/play/${animeSessionId}/${episode.session}`,
      episode_session_id: episode.session,
      date: episode.created_at || null
    }));

    const uniqueEpisodes = episodes
      .filter((ep, index, self) => self.findIndex(e => e.url === ep.url) === index)
      .sort((a, b) => a.number - b.number);

    if (!uniqueEpisodes.length) {
      console.error(`No episodes found for anime session ID '${animeSessionId}' on AnimePahe`);
      throw new Error('No episodes found on AnimePahe', { cause: { statusCode: 404 } });
    }

    return EpisodeList(uniqueEpisodes);
  } catch (err) {
    console.error(`❌ AnimePahe episodes error for '${animeSessionId}': ${err.message}`);
    throw new Error(`Error while fetching AnimePahe episode list: ${err.message}`, {
      cause: { statusCode: err.message.includes('403') ? 403 : err.message.includes('timeout') ? 504 : 500 }
    });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeAnimepaheEpStream(url) {
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
        'Cache-Control': 'no-cache',
        'Cookie': `__ddg2_=${generateDdg2Cookie()}`
      }
    });

    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });
    const cookies = await context.cookies();
    await context.addCookies(cookies);

    await asyncRetry(async () => {
      await page.goto(url, { waitUntil: 'networkidle', timeout: DEFAULT_PAGE_TIMEOUT });
    }, { retries: 2, minTimeout: 2000, maxTimeout: 5000 });

    const pageContent = await page.content();
    if (pageContent.includes('captcha') || pageContent.includes('DDoS-Guard')) {
    }

    await page.waitForSelector('div.click-to-load', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
    });

    const clickToLoad = await page.locator('div.click-to-load').first();
    if (clickToLoad) {
      await clickToLoad.click({ force: true });
      await page.waitForTimeout(5000); 
    } 

    await page.waitForSelector('iframe.embed-responsive-item', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
    });

    const streams = [];
    const addedUrls = new Set();

    await page.waitForFunction(
      () => {
        const iframe = document.querySelector('iframe.embed-responsive-item');
        return iframe && iframe.src && (iframe.src.includes('kwik.cx') || iframe.src.includes('pahe.win'));
      },
      { timeout: DEFAULT_PAGE_TIMEOUT }
    ).catch(() => {
      console.warn('[!] Iframe src did not update to a valid Kwik URL.');
    });

    const iframeSrc = await page.$eval('iframe.embed-responsive-item', el => el.src, { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => null);

    if (iframeSrc && (iframeSrc.includes('kwik.cx') || iframeSrc.includes('pahe.win')) && !addedUrls.has(iframeSrc)) {
      addedUrls.add(iframeSrc);
      streams.push({
        url: iframeSrc,
        server: 'Kwik',
        type: 'embed',
        source: 'AnimePahe',
        audio_type: iframeSrc.toLowerCase().includes('jpn') ? 'sub' : 'dub',
        quality: 'Unknown'
      });
    }

    if (!streams.length) {
      const content = await page.content();
      const $ = require('cheerio').load(content);
      const kwikLinks = $('a[href*="kwik.cx"], a[href*="pahe.win"]');
      for (let i = 0; i < kwikLinks.length; i++) {
        const linkUrl = $(kwikLinks[i]).attr('href');
        if (!linkUrl || addedUrls.has(linkUrl)) continue;

        const qualityLabel = $(kwikLinks[i]).text().trim().match(/(\d+p)/)?.[1] || 'Unknown';
        addedUrls.add(linkUrl);
        streams.push({
          url: linkUrl,
          server: 'Kwik',
          type: 'embed',
          source: 'AnimePahe',
          audio_type: $(kwikLinks[i]).text().toLowerCase().includes('jpn') ? 'sub' : 'dub',
          quality: qualityLabel
        });
      }
    }

    if (!streams.length) {
      console.error(`No streaming URLs found on AnimePahe for ${url}`);
      throw new Error('No streaming URLs found on AnimePahe', { cause: { statusCode: 404 } });
    }

    return StreamSources(streams);
  } catch (err) {
    console.error(`❌ AnimePahe stream error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping AnimePahe episode stream: ${err.message}`, {
      cause: { statusCode: err.message.includes('timeout') ? 504 : 500 }
    });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeAnimepaheSearch, scrapeAnimepaheEpList, scrapeAnimepaheEpStream };