const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();

// ✅ parser con user-agent (riduce blocchi)
const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }
});

app.use(cors());

// ✅ FEEDS CORRETTI
const feeds = [
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", source: "WSJ" },
  { url: "https://www.ilsole24ore.com/rss/finanza.xml", source: "Il Sole 24 Ore" },

  // ✅ FIX Reuters (& al posto di &amp;)
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters" },

  // ❌ FT rimosso (blocca bot)
  // { url: "https://www.ft.com/rss", source: "Financial Times" },

  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
  { url: "http://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" }
];

// ✅ TICKER
const tickers = {
  "nvidia": "NVDA",
  "asml": "ASML",
  "tesla": "TSLA",
  "apple": "AAPL",
  "microsoft": "MSFT",
  "amazon": "AMZN",
  "meta": "META",
  "google": "GOOGL",
  "intel": "INTC",
  "amd": "AMD",
  "tsmc": "TSM",
  "rheinmetall": "RHM",
  "leonardo": "LDO",
  "lockheed": "LMT"
};

// ✅ SENTIMENT
const positiveWords = ["beat","growth","surge","strong","record","profit","upgrade"];
const negativeWords = ["miss","drop","fall","weak","warn","cut","crisis","loss"];

// ✅ retry robusto
async function fetchFeed(url, retries = 2) {
  try {
    return await parser.parseURL(url);
  } catch (err) {
    if (retries > 0) {
      return await fetchFeed(url, retries - 1);
    }
    throw err;
  }
}

app.get("/news", async (req, res) => {
  try {
    let articles = [];

    for (let feedObj of feeds) {
      try {
        const feed = await fetchFeed(feedObj.url);

        articles = articles.concat(
          feed.items.map(item => {

            const title = item.title || "No title";
            const text = title.toLowerCase();

            // ✅ IMPORTANT
            const isImportant = /fed|inflation|war|crisis|earnings|ai|semiconductor/.test(text);

            // ✅ SCORE
            let score = 1;
            if (/fed|inflation|war|crisis/.test(text)) score = 5;
            else if (/earnings|profit|merger/.test(text)) score = 4;
            else if (/ai|chip|nvidia|semiconductor/.test(text)) score = 3;
            else if (/market|economy/.test(text)) score = 2;

            // ✅ CATEGORY
            let category = "general";
            if (/war|defense|military/.test(text)) category = "defense";
            else if (/ai|tech|software/.test(text)) category = "ai";
            else if (/chip|semiconductor/.test(text)) category = "semiconductor";
            else if (/inflation|fed|economy/.test(text)) category = "macro";

            // ✅ TICKER
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
        // ✅ LOG MIGLIORATO
        console.log("Errore feed:", feedObj.source, "-", err.message);
      }
    }

    // ✅ pulizia
    articles = articles.filter(a => !isNaN(a.pubDate));

    // ✅ deduplica
    const unique = {};
    articles.forEach(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/gi, "").substring(0, 60);
      if (!unique[key]) unique[key] = a;
    });

    articles = Object.values(unique);

    // ✅ sort
    articles.sort((a, b) => {
      if (b.score === a.score) return b.pubDate - a.pubDate;
      return b.score - a.score;
    });

    res.json(articles.slice(0, 50));

  } catch (error) {
    console.error("Errore generale:", error);
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
``
