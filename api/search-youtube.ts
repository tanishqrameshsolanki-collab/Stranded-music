import type { VercelRequest, VercelResponse } from '@vercel/node';
import ytSearch from 'yt-search';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    console.log(`[YouTube Search] Query: "${query}"`);

    // 1. Try Official YouTube Data API if key is set
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

    // 2. Fallback: yt-search scraping
    const r = await ytSearch(query);
    const videos = r.videos.slice(0, 5);
    if (videos.length > 0) {
      console.log(`[YouTube Search] Success (Scrape): ${videos[0].videoId}`);
      return res.json({ videoId: videos[0].videoId, duration: videos[0].seconds });
    }

    console.warn(`[YouTube Search] No results for: "${query}"`);
    return res.status(404).json({ error: 'No videos found' });
  } catch (error) {
    console.error('[YouTube Search] Error:', error);
    return res.status(500).json({ error: 'Failed to search YouTube' });
  }
}
