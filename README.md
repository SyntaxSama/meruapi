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
| Seadex               | Torrents |

# Coming Soon
| Provider                   | Type  |                                                               
| -------------------------- | ----- |
| Manga World                | Manga |
| ComicK               | Manga |
| Anime World                | Online Streaming |
| Anime Ital                 | Online Streaming |



# API Endpoints
| MeruAPI Status Endpoint | Link |
| ------------------------ | ---- |
| MeruAPI |  http://localhost:3000/api |
#
| Manga Provider             | Example |                                                              
| -------------------------- | -------- |
| Manga Freak                | http://localhost:3000/api/manga/mangafreak?q=oshi%20no%20ko |
| Manga Freak                | http://localhost:3000/api/manga/mangafreak/chapters?url=https://mangafreak.net/Manga/Oshi_No_Ko |
| Manga Freak                | http://localhost:3000/api/manga/mangafreak/pages?url=https://mangafreak.net/Read1_Oshi_No_Ko_1 |
#
| Streaming Provider (Online)| Example |                                                              
| -------------------------- | -------- |
| AnimeEgg                | http://localhost:3000/api/streaming/animegg/search?q=dandadan |
| AnimeEgg                | http://localhost:3000/api/streaming/animegg/episodes?url=https://www.animegg.org/series/dandadan |
| AnimeEgg                | http://localhost:3000/api/streaming/animegg/stream?url=https://www.animegg.org/dandadan-episode-1 |
| ZoroTV                 | http://localhost:3000/api/streaming/zoro/search?q=dandadan |
| ZoroTV                 | http://localhost:3000/api/streaming/zoro/episodes?url=https://zoroto.com.in/anime/dandadan-dub/ |
| ZoroTV                 | http://localhost:3000/api/streaming/zoro/stream?url=https://zoroto.com.in/dandadan-dub-episode-1/ |
| Animepahe                 | http://localhost:3000/api/streaming/animepahe/search?q=solo%20leveling |
| Animepahe                 | http://localhost:3000/api/streaming/animepahe/episodes?anime_session_id=1895c0ee-ea1d-06a2-9068-da06ae3768af |
| Animepahe                 | http://localhost:3000/api/streaming/animepahe/stream?url=https://animepahe.ru/play/1895c0ee-ea1d-06a2-9068-da06ae3768af/70f1a28acb5b822b501d4174f256dbd6635e19aad4633b94147795b070542d6f |
#
| Torrent Provider           |  Example |                                                              
| -------------------------- | -------- |
| Animetosho               | http://localhost:3000/api/torrent/animetosho?query=solo%20leveling |
| Anirena               | http://localhost:3000/api/torrent/anirena?query=solo%20leveling |
| Nyaa               | http://localhost:3000/api/torrent/nyaa?query=solo%20leveling |
| Seadex               | http://localhost:3000/api/torrent/seadex?query=Alya%20Sometimes%20Hides%20Her%20Feelings%20in%20Russian |

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
