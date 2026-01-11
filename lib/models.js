/**
 * Collection of 100+ micro-statistical models for ensemble learning
 */

// ==================== MOVING AVERAGE MODELS ====================

function simpleMovingAverage(data, period) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  const avg = recent.reduce((sum, val) => sum + val, 0) / period;
  
  return avg >= 4.5 ? 'BIG' : 'SMALL';
}

function exponentialMovingAverage(data, period) {
  if (data.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = data[0];
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema >= 4.5 ? 'BIG' : 'SMALL';
}

function weightedMovingAverage(data, period) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  let weighted = 0;
  let weights = 0;
  
  recent.forEach((val, idx) => {
    const weight = idx + 1;
    weighted += val * weight;
    weights += weight;
  });
  
  const wma = weighted / weights;
  return wma >= 4.5 ? 'BIG' : 'SMALL';
}

// ==================== RSI-BASED MODELS ====================

function relativeStrengthIndex(data, period = 14) {
  if (data.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 'BIG';
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // RSI > 50 suggests upward momentum (BIG), < 50 suggests downward (SMALL)
  return rsi > 50 ? 'BIG' : 'SMALL';
}

function stochasticRSI(data, period = 14) {
  if (data.length < period * 2) return null;
  
  const recent = data.slice(-period);
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  const current = recent[recent.length - 1];
  
  if (max === min) return 'SMALL';
  
  const stochRSI = ((current - min) / (max - min)) * 100;
  
  return stochRSI > 50 ? 'BIG' : 'SMALL';
}

// ==================== MOMENTUM MODELS ====================

function momentumIndicator(data, period = 10) {
  if (data.length < period) return null;
  
  const current = data[data.length - 1];
  const previous = data[data.length - period];
  const momentum = current - previous;
  
  return momentum >= 0 ? 'BIG' : 'SMALL';
}

function rateOfChange(data, period = 12) {
  if (data.length < period) return null;
  
  const current = data[data.length - 1];
  const previous = data[data.length - period];
  
  if (previous === 0) return 'SMALL';
  
  const roc = ((current - previous) / previous) * 100;
  
  return roc >= 0 ? 'BIG' : 'SMALL';
}

// ==================== FIBONACCI MODELS ====================

function fibonacciRetracement(data) {
  if (data.length < 20) return null;
  
  const recent = data.slice(-20);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const current = data[data.length - 1];
  
  const range = high - low;
  const fib618 = high - (range * 0.618);
  const fib382 = high - (range * 0.382);
  
  if (current > fib382) return 'BIG';
  if (current < fib618) return 'SMALL';
  
  return current >= 4.5 ? 'BIG' : 'SMALL';
}

function fibonacciSequencePattern(data) {
  if (data.length < 5) return null;
  
  const fib = [0, 1, 1, 2, 3, 5, 8];
  const recent = data.slice(-5);
  
  let fibMatches = 0;
  recent.forEach(num => {
    if (fib.includes(num)) fibMatches++;
  });
  
  return fibMatches >= 3 ? 'BIG' : 'SMALL';
}

// ==================== PATTERN RECOGNITION MODELS ====================

function consecutivePattern(results) {
  if (results.length < 3) return null;
  
  const last3 = results.slice(-3);
  const allSame = last3.every(r => r === last3[0]);
  
  // Mean reversion: if 3 consecutive same, predict opposite
  if (allSame) {
    return last3[0] === 'BIG' ? 'SMALL' : 'BIG';
  }
  
  return results[results.length - 1];
}

function zigzagPattern(results) {
  if (results.length < 4) return null;
  
  const last4 = results.slice(-4);
  const isZigzag = last4[0] !== last4[1] && 
                   last4[1] !== last4[2] && 
                   last4[2] !== last4[3];
  
  if (isZigzag) {
    // Continue zigzag pattern
    return last4[3] === 'BIG' ? 'SMALL' : 'BIG';
  }
  
  return last4[3];
}

function streakBreaker(results) {
  if (results.length < 5) return null;
  
  const last5 = results.slice(-5);
  const bigCount = last5.filter(r => r === 'BIG').length;
  
  // If heavily skewed, predict mean reversion
  if (bigCount >= 4) return 'SMALL';
  if (bigCount <= 1) return 'BIG';
  
  return last5[4];
}

function cyclicPattern(results, cycle = 7) {
  if (results.length < cycle * 2) return null;
  
  const recentCycle = results.slice(-cycle);
  const previousCycle = results.slice(-cycle * 2, -cycle);
  
  let similarity = 0;
  for (let i = 0; i < cycle; i++) {
    if (recentCycle[i] === previousCycle[i]) similarity++;
  }
  
  // If cycles are similar, follow previous pattern
  if (similarity >= cycle * 0.6) {
    const nextInPrevious = results[results.length - cycle];
    return nextInPrevious;
  }
  
  return results[results.length - 1];
}

// ==================== FREQUENCY ANALYSIS MODELS ====================

function frequencyDistribution(data, lookback = 30) {
  if (data.length < lookback) return null;
  
  const recent = data.slice(-lookback);
  const bigCount = recent.filter(n => n >= 5).length;
  const bigFreq = bigCount / lookback;
  
  // Predict based on which is less frequent (mean reversion)
  return bigFreq < 0.5 ? 'BIG' : 'SMALL';
}

function hotColdNumbers(data, lookback = 50) {
  if (data.length < lookback) return null;
  
  const recent = data.slice(-lookback);
  const frequency = {};
  
  recent.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  
  const hotNumbers = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([num]) => parseInt(num));
  
  const hotAvg = hotNumbers.reduce((sum, n) => sum + n, 0) / hotNumbers.length;
  
  return hotAvg >= 4.5 ? 'BIG' : 'SMALL';
}

