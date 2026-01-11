const { fetchHistoricalData } = require('./dataFetcher');
const { runEnsemble } = require('./models');
const cache = require('./cache');

/**
 * Main prediction engine
 */
async function predict() {
  try {
    // Fetch data
    const data = await fetchHistoricalData();
    
    if (!data || data.length < 20) {
      throw new Error('Insufficient data');
    }
    
    const numbers = data.map(d => d.number);
    const results = data.map(d => d.result);
    const latest = data[data.length - 1];
    
    // Check previous prediction
    let winLoss = null;
    const prevPrediction = cache.get('lastPrediction');
    
    if (prevPrediction) {
      const wasCorrect = prevPrediction.prediction === latest.result;
      winLoss = {
        status: wasCorrect ? '✅ WIN' : '❌ LOSS',
        predicted: prevPrediction.prediction,
        actual: latest.result,
        issue: latest.issue,
        confidence: prevPrediction.confidence
      };
    }
    
    // Generate new prediction
    const ensemble = runEnsemble(numbers, results);
    
    const nextPrediction = {
      prediction: ensemble.prediction,
      confidence: ensemble.confidence,
      models: ensemble.models,
      votes: ensemble.votes,
      forIssue: parseInt(latest.issue) + 1,
      timestamp: Date.now()
    };
    
    // Cache for next time
    cache.set('lastPrediction', nextPrediction, 120000);
    
    // Calculate backtest accuracy
    const accuracy = calculateAccuracy(numbers, results);
    
    return {
      success: true,
      winLoss,
      next: nextPrediction,
      latest: {
        issue: latest.issue,
        number: latest.number,
        result: latest.result
      },
      accuracy,
      dataPoints: data.length
    };
    
  } catch (error) {
    throw new Error(`Engine error: ${error.message}`);
  }
}

/**
 * Calculate historical accuracy
 */
function calculateAccuracy(numbers, results) {
  if (numbers.length < 30) {
    return { rate: 0, tested: 0, correct: 0 };
  }
  
  let correct = 0;
  const testSize = Math.min(30, numbers.length - 15);
  
  for (let i = numbers.length - testSize; i < numbers.length - 1; i++) {
    const trainNumbers = numbers.slice(0, i);
    const trainResults = results.slice(0, i);
    const prediction = runEnsemble(trainNumbers, trainResults);
    
    if (prediction.prediction === results[i]) {
      correct++;
    }
  }
  
  return {
    rate: Math.round((correct / testSize) * 100),
    tested: testSize,
    correct
  };
}

/**
 * Get stats only
 */
async function getStats() {
  try {
    const data = await fetchHistoricalData();
    const last10 = data.slice(-10);
    
    return {
      success: true,
      total: data.length,
      latestIssue: data[data.length - 1].issue,
      last10: last10.map(d => ({
        issue: d.issue,
        number: d.number,
        result: d.result
      }))
    };
  } catch (error) {
    throw new Error(`Stats error: ${error.message}`);
  }
}

module.exports = {
  predict,
  getStats
};    }
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
