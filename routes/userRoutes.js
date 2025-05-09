//new code
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    
    const updates = (({ name, username, email, phone, address }) => ({ name, username, email, phone, address }))(req.body);

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;



//old code
// routes/userRoutes.js
/*const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      name: user.name,
      phone: user.phone,
      email: user.email,
      kyc_status: user.kyc_status,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
*/
