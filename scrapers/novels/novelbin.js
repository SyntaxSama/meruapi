const { chromium } = require('playwright');
const cheerio = require('cheerio');

const BASE_URL = 'https://novelbin.me';
const DEFAULT_PAGE_TIMEOUT = 15000;

async function scrapeNovelbinSearch(query) {
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
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });

    await page.waitForSelector('div.row', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Search results selector not found.');
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    const results = [];

    $('div.row').each((i, row) => {
      const $row = $(row);
      const titleTag = $row.find('h3.novel-title a');
      if (!titleTag.length) return;

      const title = titleTag.text().trim();
      const novelUrl = titleTag.attr('href');
      const img = $row.find('img.cover');
      const thumbnail = img.length ? (img.attr('src')?.startsWith('http') ? img.attr('src') : new URL(img.attr('src') || '', BASE_URL).href) : null;
      const author = $row.find('.author');
      const authorText = author.length ? author.text().trim() : null;

      results.push({
        title,
        url: novelUrl?.startsWith('http') ? novelUrl : new URL(novelUrl || '', BASE_URL).href,
        thumbnail,
        author: authorText
      });
    });

    if (!results.length) {
      console.log(`No novels found for '${query}' on Novelbin`);
    }

    return results;
  } catch (err) {
    console.error(`❌ Novelbin search error: ${err.message}`);
    throw new Error(`Error while searching Novelbin: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeNovelbinChapters(url) {
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });

    await page.waitForSelector('ul.list-chapter li a', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Chapter selector not found.');
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    const chapters = [];

    $('ul.list-chapter li a').each((i, li) => {
      const $li = $(li);
      const chTitle = $li.find('span.nchr-text').text().trim();
      const chUrl = $li.attr('href');

      chapters.push({
        title: chTitle,
        url: chUrl?.startsWith('http') ? chUrl : new URL(chUrl || '', BASE_URL).href
      });
    });

    if (!chapters.length) {
      console.error('No chapters found on Novelbin.');
      throw new Error('No chapters found on Novelbin', { cause: { statusCode: 404 } });
    }

    return chapters;
  } catch (err) {
    console.error(`❌ Novelbin chapters error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping Novelbin chapter list: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeNovelbinChapterContent(url) {
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_PAGE_TIMEOUT });

    await page.waitForSelector('h4', { timeout: DEFAULT_PAGE_TIMEOUT }).catch(() => {
      console.warn('[!] Chapter title selector not found.');
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    const title = $('h4').first().text().trim();
    const paragraphs = $('p').map((i, p) => $(p).text().trim()).get().filter(text => text);

    if (!title || !paragraphs.length) {
      console.error(`No chapter content found on Novelbin for ${url}`);
      throw new Error('No chapter content found on Novelbin', { cause: { statusCode: 404 } });
    }

    return {
      title,
      content: paragraphs
    };
  } catch (err) {
    console.error(`❌ Novelbin chapter content error for '${url}': ${err.message}`);
    throw new Error(`Error while scraping Novelbin chapter content: ${err.message}`, { cause: { statusCode: err.message.includes('timeout') ? 504 : 500 } });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeNovelbinSearch, scrapeNovelbinChapters, scrapeNovelbinChapterContent };