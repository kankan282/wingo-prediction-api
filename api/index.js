const { predict, getStats } = require('../lib/engine');

/**
 * Vercel Serverless Function
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const start = Date.now();
  
  try {
    const url = req.url || '/';
    const path = url.split('?')[0];
    
    // Health check
    if (path === '/api/health' || path === '/api/') {
      return res.status(200).json({
        status: 'healthy',
        service: 'WinGo Prediction API',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      });
    }
    
    // Stats endpoint
    if (path === '/api/stats') {
      const stats = await getStats();
      return res.status(200).json({
        ...stats,
        executionTime: `${Date.now() - start}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Main prediction endpoint
    if (path === '/api/predict' || path === '/api') {
      const result = await predict();
      
      const response = {
        success: true,
        
        // Previous result
        ...(result.winLoss ? {
          previousPrediction: result.winLoss
        } : {
          message: 'First prediction - no previous data'
        }),
        
        // Next prediction
        nextPrediction: {
          result: result.next.prediction,
          confidence: `${result.next.confidence}%`,
          forIssue: result.next.forIssue,
          basedOn: `${result.next.models} models`,
          votes: result.next.votes
        },
        
        // Performance
        performance: {
          historicalAccuracy: `${result.accuracy.rate}%`,
          testedOn: `${result.accuracy.tested} predictions`,
          correctPredictions: result.accuracy.correct,
          dataPoints: result.dataPoints,
          executionTime: `${Date.now() - start}ms`
        },
        
        // Latest drawn
        latestDrawn: result.latest,
        
        // Disclaimer
        disclaimer: '⚠️ Educational only. Cannot predict random outcomes.',
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
    }
    
    // 404
    return res.status(404).json({
      error: 'Not Found',
      availableEndpoints: [
        'GET /api/predict - Main prediction',
        'GET /api/stats - Statistics',
        'GET /api/health - Health check'
      ]
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
