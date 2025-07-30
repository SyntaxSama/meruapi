const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAnimeTosho(query) {
  try {
    const searchUrl = `https://animetosho.org/search?q=${encodeURIComponent(query)}`;
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

    $('.home_list_entry').each((index, element) => {
      const $entry = $(element);
      const title = $entry.find('.link a').first().text().trim() || 'Unknown';
      const size = $entry.find('.size').text().trim() || 'Unknown';
      const seeds = parseInt($entry.find('.seeders').text().trim()) || 0;
      const peers = parseInt($entry.find('.leechers').text().trim()) || 0;
      const magnetLink = $entry.find('a[href^="magnet:"]').attr('href') || '';
      const torrentLink = $entry.find('a[href$=".torrent"]').attr('href') || '';

      if (title && magnetLink) {
        const formattedTorrentLink = torrentLink
          ? torrentLink.startsWith('http')
            ? torrentLink
            : `https://animetosho.org${torrentLink}`
          : '';

        torrents.push({
          title,
          size,
          seeds,
          peers,
          magnetLink,
          torrentLink: formattedTorrentLink,
        });
      }
    });

    return torrents;
  } catch (err) {
    console.error('Error scraping AnimeTosho:', err.message);
    throw new Error('Failed to scrape AnimeTosho');
  }
}

module.exports = { scrapeAnimeTosho };