const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();
const parser = new Parser();

app.use(cors());

// ✅ Feed RSS (corretti)
const feeds = [
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", // WSJ
  "https://www.ilsole24ore.com/rss/finanza.xml",   // Sole24Ore
  "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
  "https://www.ft.com/rss",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "http://feeds.marketwatch.com/marketwatch/topstories/",
  "https://finance.yahoo.com/news/rssindex"
];

// ✅ Endpoint news
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

  return {
    title: title,
    link: item.link || "",
    pubDate: new Date(item.pubDate || item.isoDate),
    important: isImportant
  };
})
        );

      } catch (err) {
        console.log("Errore nel feed:", url);
      }
    }

    // ✅ rimuove date non valide
    articles = articles.filter(a => !isNaN(a.pubDate));
    
// ✅ QUI rimozione duplicati
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

    // ✅ ordina dalla più recente
    articles.sort((a, b) => b.pubDate - a.pubDate);

    // ✅ massimo 50 articoli
    articles = articles.slice(0, 50);

    res.json(articles);

  } catch (error) {
    console.error(error);
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
