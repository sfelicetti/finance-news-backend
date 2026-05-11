const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();
const parser = new Parser();

app.use(cors());

// ✅ FEEDS CON SOURCE
const feeds = [
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "WSJ" },
  { url: "https://www.ilsole24ore.com/rss/finanza.xml", source: "Il Sole 24 Ore" },
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters" },
  { url: "https://www.ft.com/rss", source: "Financial Times" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
  { url: "http://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" }
];

// ✅ TICKER DATABASE (espandibile)
const tickers = {
  "nvidia": "NVDA",
  "asml": "ASML",
  "tesla": "TSLA",
  "apple": "AAPL",
  "microsoft": "MSFT",
  "google": "GOOGL",
  "amazon": "AMZN",
  "meta": "META",
  "netflix": "NFLX",
  "tsmc": "TSM",
  "intel": "INTC",
  "amd": "AMD",
  "boeing": "BA",
  "airbus": "AIR",
  "rheinmetall": "RHM",
  "leonardo": "LDO",
  "lockheed": "LMT",
  "northrop": "NOC",
  "raytheon": "RTX",
  "general dynamics": "GD"
};

// ✅ SENTIMENT KEYWORDS
const positiveWords = ["beat", "growth", "strong", "surge", "record", "profit", "up", "gain", "upgrade"];
const negativeWords = ["miss", "drop", "fall", "weak", "warn", "cut", "crisis", "down", "loss"];

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

            // ✅ IMPORTANT
            const importantKeywords = [
              "fed", "inflation", "interest rate",
              "war", "china", "crisis",
              "earnings", "profit", "guidance",
              "merger", "acquisition",
              "ai", "semiconductor", "defense"
            ];

            const isImportant = importantKeywords.some(k => text.includes(k));

            // ✅ SCORE
            let score = 1;

            if (text.match(/fed|inflation|interest rate|crisis|war/)) score = 5;
            else if (text.match(/earnings|profit|guidance|merger|acquisition/)) score = 4;
            else if (text.match(/ai|semiconductor|chip|nvidia/)) score = 3;
            else if (text.match(/economy|market|stocks/)) score = 2;

            // ✅ CATEGORY
            let category = "general";

            if (text.match(/defense|war|military|nato/)) category = "defense";
            else if (text.match(/ai|software|tech|artificial intelligence/)) category = "ai";
            else if (text.match(/semiconductor|chip|tsmc|nvidia/)) category = "semiconductor";
            else if (text.match(/fed|inflation|economy|interest rate/)) category = "macro";

            // ✅ TICKER DETECTION
            let ticker = null;
            for (let key in tickers) {
              if (text.includes(key)) {
                ticker = tickers[key];
                break;
              }
            }

            // ✅ SENTIMENT
            let sentiment = "neutral";

            const pos = positiveWords.some(w => text.includes(w));
            const neg = negativeWords.some(w => text.includes(w));

            if (pos && !neg) sentiment = "positive";
            else if (neg && !pos) sentiment = "negative";

            return {
              title,
              link: item.link || "",
              pubDate: new Date(item.pubDate || item.isoDate),
              important: isImportant,
              category,
              score,
              source: feedObj.source,
              ticker,
              sentiment
            };
          })
        );

      } catch (err) {
        console.log("Errore feed:", feedObj.url);
      }
    }

    articles = articles.filter(a => !isNaN(a.pubDate));

    // deduplica
    const unique = {};
    articles.forEach(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/gi, "").substring(0, 60);
      if (!unique[key]) unique[key] = a;
    });

    articles = Object.values(unique);

    articles.sort((a, b) => {
      if (b.score === a.score) return b.pubDate - a.pubDate;
      return b.score - a.score;
    });

    res.json(articles.slice(0, 50));

  } catch (error) {
    console.error(error);
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
