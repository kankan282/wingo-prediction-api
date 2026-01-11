const { generatePrediction, getStats } = require('../lib/ensembleEngine');

/**
 * Main Vercel Serverless Function
 * Ultra-fast prediction API with win/loss tracking
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const startTime = Date.now();
  
  try {
    // Route handling
    const path = req.url.split('?')[0];
    
    // Health check endpoint
    if (path === '/api/health' || path === '/api/') {
      return res.status(200).json({
        status: 'healthy',
        service: 'WinGo Prediction Engine',
        version: '2.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    }
    
    // Stats endpoint
    if (path === '/api/stats') {
      const stats = await getStats();
      const executionTime = Date.now() - startTime;
      
      return res.status(200).json({
        ...stats,
        executionTime: `${executionTime}ms`
      });
    }
    
    // Main prediction endpoint
    if (path === '/api/predict' || path === '/api') {
      const predictionResult = await generatePrediction();
      const executionTime = Date.now() - startTime;
      
      // Format response
      const response = {
        success: true,
        message: predictionResult.winLoss 
          ? `Previous prediction: ${predictionResult.winLoss.status}! 🎯`
          : 'First prediction - no previous data to compare',
        
        // Win/Loss tracking
        previousResult: predictionResult.winLoss || null,
        
        // Next prediction
        nextPrediction: {
          result: predictionResult.nextPrediction.prediction,
          confidence: `${predictionResult.nextPrediction.confidence}%`,
          forIssue: predictionResult.nextPrediction.nextIssue,
          basedOnModels: predictionResult.nextPrediction.modelCount,
          modelBreakdown: predictionResult.nextPrediction.breakdown
        },
        
        // Performance metrics
        performance: {
          historicalAccuracy: `${predictionResult.historicalAccuracy.accuracy}%`,
          testedOn: predictionResult.historicalAccuracy.testedPredictions,
          correctPredictions: predictionResult.historicalAccuracy.correctPredictions,
          dataPointsAnalyzed: predictionResult.dataPoints,
          executionTime: `${executionTime}ms`
        },
        
        // Latest actual data
        latestDrawn: predictionResult.latestData,
        
        // Disclaimer
        disclaimer: '⚠️ For educational purposes only. No algorithm can guarantee random outcomes.',
        
        timestamp: predictionResult.timestamp
      };
      
      return res.status(200).json(response);
    }
    
    // 404 for unknown routes
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      availableEndpoints: [
        '/api/predict - Get next prediction with win/loss tracking',
        '/api/stats - Get current statistics',
        '/api/health - Health check'
      ]
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      executionTime: `${Date.now() - startTime}ms`
    });
  }
};
