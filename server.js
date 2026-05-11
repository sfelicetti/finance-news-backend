const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0" }
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("OK");
});

const feeds = [
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "WSJ" },
  { url: "https://www.ilsole24ore.com/rss/finanza.xml", source: "Il Sole 24 Ore" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" }
];

// ⚠️ SOLO 3 FEED → stabilità prima

app.get("/news", async (req, res) => {
  let articles = [];

  for (let f of feeds) {
    try {
      const feed = await parser.parseURL(f.url);

      for (let item of feed.items) {

        if (!item.title) continue;
        if (!item.link) continue;

        const text = item.title.toLowerCase();

        let category = "general";
        if (text.includes("ai")) category = "ai";
        if (text.includes("chip") || text.includes("semiconductor")) category = "semiconductor";
        if (text.includes("war")) category = "defense";
        if (text.includes("inflation") || text.includes("fed")) category = "macro";

        articles.push({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || item.isoDate || Date.now()),
          source: f.source,
          category: category,
          ticker: null,
          sentiment: "neutral"
        });
      }

    } catch (err) {
      console.log("Errore feed:", f.source);
    }
  }

  // fallback sicurezza
  articles = articles.filter(a => a.title && a.link);

  res.json(articles.slice(0,30));
});

app.listen(process.env.PORT || 3000, () => console.log("Server OK"));
