import express from "express";
import cors from "cors";
import ytSearch from "yt-search";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// CORS — allow the Vercel frontend and localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. https://stranded-music.vercel.app
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // Be permissive in early stages; tighten later
    }
  },
  credentials: true,
}));

app.use(express.json());

// --- Health Check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- YouTube Search ---
app.get("/api/search-youtube", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    console.log(`[YouTube Search] Query: "${query}"`);

    // 1. Try Official YouTube API if key is present
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

// --- iTunes Proxy ---
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

// --- Start Server ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  🎵 Aether Music API Server`);
  console.log(`  ➜  Port: ${PORT}`);
  console.log(`  ➜  Health: http://localhost:${PORT}/api/health`);
  console.log(`  ➜  Allowed Origins: ${allowedOrigins.join(", ")}`);
  console.log("");
});
