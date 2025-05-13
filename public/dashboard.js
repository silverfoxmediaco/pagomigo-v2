// dashboard.js

// Burger menu logic
const hamburger = document.getElementById("hamburger");
const slideoutMenu = document.getElementById("slideoutMenu");
const closeBtn = document.getElementById("closeMenu");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    slideoutMenu.classList.add("open");
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
}

// Use your custom domain as the API base
const API_BASE = '';

// Fetch user profile, transactions, and incoming requests
async function loadDashboard() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (profileRes.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const profile = await profileRes.json();
    console.log('User profile data:', profile);

    // Get all the elements we need to update
    const kycBanner = document.getElementById('kyc-banner'); // Moved up here
    const nameEl = document.getElementById('user-name');
    const phoneEl = document.getElementById('user-phone');
    const emailEl = document.getElementById('user-email');
    const addressEl = document.getElementById('user-address');
    const kycEl = document.getElementById('user-kyc');
    const balanceEl = document.getElementById('user-balance');
    
    // Update elements if they exist
    if (nameEl) {
      // Use name if available, username as fallback, or "User" as default
      nameEl.textContent = profile.name || profile.username || 'User';
    }
    
    if (phoneEl) {
      phoneEl.textContent = profile.phone || 'Phone not available';
    }
    
    if (emailEl) {
      emailEl.textContent = profile.email || 'Email not available';
    }
    
    if (addressEl) {
      addressEl.textContent = profile.address || 'Address not available';
    }
    
    if (kycEl) {
      const kycStatus = profile.kyc_status || profile.kycStatus || 'pending';
      const statusDisplay = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'pending_review': 'Under Review'
      };
      kycEl.textContent = statusDisplay[kycStatus] || 'Pending';
      kycEl.className = '';
      kycEl.classList.add(`status-${kycStatus}`); // Fixed to use correct variable and element
    }
    
    if (balanceEl) {
      // Always display $500.00 for testing
      balanceEl.textContent = '$500.00';
    }

    // KYC banner logic
    if (kycBanner) {
      const kycStatus = profile.kyc_status || profile.kycStatus || 'pending';
      if (kycStatus === 'approved' || kycStatus === 'pending_review') {
        kycBanner.style.display = 'none';
      } else {
        kycBanner.style.display = 'block';
        // Event listener for KYC button
        const startKycBtn = document.getElementById('start-kyc-btn');
        if (startKycBtn) {
          startKycBtn.addEventListener('click', function() {
            window.location.href = 'identity-verification.html'; // Changed from kyc.html
          });
        }
      }
    }

    const txRes = await fetch(`${API_BASE}/api/transactions/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const transactions = await txRes.json();
    const txList = document.getElementById('transaction-list');
    txList.innerHTML = '';
    transactions.forEach(tx => {
      const li = document.createElement('li');
      li.textContent = `${tx.recipientName} • ${tx.recipientCountry} • $${tx.amountUsd} • ${tx.status}`;
      txList.appendChild(li);
    });

    const reqRes = await fetch(`${API_BASE}/api/requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const requests = await reqRes.json();
    const reqList = document.getElementById('request-list');
    reqList.innerHTML = '';
    requests.forEach(req => {
      const li = document.createElement('li');
      li.textContent = `${req.requestNote} • $${req.amountUsd} • From: ${req.requesterId?.name || 'User'}`;

      if (req.status === 'pending') {
        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Approve';
        approveBtn.classList.add('approve-btn');
        approveBtn.addEventListener('click', () => approveRequest(req._id));
        li.appendChild(approveBtn);

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Decline';
        declineBtn.classList.add('decline-btn');
        declineBtn.addEventListener('click', () => declineRequest(req._id));
        li.appendChild(declineBtn);
      }

      reqList.appendChild(li);
    });
    
  } catch (err) {
    console.error('Dashboard load error:', err);
    console.error('Error details:', err.message);
    window.location.href = 'login.html';
  }
}

async function approveRequest(requestId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/requests/${requestId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await res.json();
    alert(result.message || 'Request approved');
    loadDashboard();
  } catch (error) {
    console.error('Approve request error:', error);
    alert('Failed to approve request');
  }
}

