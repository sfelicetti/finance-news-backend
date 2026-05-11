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
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
  { url: "http://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" }
];

// ticker base
const tickers = {
  "nvidia": "NVDA",
  "asml": "ASML",
  "tesla": "TSLA",
  "apple": "AAPL",
  "microsoft": "MSFT",
  "amazon": "AMZN",
  "meta": "META"
};

// sentiment
const posWords = ["beat","growth","surge","profit","strong"];
const negWords = ["miss","drop","fall","weak","loss"];

app.get("/news", async (req, res) => {
  try {
    let articles = [];

    for (let f of feeds) {
      try {
        const feed = await parser.parseURL(f.url);

        articles = articles.concat(feed.items.map(item => {
          const title = item.title || "No title";
          const text = title.toLowerCase();

          // ✅ CATEGORY (RIMESSA)
          let category = "general";
          if (text.includes("ai")) category = "ai";
          else if (text.includes("chip") || text.includes("semiconductor")) category = "semiconductor";
          else if (text.includes("war") || text.includes("defense")) category = "defense";
          else if (text.includes("inflation") || text.includes("fed")) category = "macro";

          // ✅ TICKER
          let ticker = null;
          for (let k in tickers) {
            if (text.includes(k)) {
              ticker = tickers[k];
              break;
            }
          }

          // ✅ SENTIMENT
          let sentiment = "neutral";
          if (posWords.some(w => text.includes(w))) sentiment = "positive";
          if (negWords.some(w => text.includes(w))) sentiment = "negative";

          return {
            title,
            link: item.link || "#",
            pubDate: new Date(item.pubDate || item.isoDate),
            source: f.source,
            category,
            ticker,
            sentiment
          };
        }));

      } catch (err) {
        console.log("Errore feed:", f.source);
      }
    }

    articles = articles.filter(a => !isNaN(a.pubDate));

    res.json(articles.slice(0,50));

  } catch (err) {
    res.status(500).send("Errore");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
``
