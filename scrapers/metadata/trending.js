const axios = require('axios');

async function fetchTrendingAnime(page = 1) {
  try {
    const url = `https://animeapi.skin/trending`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!Array.isArray(data)) throw new Error('Invalid response format: expected an array');

    return data;
  } catch (err) {
    throw new Error('Failed to fetch trending data from AnimeAPI');
  }
}

module.exports = { fetchTrendingAnime };
