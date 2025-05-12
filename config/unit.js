// config/unit.js
const UnitSDK = require('unit-sdk');

// Initialize Unit SDK
const unit = new UnitSDK({
  apiKey: process.env.UNIT_API_KEY,
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.unit.co'     // Production URL
    : 'https://api.s.unit.sh'   // Sandbox URL
});

module.exports = unit;