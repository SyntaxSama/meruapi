const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAniRena(query) {
  try {
    const searchUrl = `https://www.anirena.com/?s=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch page: Status ${response.status}`);
    }

    const $ = cheerio.load(response.data);
    const torrents = [];
    const queryLower = query.toLowerCase().trim();
    const torrentRows = $('table tbody tr');

    torrentRows.each((index, element) => {
      const $row = $(element);

      const title = $row.find('td:nth-child(2) a').text().trim() || 'Unknown';
      const size = $row.find('td:nth-child(4)').text().trim() || 'Unknown'; 
      const seeds = parseInt($row.find('td:nth-child(4)').text().trim()) || 0;
      const peers = parseInt($row.find('td:nth-child(5)').text().trim()) || 0;
      const magnetLink = $row.find('a[href^="magnet:"]').attr('href') || '';
      const titleLower = title.toLowerCase();
      const isMatch = titleLower.includes(queryLower);

      if (title !== 'Unknown' && magnetLink && isMatch) {
        torrents.push({
          title,
          size,
          seeds,
          peers,
          magnetLink,
        });
      }
    });
    return torrents;
  } catch (err) {
    console.error('Error scraping AniRena:', err.message);
    throw new Error('Failed to scrape AniRena');
  }
}

module.exports = { scrapeAniRena };