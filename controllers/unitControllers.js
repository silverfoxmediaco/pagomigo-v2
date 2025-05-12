// controllers/unitController.js
const unitService = require('../services/unitService');
const User = require('../models/User');
const UnitAccount = require('../models/UnitAccount');
const UnitTransaction = require('../models/UnitTransaction');

exports.testConnection = async (req, res) => {
  try {
    // Simple test to verify SDK connection
    const accounts = await unitService.listAccounts({
      page: { limit: 1 }
    });
    
    res.json({
      success: true,
      message: 'Unit SDK connection successful',
      data: accounts
    });
  } catch (error) {
    console.error('Unit connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Unit',
      error: error.message
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user already has a Unit customer
    if (user.unitCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'User already has a Unit customer profile'
      });
    }
    
    // Format customer data
    const customerData = {
      firstName: req.body.firstName || user.firstName,
      lastName: req.body.lastName || user.lastName,
      ssn: req.body.ssn,
      dateOfBirth: req.body.dateOfBirth,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      email: user.email,
      phone: user.phone
    };
    
    // Create customer in Unit
    const customer = await unitService.createCustomer(customerData);
    
    // Update user with Unit customer ID
    user.unitCustomerId = customer.id;
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Unit customer created successfully',
      data: {
        customerId: customer.id
      }
    });
  } catch (error) {
    console.error('Error creating Unit customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Unit customer',
      error: error.message
    });
  }
};

// Add other controller methods (createAccount, getMyAccount, etc.)...

exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature (implement this)
    // const isValid = verifyWebhookSignature(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid webhook signature' });
    // }
    
    const event = JSON.parse(req.body.toString());
    console.log('Received Unit webhook:', event.type);
    
    // Process different event types
    switch (event.type) {
      case 'payment.state.completed':
        await processCompletedPayment(event.data);
        break;
      
      case 'account.created':
        await processAccountCreated(event.data);
        break;
      
      // Add other event handlers
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Unit webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
};

// Helper functions for webhook handling
async function processCompletedPayment(data) {
  // Implement payment processing logic
}

async function processAccountCreated(data) {
  // Implement account creation logic
}