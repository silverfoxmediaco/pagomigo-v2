const fs = require('fs');
const unit = require('unit-sdk');

let token;
try {
  token = fs.readFileSync('/etc/secrets/UNIT_API_TOKEN', 'utf8').trim();
} catch (err) {
  console.error('Error reading Unit API token:', err);
  token = process.env.UNIT_API_TOKEN;
}

const client = new unit.Client({
  token: token,
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.unit.co'
    : 'https://api.s.unit.sh'
});

module.exports = client;
