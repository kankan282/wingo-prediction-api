const fetch = require('node-fetch');

const DATA_SOURCE_URL = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

/**
 * Fetches real-time historical data from WinGo API
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Array>} Formatted historical data
 */
async function fetchHistoricalData(timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(DATA_SOURCE_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const rawData = await response.json();
    
    // Parse and normalize data
    return parseWinGoData(rawData);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - data source too slow');
    }
    
    throw new Error(`Data fetch failed: ${error.message}`);
  }
}

/**
 * Parses raw WinGo API response into standardized format
 * @param {Object} rawData - Raw API response
 * @returns {Array} Normalized data array
 */
function parseWinGoData(rawData) {
  if (!rawData || !rawData.data || !Array.isArray(rawData.data.list)) {
    throw new Error('Invalid data structure from API');
  }

  return rawData.data.list.map(item => {
    const number = parseInt(item.number);
    const isBig = number >= 5; // 5-9 = BIG, 0-4 = SMALL
    
    return {
      issueNumber: item.issueNumber,
      number: number,
      result: isBig ? 'BIG' : 'SMALL',
      color: item.color,
      timestamp: item.createTime || Date.now()
    };
  }).reverse(); // Oldest first for time-series analysis
}

/**
 * Extracts numeric sequence from historical data
 * @param {Array} data - Historical data
 * @returns {Array<number>} Number sequence
 */
function extractNumberSequence(data) {
  return data.map(item => item.number);
}

/**
 * Extracts result sequence (BIG/SMALL)
 * @param {Array} data - Historical data
 * @returns {Array<string>} Result sequence
 */
function extractResultSequence(data) {
  return data.map(item => item.result);
}

module.exports = {
  fetchHistoricalData,
  extractNumberSequence,
  extractResultSequence
};
