const fetch = require('node-fetch');

const API_URL = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

/**
 * Fetch historical data from WinGo API
 */
async function fetchHistoricalData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return parseData(data);
    
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Parse raw API data
 */
function parseData(rawData) {
  if (!rawData?.data?.list || !Array.isArray(rawData.data.list)) {
    throw new Error('Invalid API response structure');
  }

  const parsed = rawData.data.list.map(item => {
    const num = parseInt(item.number) || 0;
    return {
      issue: item.issueNumber || '',
      number: num,
      result: num >= 5 ? 'BIG' : 'SMALL',
      timestamp: item.createTime || Date.now()
    };
  }).reverse(); // Oldest first

  return parsed;
}

module.exports = {
  fetchHistoricalData
};
