const { chromium } = require('playwright');

const THETVDB_BASE = 'https://www.thetvdb.com';

async function searchTheTVDB(query) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        extraHTTPHeaders: {
            'Referer': THETVDB_BASE,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        viewport: { width: 1280, height: 800 }
    });

    try {
        const page = await context.newPage();

        const searchUrl = `${THETVDB_BASE}/search?query=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        await page.waitForSelector('.ais-Hits-list.list-unstyled li a', { timeout: 15000 });

        const resultUrl = await page.$eval('.ais-Hits-list.list-unstyled li a', el =>
            new URL(el.getAttribute('href'), location.origin).href
        );

        if (!resultUrl) {
            return { results: [], suggestions: [] };
        }

        await page.goto(resultUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('h1', { timeout: 15000 });

        const metadata = await page.evaluate(() => {
            const title = document.querySelector('h1')?.textContent.trim() || '';

            return { title };
        });

        return {
            results: [
                {
                    ...metadata,
                    url: resultUrl
                }
            ]
        };

    } catch (err) {
        console.error('Search error:', err.message);
        return { results: [], suggestions: [] };
    } finally {
        await browser.close();
    }
}


async function scrapeTVDBMetadata(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('h1', { timeout: 15000 });

        try {
            await page.click('a:has-text("Overview")', { timeout: 5000 });
            await page.waitForTimeout(1000);
        } catch (_) { }

        const overviewData = await page.evaluate(() => {
            const cleanText = (str) => str?.replace(/\s+/g, ' ').trim() || '';

            const parseTrailers = (text) => {
                if (!text) return [];
                return text.split(',').map(part => {
                    const m = part.match(/(.*?)\s*\((https?:\/\/[^\)]+)\)/);
                    if (m) return { name: cleanText(m[1]), url: m[2] };
                    return { name: cleanText(part), url: null };
                });
            };

            const posterImg = document.querySelector('.col-xs-12.col-sm-4.col-md-4.col-lg-3.col-xl-2 img')?.src || '';

            const listGroup = document.querySelector('ul.list-group');
            const extraDataRaw = {};
            if (listGroup) {
                for (const li of listGroup.querySelectorAll('li.list-group-item')) {
                    const key = li.querySelector('strong')?.textContent.trim().replace(/\s+/g, ' ') || '';
                    let value = '';

                    const span = li.querySelector('span');
                    if (span) {
                        const texts = [];
                        const links = span.querySelectorAll('a');
                        if (links.length) {
                            for (const a of links) {
                                texts.push(`${a.textContent.trim()} (${a.href})`);
                            }
                        }
                        const directText = Array.from(span.childNodes)
                            .filter(n => n.nodeType === Node.TEXT_NODE)
                            .map(n => n.textContent.trim())
                            .filter(t => t.length > 0);
                        texts.push(...directText);

                        value = texts.join(', ').trim();
                    }

                    if (key) {
                        extraDataRaw[key] = value;
                    }
                }
            }

            const extraData = {};
            const keysToKeep = [
                'TheTVDB.com Series ID',
                'Status',
                'First Aired',
                'Recent',
                'Upcoming',
                'Airs',
                'Production Company',
                'Studio',
                'Network',
                'Average Runtime',
                'Trailers'
            ];

            const removeUrls = (str) => {
                return str.replace(/\s*\(https?:\/\/[^\)]+\)/g, '').trim();
            };

            for (const k of keysToKeep) {
                if (extraDataRaw[k]) {
                    let value = extraDataRaw[k];
                    if ([
                        'First Aired',
                        'Recent',
                        'Upcoming',
                        'Production Company',
                        'Studio',
                        'Network'
                    ].includes(k)) {
                        value = removeUrls(value);
                    }
                    extraData[k] = value;
                }
            }

            if (extraData.Trailers) {
                extraData.Trailers = parseTrailers(extraData.Trailers);
            } else {
                extraData.Trailers = [];
            }

            if (extraData.Airs) {
                extraData.Airs = extraData.Airs.replace(/\s+/g, ' ').trim();
            }

            return {
                title: cleanText(document.querySelector('h1')?.textContent),
                description: cleanText(document.querySelector('div.change_translation_text[data-language="eng"]')?.textContent),
                poster: posterImg, 
                extraData
            };
        });

        return { ...overviewData };

    } catch (err) {
        console.error('Metadata scrape error:', err.message);
        return null;
    } finally {
        await browser.close();
    }
}

module.exports = { searchTheTVDB, scrapeTVDBMetadata };