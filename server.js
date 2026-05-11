const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

app.use(cors());

// ✅ endpoint base per Render
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

// ✅ FEEDS (corretti)
const feeds = [
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "WSJ" },
  { url: "https://www.ilsole24ore.com/rss/finanza.xml", source: "Il Sole 24 Ore" },
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
  { url: "http://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" }
];

// ✅ ticker
const tickers = {
  "nvidia": "NVDA",
  "asml": "ASML",
  "tesla": "TSLA",
  "apple": "AAPL",
  "microsoft": "MSFT",
  "amazon": "AMZN",
  "meta": "META"
};

// ✅ sentiment
const positiveWords = ["beat","growth","surge","profit","strong"];
const negativeWords = ["miss","drop","fall","weak","loss"];

app.get("/news", async (req, res) => {
  try {
    let articles = [];

    for (let feedObj of feeds) {
      try {
        const feed = await parser.parseURL(feedObj.url);

        articles = articles.concat(
          feed.items.map(item => {
            const title = item.title || "No title";
            const text = title.toLowerCase();

            // ticker
            let ticker = null;
            for (let key in tickers) {
              if (text.includes(key)) {
                ticker = tickers[key];
                break;
              }
            }

            // sentiment
            let sentiment = "neutral";
            if (positiveWords.some(w => text.includes(w))) sentiment = "positive";
            if (negativeWords.some(w => text.includes(w))) sentiment = "negative";

            return {
              title: title,
              link: item.link || "#",
              pubDate: new Date(item.pubDate || item.isoDate),
              source: feedObj.source,
              ticker: ticker,
              sentiment: sentiment
            };
          })
        );

      } catch (err) {
        console.log("Errore feed:", feedObj.source);
      }
    }

    // rimuove articoli senza data
    articles = articles.filter(a => !isNaN(a.pubDate));

    // max 50
    articles = articles.slice(0, 50);

    res.json(articles);

  } catch (error) {
    res.status(500).send("Errore");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
