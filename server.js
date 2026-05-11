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

            // IMPORTANT
            const importantKeywords = [
              "fed", "inflation", "interest rate",
              "war", "china", "crisis",
              "earnings", "profit", "guidance",
              "merger", "acquisition",
              "ai", "semiconductor", "defense"
            ];

            const isImportant = importantKeywords.some(k =>
              text.includes(k)
            );

            // SCORE
            let score = 1;

            if (
              text.includes("fed") ||
              text.includes("interest rate") ||
              text.includes("inflation") ||
              text.includes("crisis") ||
              text.includes("war")
            ) {
              score = 5;
            }
            else if (
              text.includes("earnings") ||
              text.includes("profit") ||
              text.includes("guidance") ||
              text.includes("merger") ||
              text.includes("acquisition")
            ) {
              score = 4;
            }
            else if (
              text.includes("ai") ||
              text.includes("semiconductor") ||
              text.includes("chip") ||
              text.includes("nvidia")
            ) {
              score = 3;
            }
            else if (
              text.includes("economy") ||
              text.includes("market") ||
              text.includes("stocks")
            ) {
              score = 2;
            }

            // CATEGORY
            let category = "general";

            if (text.includes("defense") || text.includes("war") || text.includes("military") || text.includes("nato")) {
              category = "defense";
            }
            else if (text.includes("ai") || text.includes("artificial intelligence") || text.includes("software") || text.includes("tech")) {
              category = "ai";
            }
            else if (text.includes("semiconductor") || text.includes("chip") || text.includes("nvidia") || text.includes("tsmc")) {
              category = "semiconductor";
            }
            else if (text.includes("fed") || text.includes("inflation") || text.includes("interest rate") || text.includes("economy")) {
              category = "macro";
            }

            return {
              title: title,
              link: item.link || "",
              pubDate: new Date(item.pubDate || item.isoDate),
              important: isImportant,
              category: category,
              score: score,
              source: feedObj.source // ✅ NUOVO CAMPO
            };
          })
        );

      } catch (err) {
        console.log("Errore feed:", feedObj.url);
      }
    }

    articles = articles.filter(a => !isNaN(a.pubDate));

    const unique = {};
    articles.forEach(a => {
      const key = a.title
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "")
        .substring(0, 60);

      if (!unique[key]) {
        unique[key] = a;
      }
    });
    articles = Object.values(unique);

    articles.sort((a, b) => {
      if (b.score === a.score) {
        return b.pubDate - a.pubDate;
      }
      return b.score - a.score;
    });

    articles = articles.slice(0, 50);

    res.json(articles);

  } catch (error) {
    console.error(error);
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