// ==================== VOLATILITY MODELS ====================

function standardDeviation(data, period = 20) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  const mean = recent.reduce((sum, val) => sum + val, 0) / period;
  const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  // Higher volatility = more likely to be extreme values
  return stdDev > 2 ? 'BIG' : 'SMALL';
}

function bollingerBands(data, period = 20, multiplier = 2) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  const sma = recent.reduce((sum, val) => sum + val, 0) / period;
  const variance = recent.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upperBand = sma + (stdDev * multiplier);
  const lowerBand = sma - (stdDev * multiplier);
  const current = data[data.length - 1];
  
  if (current >= upperBand) return 'SMALL'; // Overbought, expect reversal
  if (current <= lowerBand) return 'BIG'; // Oversold, expect reversal
  
  return current >= sma ? 'BIG' : 'SMALL';
}

// ==================== TREND FOLLOWING MODELS ====================

function linearRegression(data, period = 15) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  const n = recent.length;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  recent.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  return slope > 0 ? 'BIG' : 'SMALL';
}

function trendStrength(data, period = 10) {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  let upMoves = 0;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) upMoves++;
  }
  
  const trendScore = upMoves / (recent.length - 1);
  
  return trendScore > 0.5 ? 'BIG' : 'SMALL';
}

// ==================== ADVANCED PATTERN MODELS ====================

function supportResistance(data, lookback = 30) {
  if (data.length < lookback) return null;
  
  const recent = data.slice(-lookback);
  const resistance = Math.max(...recent);
  const support = Math.min(...recent);
  const current = data[data.length - 1];
  
  const range = resistance - support;
  const position = (current - support) / range;
  
  if (position > 0.7) return 'SMALL'; // Near resistance
  if (position < 0.3) return 'BIG'; // Near support
  
  return current >= 4.5 ? 'BIG' : 'SMALL';
}

function gapAnalysis(data) {
  if (data.length < 10) return null;
  
  const recent = data.slice(-10);
  let gaps = 0;
  
  for (let i = 1; i < recent.length; i++) {
    const gap = Math.abs(recent[i] - recent[i - 1]);
    if (gap >= 3) gaps++;
  }
  
  // Many gaps suggest volatility, expect extremes
  return gaps >= 3 ? 'BIG' : 'SMALL';
}

// ==================== ENSEMBLE PREDICTOR ====================

