const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');

puppeteer.use(StealthPlugin());

async function getAniListId(query) {
  const graphqlQuery = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { romaji english native }
        format
        startDate { year }
        episodes
      }
    }
  `;
  try {
    const response = await axios.post('https://graphql.anilist.co', {
      query: graphqlQuery,
      variables: { search: query }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const media = response.data.data.Media;
    if (!media) {
      console.log('No AniList media found for query');
      return null;
    }
    return {
      id: media.id,
      title: media.title.english || media.title.romaji || media.title.native,
      format: media.format || 'Unknown',
      year: media.startDate.year || 'Unknown',
      episodes: media.episodes || 'Unknown'
    };
  } catch (error) {
    console.error(`Error fetching AniList ID: ${error.message}`);
    return null;
  }
}

async function scrapeSeadex(query) {
  const anilistData = await getAniListId(query);
  if (!anilistData) {
    console.log('Failed to get AniList ID');
    return [];
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    const detailUrl = `https://releases.moe/${anilistData.id}/`;
    await page.goto(detailUrl, { waitUntil: 'networkidle0', timeout: 10000 });

    try {
      await page.waitForSelector('a[href*="nyaa.si/view/"]', { timeout: 5000 });
    } catch (error) {
      console.log('No Nyaa.si links found within timeout');
    }

    const content = await page.content();
    const $ = cheerio.load(content);
    const torrents = [];
    $('.w-full.flex.gap-3.flex-wrap > .rounded-xl.border.bg-card').each((i, element) => {
      const tags = $(element).find('div.p-6.pt-0.pb-3 > span').map((_, el) => $(el).text().trim()).get();
      const nyaaLinks = $(element).find('a[href*="nyaa.si/view/"]').map((_, el) => $(el).attr('href')).get();
      
      nyaaLinks.forEach(nyaLink => {
        const torrent = {
          title: anilistData.title,
          format: anilistData.format,
          year: anilistData.year,
          episodes: anilistData.episodes,
          isBest: tags.includes('Best'),
          isDualAudio: tags.includes('DualAudio'),
          isAlt: tags.includes('Alt'),
          link: detailUrl,
          nyaaLink: nyaLink
        };
        torrents.push(torrent);
      });
    });

    if (!torrents.length) {
      console.log('No Nyaa.si links found. Page content excerpt:', content.slice(0, 500));
    }

    torrents.sort((a, b) => b.isBest - a.isBest);
    return torrents;
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeSeadex };