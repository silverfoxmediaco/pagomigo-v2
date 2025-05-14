// Configuration for Plaid API
const plaid = require('plaid');
require('dotenv').config();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.NODE_ENV === 'production' ? plaid.environments.production : plaid.environments.sandbox;

// Initialize the Plaid client
const plaidClient = new plaid.Client({
  clientID: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: PLAID_ENV,
  options: {
    version: '2020-09-14', // Use the latest API version
  },
});