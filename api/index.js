// api/index.js
// No external packages needed - uses built-in fetch

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, type, season, episode } = req.query;

  // Validate parameters
  if (!id || !type) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameters. Need: id and type (movie/tv)'
    });
  }

  try {
    // Build the VidSrc URL
    let embedUrl;
    if (type === 'movie') {
      embedUrl = `https://vidsrc.to/embed/movie/${id}`;
    } else if (type === 'tv') {
      const s = season || 1;
      const e = episode || 1;
      embedUrl = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use "movie" or "tv"'
      });
    }

    console.log(`📺 Fetching: ${embedUrl}`);

    // Fetch the page
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vidsrc.to/'
      }
    });

    const html = await response.text();

    // Method 1: Look for m3u8 URLs
    const m3u8Regex = /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g;
    const m3u8Matches = html.match(m3u8Regex);

    if (m3u8Matches && m3u8Matches.length > 0) {
      console.log('✅ Found m3u8 URL');
      return res.json({
        success: true,
        url: m3u8Matches[0],
        sources: m3u8Matches.map(url => ({ stream: url }))
      });
    }

    // Method 2: Look for iframe src
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/i;
    const iframeMatch = html.match(iframeRegex);

    if (iframeMatch) {
      const iframeUrl = iframeMatch[1];
      const fullUrl = iframeUrl.startsWith('http') ? iframeUrl : `https://vidsrc.to${iframeUrl}`;
      console.log('✅ Found iframe URL');
      return res.json({
        success: true,
        url: fullUrl,
        note: 'This is an iframe URL - can be embedded'
      });
    }

    // Method 3: Look for any video URL
    const videoRegex = /https?:\/\/[^"'\s]+\.(mp4|ts|m3u8)[^"'\s]*/g;
    const videoMatches = html.match(videoRegex);

    if (videoMatches && videoMatches.length > 0) {
      console.log('✅ Found video URL');
      return res.json({
        success: true,
        url: videoMatches[0],
        sources: videoMatches.map(url => ({ stream: url }))
      });
    }

    // No video found
    console.log('❌ No video found');
    return res.status(404).json({
      success: false,
      error: 'No video stream found. The content may not be available.'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
};
