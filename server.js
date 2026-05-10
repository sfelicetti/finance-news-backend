const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();
const parser = new Parser();

app.use(cors());

const feeds = [
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
  "https://www.ilsole24ore.com/rss/finanza.xml"
];

app.get("/news", async (req, res) => {
  try {
    let articles = [];

    for (let url of feeds) {
      const feed = await parser.parseURL(url);
      articles = articles.concat(
        feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate)
        }))
      );
    }

    articles.sort((a, b) => b.pubDate - a.pubDate);

    res.json(articles);
  } catch (error) {
    res.status(500).send("Errore nel recupero news");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
