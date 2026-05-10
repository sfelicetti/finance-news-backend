const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();
const parser = new Parser();

app.use(cors());

const feeds = [
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
  "https://www.ilsole24ore.com/rss/finanza.xml",
  "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
  "https://www.ft.com/rss",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "http://feeds.marketwatch.com/marketwatch/topstories/",
  "https://finance.yahoo.com/news/rssindex"
];

app.get("/news", async (req, res) => {
  try {
    let articles = [];

    for (let url of feeds) {
      try {
        const feed = await parser.parseURL(url);

        articles = articles.concat(
          feed.items.map(item => {
            const title = item.title || "No title";

            const importantKeywords = [
              "fed", "inflation", "interest rate",
              "war", "china", "crisis",
              "earnings", "profit", "guidance",
              "merger", "acquisition",
              "ai", "semiconductor", "defense"
            ];

            const isImportant = importantKeywords.some(k =>
              title.toLowerCase().includes(k)
            );

            // ✅ categorizzazione
            let category = "general";
            const text = title.toLowerCase();

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
              category: category
            };
          })
        );

      } catch (err) {
        console.log("Errore nel feed:", url);
      }
    }

    // ✅ filtra date valide
    articles = articles.filter(a => !isNaN(a.pubDate));

    // ✅ deduplica intelligente
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

    // ✅ ordina
    articles.sort((a, b) => b.pubDate - a.pubDate);

    // ✅ limita
    articles = articles.slice(0, 50);

    res.json(articles);

  } catch (error) {
    console.error(error);
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