async function declineRequest(requestId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/requests/${requestId}/decline`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await res.json();
    alert(result.message || 'Request declined');
    loadDashboard();
  } catch (error) {
    console.error('Decline request error:', error);
    alert('Failed to decline request');
  }
}

// Load dashboard data on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDashboard);
} else {
  loadDashboard();
}

const modal = document.getElementById('editProfileModal');
const openBtn = document.getElementById('openEditProfileModal');
const closeProfileBtn = document.querySelector('.close-profile-modal');
const form = document.getElementById('editProfileForm');

openBtn.addEventListener('click', async () => {
  try {
    // Load current profile
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const user = await res.json();
      console.log('Profile data for edit form:', user); // Debug log
      
      // Populate form fields
      document.getElementById('edit-name').value = user.name || '';
      document.getElementById('edit-username').value = user.username || '';
      document.getElementById('edit-email').value = user.email || '';
      document.getElementById('edit-phone').value = user.phone || '';
      document.getElementById('edit-address').value = user.address || '';
      
      modal.classList.add('open');
    } else {
      console.error('Failed to fetch profile for editing:', await res.text());
      alert('Could not load your profile. Please try again.');
    }
  } catch (error) {
    console.error('Error in edit profile modal:', error);
    alert('An error occurred. Please try again.');
  }
});

closeProfileBtn.addEventListener('click', () => {
  modal.classList.remove('open');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem('token');
    const updatedUser = {
      name: document.getElementById('edit-name').value,
      username: document.getElementById('edit-username').value,
      email: document.getElementById('edit-email').value,
      phone: document.getElementById('edit-phone').value,
      address: document.getElementById('edit-address').value
    };

    console.log('Sending updated profile data:', updatedUser); // Debug log

    const res = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedUser)
    });

    if (res.ok) {
      const result = await res.json();
      console.log('Profile update response:', result); // Debug log
      
      alert("Profile updated successfully!");
      modal.classList.remove('open');
      loadDashboard(); // refresh the UI
    } else {
      const errorText = await res.text();
      console.error('Profile update failed:', errorText);
      alert("Failed to update profile. Please try again.");
    }
  } catch (error) {
    console.error('Profile update error:', error);
    alert("An error occurred while updating your profile.");
  }
});

// Event listener for logout button// Unit Banking Integration
document.addEventListener('DOMContentLoaded', function() {
  // Initialize banking functionality
  initBanking();
});

function initBanking() {
  // Banking section elements
  const sendMoneyTrigger = document.getElementById('send-money-trigger');
  const requestMoneyTrigger = document.getElementById('request-money-trigger');
  const depositTrigger = document.getElementById('deposit-trigger');
  const sendMoneyPanel = document.getElementById('send-money-panel');
  const requestMoneyPanel = document.getElementById('request-money-panel');
  const closePanelButtons = document.querySelectorAll('.close-panel');
  const sendMoneyForm = document.getElementById('send-money-form');
  const requestMoneyForm = document.getElementById('request-money-form');
  const setupAccountBtn = document.getElementById('setup-account-btn');
  
  // Check if user has a Unit account
  checkUnitAccount();
  
  // Event listeners for banking action buttons
  if (sendMoneyTrigger && sendMoneyPanel) {
    sendMoneyTrigger.addEventListener('click', () => {
      hideAllPanels();
      sendMoneyPanel.classList.remove('hidden');
    });
  }
  
  if (requestMoneyTrigger && requestMoneyPanel) {
    requestMoneyTrigger.addEventListener('click', () => {
      hideAllPanels();
      requestMoneyPanel.classList.remove('hidden');
    });
  }
  
  if (depositTrigger) {
    depositTrigger.addEventListener('click', () => {
      alert('Deposit functionality will be available soon!');
    });
  }
  
  // Close panel buttons
  closePanelButtons.forEach(button => {
    button.addEventListener('click', () => {
      hideAllPanels();
    });
  });
  
  // Form submissions
  if (sendMoneyForm) {
    sendMoneyForm.addEventListener('submit', handleSendMoney);
  }
  
  if (requestMoneyForm) {
    requestMoneyForm.addEventListener('submit', handleRequestMoney);
  }
  
  // Setup account button
  if (setupAccountBtn) {
    setupAccountBtn.addEventListener('click', () => {
      setupUnitAccount();
    });
  }
  
  // Fetch Unit balance
  fetchUnitBalance();
}

// Hide all action panels
function hideAllPanels() {
  const panels = document.querySelectorAll('.action-panel');
  panels.forEach(panel => {
    panel.classList.add('hidden');
  });
}

// Check if user has a Unit account
async function checkUnitAccount() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/unit/accounts/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      // User doesn't have a Unit account
      document.getElementById('no-account-message').classList.remove('hidden');
      
      // Disable banking buttons
      document.getElementById('send-money-trigger').disabled = true;
      document.getElementById('request-money-trigger').disabled = true;
      document.getElementById('deposit-trigger').disabled = true;
    }
  } catch (error) {
    console.error('Error checking Unit account:', error);
  }
}

// Fetch and display Unit balance
async function fetchUnitBalance() {
  try {
    const token = localStorage.getItem('token');
    const unitBalanceElement = document.getElementById('unit-balance');
    
    if (!unitBalanceElement) return;
    
    // Make the API call to test connectivity but ignore the result
    try {
      const response = await fetch(`${API_BASE}/api/unit/accounts/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Unit balance data:', data);
        // Process data for logging but don't use it for display
      }
    } catch (unitError) {
      console.log('Unit balance API error:', unitError);
    }
    
    // Always display $500.00 for testing
    unitBalanceElement.textContent = '$500.00';
  } catch (error) {
    console.error('Error fetching Unit balance:', error);
    // Still use the testing fallback in case of error
    const unitBalanceElement = document.getElementById('unit-balance');
    if (unitBalanceElement) {
      unitBalanceElement.textContent = '$500.00';
    }
  }
}

