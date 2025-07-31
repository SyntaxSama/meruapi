## 📡 MeruAPI Endpoint Reference


### 🔧 API Status

| Name    | Endpoint                    |
| ------- | --------------------------- |
| MeruAPI | `http://localhost:3000/api` |

---

### 📚 Manga Endpoints

|name | Description               | Example URL                                                                                       |
|------| ------------------------- | ------------------------------------------------------------------------------------------------- |
|MangaFreak | Search Manga | `http://localhost:3000/api/manga/mangafreak?q=oshi%20no%20ko`                                     |
|MangaFreak | Get Chapters             | `http://localhost:3000/api/manga/mangafreak/chapters?url=https://mangafreak.net/Manga/Oshi_No_Ko` |
|MangaFreak | Get Pages                 | `http://localhost:3000/api/manga/mangafreak/pages?url=https://mangafreak.net/Read1_Oshi_No_Ko_1`  |
|ComicK | Search Manga | `http://localhost:3000/api/manga/comick/search?q=frieren` |
|ComicK | Get Chapters | `http://localhost:3000/api/manga/comick/chapters?hid=0FiLFYD1&page=10` |
|ComicK | Get Pages | `http://localhost:3000/api/manga/comick/pages?hid=ClqZrOJS` |

---

### 📺 Streaming Endpoints

**AnimeEgg**

* Search: `http://localhost:3000/api/streaming/animegg/search?q=dandadan`
* Episodes: `http://localhost:3000/api/streaming/animegg/episodes?url=https://www.animegg.org/series/dandadan`
* Stream: `http://localhost:3000/api/streaming/animegg/stream?url=https://www.animegg.org/dandadan-episode-1`

**ZoroTV**

* Search: `http://localhost:3000/api/streaming/zoro/search?q=dandadan`
* Episodes: `http://localhost:3000/api/streaming/zoro/episodes?url=https://zoroto.com.in/anime/dandadan-dub/`
* Stream: `http://localhost:3000/api/streaming/zoro/stream?url=https://zoroto.com.in/dandadan-dub-episode-1/`

**AnimePahe**

* Search: `http://localhost:3000/api/streaming/animepahe/search?q=solo%20leveling`
* Episodes: `http://localhost:3000/api/streaming/animepahe/episodes?anime_session_id=1895c0ee-ea1d-06a2-9068-da06ae3768af`
* Stream: `http://localhost:3000/api/streaming/animepahe/stream?url=https://animepahe.ru/play/1895c0ee-ea1d-06a2-9068-da06ae3768af/70f1a28acb5b822b501d4174f256dbd6635e19aad4633b94147795b070542d6f`

---

### 🪠 Torrent Endpoints

| Provider   | Endpoint Example                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| AnimeTosho | `http://localhost:3000/api/torrent/animetosho?query=solo%20leveling`                                      |
| AniRena    | `http://localhost:3000/api/torrent/anirena?query=solo%20leveling`                                         |
| Nyaa       | `http://localhost:3000/api/torrent/nyaa?query=solo%20leveling`                                            |
| SeaDex     | `http://localhost:3000/api/torrent/seadex?query=Alya%20Sometimes%20Hides%20Her%20Feelings%20in%20Russian` |
