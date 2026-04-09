import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import os from "os";
import ytSearch from "yt-search";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/search-youtube", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    try {
      console.log(`[YouTube Search] Query: "${query}"`);
      // 1. Try with Official YouTube API if key is present
      const youtubeKey = process.env.YOUTUBE_API_KEY;
      if (youtubeKey) {
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${youtubeKey}&maxResults=1`;
          const ytRes = await fetch(ytUrl);
          if (ytRes.ok) {
              const ytData: any = await ytRes.json();
              if (ytData.items && ytData.items.length > 0) {
                  const vid = ytData.items[0].id.videoId;
                  console.log(`[YouTube Search] Success (API): ${vid}`);
                  return res.json({ videoId: vid });
              }
          }
      }

      // 2. Fallback to scraping with yt-search
      const r = await ytSearch(query);
      const videos = r.videos.slice(0, 5);
      if (videos.length > 0) {
        console.log(`[YouTube Search] Success (Scrape): ${videos[0].videoId}`);
        res.json({ videoId: videos[0].videoId, duration: videos[0].seconds });
      } else {
        console.warn(`[YouTube Search] No results for: "${query}"`);
        res.status(404).json({ error: "No videos found" });
      }
    } catch (error) {
      console.error("[YouTube Search] Error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  app.get("/api/itunes", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("iTunes API error");
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("iTunes proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from iTunes" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  🎵 Aether Music Server`);
    console.log(`  ➜  Local:   http://localhost:${PORT}`);
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`  ➜  Network: http://${net.address}:${PORT}`);
            }
        }
    }
    console.log('');
  });
}

startServer();