/**
 * Runs all models and aggregates predictions
 * @param {Array<number>} numbers - Historical numbers
 * @param {Array<string>} results - Historical BIG/SMALL results
 * @returns {Object} Ensemble prediction with confidence
 */
function runEnsembleModels(numbers, results) {
  const predictions = [];
  
  // Moving Average Models (15 variations)
  for (let period of [3, 5, 7, 10, 14, 20, 30]) {
    predictions.push(simpleMovingAverage(numbers, period));
    predictions.push(exponentialMovingAverage(numbers, period));
    if (period <= 20) predictions.push(weightedMovingAverage(numbers, period));
  }
  
  // RSI Models (10 variations)
  for (let period of [7, 9, 14, 21, 28]) {
    predictions.push(relativeStrengthIndex(numbers, period));
    predictions.push(stochasticRSI(numbers, period));
  }
  
  // Momentum Models (10 variations)
  for (let period of [5, 7, 10, 12, 15]) {
    predictions.push(momentumIndicator(numbers, period));
    predictions.push(rateOfChange(numbers, period));
  }
  
  // Fibonacci Models (5 variations)
  predictions.push(fibonacciRetracement(numbers));
  predictions.push(fibonacciSequencePattern(numbers));
  for (let i = 0; i < 3; i++) {
    predictions.push(fibonacciRetracement(numbers.slice(-30 + i * 5)));
  }
  
  // Pattern Recognition Models (20 variations)
  predictions.push(consecutivePattern(results));
  predictions.push(zigzagPattern(results));
  predictions.push(streakBreaker(results));
  for (let cycle of [5, 6, 7, 8, 9, 10]) {
    predictions.push(cyclicPattern(results, cycle));
  }
  for (let i = 0; i < 13; i++) {
    predictions.push(consecutivePattern(results.slice(-10 - i)));
  }
  
  // Frequency Analysis Models (15 variations)
  for (let lookback of [20, 30, 40, 50, 60]) {
    predictions.push(frequencyDistribution(numbers, lookback));
    predictions.push(hotColdNumbers(numbers, lookback));
  }
  for (let i = 0; i < 5; i++) {
    predictions.push(frequencyDistribution(numbers, 25 + i * 3));
  }
  
  // Volatility Models (15 variations)
  for (let period of [10, 15, 20, 25, 30]) {
    predictions.push(standardDeviation(numbers, period));
    predictions.push(bollingerBands(numbers, period));
  }
  for (let mult of [1.5, 2, 2.5]) {
    predictions.push(bollingerBands(numbers, 20, mult));
  }
  
  // Trend Following Models (15 variations)
  for (let period of [5, 10, 15, 20, 25]) {
    predictions.push(linearRegression(numbers, period));
    predictions.push(trendStrength(numbers, period));
  }
  for (let i = 0; i < 5; i++) {
    predictions.push(trendStrength(numbers.slice(-20 - i * 2)));
  }
  
  // Advanced Pattern Models (15 variations)
  for (let lookback of [20, 25, 30, 35, 40]) {
    predictions.push(supportResistance(numbers, lookback));
  }
  for (let i = 0; i < 10; i++) {
    predictions.push(gapAnalysis(numbers.slice(-15 - i)));
  }
  
  // Filter out null predictions
  const validPredictions = predictions.filter(p => p !== null);
  
  if (validPredictions.length === 0) {
    return { prediction: 'SMALL', confidence: 0, modelCount: 0 };
  }
  
  // Count votes
  const bigVotes = validPredictions.filter(p => p === 'BIG').length;
  const smallVotes = validPredictions.filter(p => p === 'SMALL').length;
  
  const totalVotes = bigVotes + smallVotes;
  const prediction = bigVotes > smallVotes ? 'BIG' : 'SMALL';
  const confidence = Math.round((Math.max(bigVotes, smallVotes) / totalVotes) * 100);
  
  return {
    prediction,
    confidence,
    modelCount: totalVotes,
    breakdown: {
      BIG: bigVotes,
      SMALL: smallVotes
    }
  };
}

module.exports = {
  runEnsembleModels
};
