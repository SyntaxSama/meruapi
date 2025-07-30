# About MeruAPI
MeruAPI Is an API dedicated for online streaming, manga, torrenting and light novels! we support a decent chunk of providers.

*NOTICE! Light Novels will be coming at a later date*

# Providers Supported
| Provider                   | Type  |                                                               
| -------------------------- | ----- |
| Manga Freak                | Manga |
| AnimeEgg                | Online Streaming |
| ZoroTV                 | Online Streaming |
| Animetosho               | Torrents |
| Anirena               | Torrents |
| Nyaa               | Torrents |

# Coming Soon
| Provider                   | Type  |                                                               
| -------------------------- | ----- |
| Manga World                | Manga |
| ComicK               | Manga |
| Anime World                | Online Streaming |
| Anime Ital                 | Online Streaming |

# API Endpoints
| Provider                   | Type  | Example |                                                              
| -------------------------- | ----- | -------- |
| MeruAPI | Status Page | http://localhost:3000/api |
| Manga Freak                | Manga (Search) | http://localhost:3000/api/manga/mangafreak?q=oshi%20no%20ko |
| Manga Freak                | Manga (Chapters) | http://localhost:3000/api/manga/mangafreak/chapters?url=https://mangafreak.net/Manga/Oshi_No_Ko |
| Manga Freak                | Manga (Pages) | http://localhost:3000/api/manga/mangafreak/pages?url=https://mangafreak.net/Read1_Oshi_No_Ko_1 |
| AnimeEgg                | Online Streaming (Search) | http://localhost:3000/api/streaming/animegg/search?q=dandadan |
| AnimeEgg                | Online Streaming (Episodes) | http://localhost:3000/api/streaming/animegg/episodes?url=https://www.animegg.org/series/dandadan |
| AnimeEgg                | Online Streaming (Stream) | http://localhost:3000/api/streaming/animegg/stream?url=https://www.animegg.org/dandadan-episode-1 |
| ZoroTV                 | Online Streaming (Search) | http://localhost:3000/api/streaming/zoro/search?q=dandadan |
| ZoroTV                 | Online Streaming (Episodes) | http://localhost:3000/api/streaming/zoro/episodes?url=https://zoroto.com.in/anime/dandadan-dub/ |
| ZoroTV                 | Online Streaming (Stream) | http://localhost:3000/api/streaming/zoro/stream?url=https://zoroto.com.in/dandadan-dub-episode-1/ |
| Animetosho               | Torrents | http://localhost:3000/api/torrent/animetosho?query=solo%20leveling |
| Anirena               | Torrents | http://localhost:3000/api/torrent/anirena?query=solo%20leveling |
| Nyaa               | Torrents | http://localhost:3000/api/torrent/nyaa?query=solo%20leveling |

# How To Install The API
To install the API run:
```yaml
git clone https://github.com/SyntaxSama/meruapi.git
```
To install the dependencies to use the api:
```yaml
npm install
```
To run the API:
```yaml
node app.js 
```

# Legal Disclaimer
This is simply an API that hooks into other hosts and grabs information from. I the developer do not hold accountability/liability for how this API is used. 

This API is for educational purposes only use it at your own risk. 
