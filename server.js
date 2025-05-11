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

// Raw body saver for Persona webhooks
function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}

// Authentication middleware
function authenticateUser(req, res, next) {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }
  
  try {
    // This is a placeholder - replace with your actual token verification
    // For example: const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // For now, just mock a user for testing
    req.user = { id: 'user_123' };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
}

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

// Persona Webhook Handler
const { handlePersonaWebhook } = require('./persona/webhookHandler');
app.post('/api/persona/webhook', express.json({ verify: rawBodySaver }), handlePersonaWebhook);

// Handle Persona inquiry creation
app.post('/api/persona/create-inquiry', authenticateUser, async (req, res) => {
  try {
    const { referenceId, redirectUrl } = req.body;
    
    console.log('Creating Persona inquiry for reference ID:', referenceId);
    
    res.json({
      inquiryId: `inq_mock_${Date.now()}`,
      status: 'created',
      message: 'Inquiry created successfully'
    });
  } catch (error) {
    console.error('Error creating Persona inquiry:', error);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

// Handle verification completion
app.post('/api/persona/complete-verification', authenticateUser, async (req, res) => {
  try {
    const { inquiryId } = req.body;
    const userId = req.user.id; 
    
    console.log('Processing verification completion for inquiry:', inquiryId);
    console.log('User ID:', userId);
    
    console.log(`Updating user ${userId} KYC status to "approved"`);
    
    // Return success response
    res.json({
      status: 'approved',
      message: 'Verification processed successfully',
      inquiryId: inquiryId
    });
  } catch (error) {
    console.error('Error completing verification:', error);
    res.status(500).json({ error: 'Failed to process verification' });
  }
});

// Get verification status
app.get('/api/persona/verification-status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; 
    console.log('Fetching verification status for user:', userId);
    
    // For testing, return approved status
    res.json({
      status: 'approved',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

// Fallback to frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
