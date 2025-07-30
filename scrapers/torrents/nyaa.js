const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeNyaa(query) {
  try {
    const searchUrl = `https://nyaa.si/?q=${encodeURIComponent(query)}`;
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

    $('table.torrent-list tbody tr').each((index, element) => {
      const $row = $(element);
      const title = $row.find('td:nth-child(2) a').last().text().trim() || 'Unknown';
      const size = $row.find('td:nth-child(4)').text().trim() || 'Unknown';
      const date = $row.find('td:nth-child(5)').text().trim() || 'Unknown';
      const seeds = parseInt($row.find('td:nth-child(6)').text().trim()) || 0;
      const peers = parseInt($row.find('td:nth-child(7)').text().trim()) || 0;
      const magnetLink = $row.find('td:nth-child(3) a[href^="magnet:"]').attr('href') || '';
      const torrentLink = $row.find('td:nth-child(3) a[href$=".torrent"]').attr('href') || '';

      if (title && magnetLink) {
        const formattedTorrentLink = torrentLink
          ? torrentLink.startsWith('http')
            ? torrentLink
            : `https://nyaa.si${torrentLink}`
          : '';

        torrents.push({
          title,
          size,
          date,
          seeds,
          peers,
          magnetLink,
          torrentLink: formattedTorrentLink,
        });
      }
    });
    return torrents;
  } catch (err) {
    console.error('Error scraping Nyaa:', err.message);
    throw new Error('Failed to scrape Nyaa');
  }
}

module.exports = { scrapeNyaa };