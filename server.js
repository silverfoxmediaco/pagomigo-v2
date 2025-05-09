// server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const personaRoutes = require('./persona/personaRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const requestRoutes = require('./routes/requestRoutes');
const isProd = process.env.NODE_ENV === 'production';

const app = express();

// CORS setup
app.use(cors({
  origin: isProd
    ? ['https://www.pagomigo.com', 'https://pagomigo.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true
}));
console.log('CORS enabled');

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch URI errors
app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (err) {
    console.warn('Bad URI:', req.path);
    res.status(400).send('Bad Request');
  }
});

// Ignore certain static/resource routes
const ignoredPaths = [
  '/favicon.ico', '/robots.txt', '/sitemap.xml', '/public/', '/static/', '/assets/',
  '/images/', '/css/', '/js/', '/fonts/', '/videos/', '/audio/',
  '/docs/', '/uploads/', '/downloads/'
];
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (ignoredPaths.some(prefix => req.path.startsWith(prefix))) {
    return res.status(200).send('OK');
  }

  // Redirect all non-www subdomains to www
  const disallowedDomains = [
    'pagomigo.com',
    'test.pagomigo.com',
    'api.pagomigo.com',
    'test.api.pagomigo.com',
    //'localhost'
  ];
  if (disallowedDomains.includes(req.hostname)) {
    return res.redirect(301, `https://www.pagomigo.com${req.originalUrl}`);
  }

  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pagomigo API is alive!' });
});

// Fallback to frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

//WehookHandler for Persona
const { handlePersonaWebhook } = require('./persona/webhookHandler');
app.post('/api/persona/webhook', express.json({ verify: rawBodySaver }), handlePersonaWebhook);
function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}
// Handle Persona inquiry creation


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