// Handle sending money
async function handleSendMoney(e) {
  e.preventDefault();
  
  const sendButton = document.getElementById('send-button');
  const errorMessage = document.getElementById('send-error-message');
  
  // Get form data
  const receiver = document.getElementById('receiver-input').value.trim();
  const amount = parseFloat(document.getElementById('amount-input').value);
  const note = document.getElementById('note-input').value.trim();
  
  // Basic validation
  if (!receiver) {
    showError(errorMessage, 'Please enter a recipient');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    showError(errorMessage, 'Please enter a valid amount');
    return;
  }
  
  // Convert to cents for API
  const amountInCents = Math.round(amount * 100);
  
  try {
    // Show loading state
    sendButton.disabled = true;
    sendButton.classList.add('loading');
    errorMessage.classList.add('hidden');
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/unit/payments/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiver,
        amount: amountInCents,
        description: note
      })
    });
    
    // Reset loading state
    sendButton.disabled = false;
    sendButton.classList.remove('loading');
    
    if (response.ok) {
      const result = await response.json();
      
      // Reset form
      document.getElementById('send-money-form').reset();
      
      // Hide panel
      hideAllPanels();
      
      // Show success alert
      alert('Money sent successfully!');
      
      // Refresh dashboard data
      loadDashboard();
      fetchUnitBalance();
    } else {
      const error = await response.json();
      showError(errorMessage, error.message || 'Failed to send money');
    }
  } catch (error) {
    console.error('Error sending money:', error);
    showError(errorMessage, 'An error occurred. Please try again.');
    
    // Reset loading state
    sendButton.disabled = false;
    sendButton.classList.remove('loading');
  }
}

// Handle requesting money
async function handleRequestMoney(e) {
  e.preventDefault();
  
  const requestButton = document.getElementById('request-button');
  const errorMessage = document.getElementById('request-error-message');
  
  // Get form data
  const requestFrom = document.getElementById('request-from-input').value.trim();
  const amount = parseFloat(document.getElementById('request-amount-input').value);
  const note = document.getElementById('request-note-input').value.trim();
  
  // Basic validation
  if (!requestFrom) {
    showError(errorMessage, 'Please enter a recipient');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    showError(errorMessage, 'Please enter a valid amount');
    return;
  }
  
  try {
    // Show loading state
    requestButton.disabled = true;
    requestButton.classList.add('loading');
    errorMessage.classList.add('hidden');
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/requests/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        requestedFrom: requestFrom,
        amountUsd: amount,
        requestNote: note
      })
    });
    
    // Reset loading state
    requestButton.disabled = false;
    requestButton.classList.remove('loading');
    
    if (response.ok) {
      const result = await response.json();
      
      // Reset form
      document.getElementById('request-money-form').reset();
      
      // Hide panel
      hideAllPanels();
      
      // Show success alert
      alert('Money request sent successfully!');
      
      // Refresh dashboard data
      loadDashboard();
    } else {
      const error = await response.json();
      showError(errorMessage, error.message || 'Failed to request money');
    }
  } catch (error) {
    console.error('Error requesting money:', error);
    showError(errorMessage, 'An error occurred. Please try again.');
    
    // Reset loading state
    requestButton.disabled = false;
    requestButton.classList.remove('loading');
  }
}

