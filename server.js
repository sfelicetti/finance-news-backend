const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0" }
});

app.use(cors());

// ✅ endpoint base (importante per Render)
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ FEED STABILI
const feeds = [
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "WSJ" },
  { url: "https://www.ilsole24ore.com/rss/finanza.xml", source: "Il Sole 24 Ore" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" }
];

app.get("/news", async (req, res) => {
  let articles = [];

  for (let f of feeds) {
    try {
      const feed = await parser.parseURL(f.url);

      for (let item of feed.items) {
        if (!item.title || !item.link) continue;

        const text = item.title.toLowerCase();

        // ✅ CATEGORY
        let category = "general";
        if (text.includes("ai")) category = "ai";
        else if (text.includes("chip") || text.includes("semiconductor")) category = "semiconductor";
        else if (text.includes("war") || text.includes("defense")) category = "defense";
        else if (text.includes("inflation") || text.includes("fed")) category = "macro";

        articles.push({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || item.isoDate || Date.now()),
          source: f.source,
          category: category
        });
      }

    } catch (err) {
      console.log("Errore feed:", f.source);
    }
  }

  articles = articles.filter(a => a.title && a.link);

  res.json(articles.slice(0, 30));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server OK"));
``
