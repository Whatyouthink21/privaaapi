// api/tmdbScrape.js
// This is the correct implementation based on the docs

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, type, season, episode } = req.query;

  // Validate - same as docs
  if (!id || !type) {
    return res.status(400).json({ 
      error: 'Missing parameters. Need: id and type (movie/tv)' 
    });
  }

  try {
    // Import the library
    const tmdbScrape = require('vidsrc.ts');
    
    let result;
    
    // Use the function exactly as shown in docs
    if (type === 'movie') {
      result = await tmdbScrape(id, 'movie');
    } else if (type === 'tv') {
      const s = parseInt(season) || 1;
      const e = parseInt(episode) || 1;
      result = await tmdbScrape(id, 'tv', s, e);
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "movie" or "tv"' });
    }
    
    // Return format from docs
    if (result && result.length > 0) {
      res.json({
        success: true,
        sources: result,
        stream: result[0].stream // First source as primary
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No stream found'
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