// Setup Unit account
async function setupUnitAccount() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/unit/accounts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Banking account created successfully!');
      
      // Refresh the page to show the new account
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to create banking account');
    }
  } catch (error) {
    console.error('Error setting up Unit account:', error);
    alert('An error occurred while setting up your banking account');
  }
}

// Show error message
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

// Enhanced transaction display
function enhanceTransactionDisplay() {
  const txList = document.getElementById('transaction-list');
  if (!txList) return;
  
  // Clear current transactions
  txList.innerHTML = '';
  
  // Get combined transactions from regular and Unit sources
  Promise.all([
    fetchRegularTransactions(),
    fetchUnitTransactions()
  ]).then(([regularTx, unitTx]) => {
    // Combine and sort by date (newest first)
    const allTransactions = [...regularTx, ...unitTx].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    if (allTransactions.length === 0) {
      txList.innerHTML = '<li class="empty-message">No transactions yet</li>';
      return;
    }
    
    // Display transactions
    allTransactions.forEach(tx => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      
      const isDeposit = tx.direction === 'credit' || tx.type === 'deposit';
      
      // Format amount
      const amount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(tx.amount);
      
      // Format date
      const date = new Date(tx.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      li.innerHTML = `
        <div class="transaction-details">
          <span class="transaction-party">${tx.counterparty || tx.recipientName || 'Transfer'}</span>
          <span class="transaction-date">${formattedDate}</span>
          ${tx.description ? `<span class="transaction-description">${tx.description}</span>` : ''}
        </div>
        <div class="transaction-amount ${isDeposit ? 'positive' : 'negative'}">
          ${isDeposit ? '+' : '-'}${amount}
        </div>
      `;
      
      txList.appendChild(li);
    });
  }).catch(error => {
    console.error('Error loading transactions:', error);
    txList.innerHTML = '<li class="empty-message">Error loading transactions</li>';
  });
}

// Fetch regular transactions
async function fetchRegularTransactions() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/transactions/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    const transactions = await response.json();
    
    // Map to a standardized format
    return transactions.map(tx => ({
      id: tx._id,
      amount: parseFloat(tx.amountUsd),
      recipientName: tx.recipientName,
      counterparty: tx.recipientName,
      date: tx.createdAt,
      status: tx.status,
      description: tx.description || '',
      direction: 'debit', // Assuming outgoing by default
      type: 'regular'
    }));
  } catch (error) {
    console.error('Error fetching regular transactions:', error);
    return [];
  }
}

// Fetch Unit transactions
async function fetchUnitTransactions() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/unit/transactions/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      // If 404, likely no Unit account yet
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch Unit transactions');
    }
    
    const transactions = await response.json();
    
    // Map to a standardized format
    return transactions.map(tx => ({
      id: tx.unitTransactionId,
      amount: tx.amount / 100, // Convert cents to dollars
      counterparty: tx.counterpartyName,
      date: tx.createdAt,
      status: tx.status,
      description: tx.description || '',
      direction: tx.direction, // 'credit' or 'debit'
      type: 'unit'
    }));
  } catch (error) {
    console.error('Error fetching Unit transactions:', error);
    return [];
  }
}

// Call enhanced transaction display when loading dashboard
const originalLoadDashboard = loadDashboard;
loadDashboard = async function() {
  await originalLoadDashboard();
  enhanceTransactionDisplay();
  fetchUnitBalance();
};

document.addEventListener('DOMContentLoaded', function() {
  // Check for hash in URL
  if (window.location.hash === '#banking') {
    const bankingSection = document.getElementById('banking');
    if (bankingSection) {
      setTimeout(() => {
        bankingSection.scrollIntoView({ behavior: 'smooth' });
      }, 500); // Small delay to ensure page is loaded
    }
  }
});
