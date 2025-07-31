const { chromium } = require('playwright');

const COMICK_BASE = 'https://api.comick.fun';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchComicK(query) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://comick.fun/',
    'Origin': 'https://comick.fun',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site'
  };

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: headers['User-Agent'],
      extraHTTPHeaders: headers
    });
    const page = await context.newPage();
    try {
      const response = await page.goto(`${COMICK_BASE}/v1.0/search?q=${encodeURIComponent(query)}&t=false`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      const data = await response.json();
      const results = data.map(item => ({
        title: item.title || item.md_titles?.[0]?.title || 'Unknown',
        hid: item.hid,
        slug: item.slug,
        last_chapter: item.last_chapter || null,
        desc: item.desc || null,
        thumbnail: item.md_covers?.[0]?.b2key ? `https://meo.comick.pictures/${item.md_covers[0].b2key}` : null
      }));
      return results;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error searching ComicK API with headless browser: ${error.message}`);
  }
  console.log('Could not scrape comick successfully!');
}

async function getComicKChapters(hid, page, limit) {
  if (!hid) throw new Error('Invalid manga HID');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://comick.fun/',
    'Origin': 'https://comick.fun',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site'
  };

  try {
    await delay(1000);
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: headers['User-Agent'],
      extraHTTPHeaders: headers
    });
    const pageObj = await context.newPage();
    try {
      const response = await pageObj.goto(`${COMICK_BASE}/comic/${hid}/chapters?page=${page}`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      const data = await response.json();
      let chapters = data.chapters || [];
      const total = chapters.length;
      if (page && limit && limit !== 'all') {
        const start = (page - 1) * limit;
        chapters = chapters.slice(start, start + limit);
      }
      return { total, chapters };
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error fetching chapters via headless browser: ${error.message}`);
    return { chapters: [], total: 0 };
  }
}

async function getComicKPages(hid) {
  if (!hid) throw new Error('Invalid chapter HID');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://comick.fun/',
    'Origin': 'https://comick.fun',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site'
  };

  try {
    await delay(1000);
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: headers['User-Agent'],
      extraHTTPHeaders: headers
    });
    const page = await context.newPage();
    try {
      const response = await page.goto(`${COMICK_BASE}/chapter/${hid}/get_images`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });
      const data = await response.json();
      const images = data.map(img => `https://meo.comick.pictures/${img.b2key}`);
      return images;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`Error fetching pages via headless browser: ${error.message}`);
    return [];
  }
}

module.exports = {
  searchComicK,
  getComicKChapters,
  getComicKPages
};