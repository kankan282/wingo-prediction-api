const { runEnsembleModels } = require('./models');
const { fetchHistoricalData, extractNumberSequence, extractResultSequence } = require('./dataFetcher');
const cache = require('./cache');

/**
 * Core prediction engine with win/loss tracking
 * @returns {Promise<Object>} Prediction result with win/loss status
 */
async function generatePrediction() {
  try {
    // Step 1: Fetch real-time data
    const historicalData = await fetchHistoricalData();
    
    if (!historicalData || historicalData.length < 10) {
      throw new Error('Insufficient historical data for analysis');
    }
    
    // Step 2: Extract sequences for analysis
    const numbers = extractNumberSequence(historicalData);
    const results = extractResultSequence(historicalData);
    
    // Step 3: Get latest actual result
    const latestResult = historicalData[historicalData.length - 1];
    
    // Step 4: Check previous prediction and compare
    let winLossStatus = null;
    let previousPrediction = null;
    
    if (cache.has('lastPrediction')) {
      previousPrediction = cache.get('lastPrediction');
      const wasCorrect = previousPrediction.prediction === latestResult.result;
      
      winLossStatus = {
        status: wasCorrect ? 'WIN' : 'LOSS',
        predicted: previousPrediction.prediction,
        actual: latestResult.result,
        issueNumber: latestResult.issueNumber,
        accuracy: previousPrediction.confidence
      };
    }
    
    // Step 5: Run ensemble model for next prediction
    const ensembleResult = runEnsembleModels(numbers, results);
    
    // Step 6: Prepare next prediction
    const nextPrediction = {
      prediction: ensembleResult.prediction,
      confidence: ensembleResult.confidence,
      modelCount: ensembleResult.modelCount,
      breakdown: ensembleResult.breakdown,
      timestamp: Date.now(),
      nextIssue: parseInt(latestResult.issueNumber) + 1
    };
    
    // Step 7: Cache prediction for next comparison
    cache.set('lastPrediction', nextPrediction);
    
    // Step 8: Calculate historical accuracy
    const historicalAccuracy = calculateHistoricalAccuracy(numbers, results);
    
    return {
      success: true,
      winLoss: winLossStatus,
      nextPrediction: nextPrediction,
      historicalAccuracy: historicalAccuracy,
      latestData: {
        issueNumber: latestResult.issueNumber,
        number: latestResult.number,
        result: latestResult.result
      },
      dataPoints: historicalData.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    throw new Error(`Prediction engine failed: ${error.message}`);
  }
}

/**
 * Calculates historical accuracy of the ensemble model
 * @param {Array<number>} numbers - Historical numbers
 * @param {Array<string>} results - Historical results
 * @returns {Object} Accuracy metrics
 */
function calculateHistoricalAccuracy(numbers, results) {
  if (numbers.length < 20) {
    return { accuracy: 0, testedPredictions: 0 };
  }
  
  let correct = 0;
  let total = 0;
  
  // Test on last 50 data points
  const testSize = Math.min(50, numbers.length - 10);
  
  for (let i = numbers.length - testSize; i < numbers.length - 1; i++) {
    const trainingNumbers = numbers.slice(0, i);
    const trainingResults = results.slice(0, i);
    
    const prediction = runEnsembleModels(trainingNumbers, trainingResults);
    const actualResult = results[i];
    
    if (prediction.prediction === actualResult) {
      correct++;
    }
    total++;
  }
  
  return {
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    testedPredictions: total,
    correctPredictions: correct
  };
}

/**
 * Get current statistics without making a new prediction
 * @returns {Promise<Object>} Current stats
 */
async function getStats() {
  try {
    const historicalData = await fetchHistoricalData();
    const numbers = extractNumberSequence(historicalData);
    const results = extractResultSequence(historicalData);
    
    const last10 = results.slice(-10);
    const bigCount = last10.filter(r => r === 'BIG').length;
    const smallCount = last10.filter(r => r === 'SMALL').length;
    
    return {
      success: true,
      totalRecords: historicalData.length,
      latestIssue: historicalData[historicalData.length - 1].issueNumber,
      last10Results: last10,
      last10Distribution: {
        BIG: bigCount,
        SMALL: smallCount
      },
      recentNumbers: numbers.slice(-10),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Stats retrieval failed: ${error.message}`);
  }
}

module.exports = {
  generatePrediction,
  getStats
};
