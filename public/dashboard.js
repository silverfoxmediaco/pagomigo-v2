// dashboard.js - Integrated Banking System
// Main application file combining Unit and Plaid banking integrations

// ========== CONFIGURATION ==========
const API_BASE = ''; // Use your custom domain as the API base
const API_ENDPOINTS = {
  // User endpoints
  profile: `${API_BASE// ========== DASHBOARD MAIN MODULE ==========
const Dashboard = {
  async loadDashboard() {
    try {
      if (!AuthUtils.isAuthenticated()) {
        AuthUtils.redirectToLogin();
        return;
      }
      
      // Load user profile
      const profile = await UserProfile.loadProfile();
      if (!profile) {
        console.error('Failed to load profile');
        return;
      }
      
      // Update profile UI
      UserProfile.updateUI(profile);
      
      // Load transactions and requests
      await Promise.all([
        TransactionsModule.enhanceTransactionDisplay(),
        TransactionsModule.loadIncomingRequests(),
        UnitBanking.fetchUnitBalance(),
        PlaidIntegration.updatePlaidTotalBalance()
      ]);
      
      console.log('Dashboard loaded successfully');
    } catch (err) {
      console.error('Dashboard load error:', err);
      console.error('Error details:', err.message);
      AuthUtils.redirectToLogin();
    }
  },
  
  init() {
    // Initialize menu
    this.initMenu();
    
    // Setup profile edit modal
    UserProfile.setupProfileEditModal();
    
    // Initialize Unit Banking
    UnitBanking.init();
    
    // Initialize Plaid Integration
    PlaidIntegration.init();
    
    // Load dashboard data
    this.loadDashboard();
    
    // Check for hash in URL to scroll to specific section
    this.handleURLHash();
  },
  
  initMenu() {
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
  },
  
  handleURLHash() {
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
  }
};

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});/api/user/profile`,
  // Transaction endpoints
  transactions: `${API_BASE}/api/transactions/history`,
  // Request endpoints
  requests: `${API_BASE}/api/requests`,
  // Unit banking endpoints
  unitAccounts: `${API_BASE}/api/unit/accounts/me`,
  unitBalance: `${API_BASE}/api/unit/accounts/balance`,
  unitPaymentsSend: `${API_BASE}/api/unit/payments/send`,
  unitAccountCreate: `${API_BASE}/api/unit/accounts/create`,
  unitTransactions: `${API_BASE}/api/unit/transactions/history`,
  // Plaid endpoints
  plaidLinkToken: `${API_BASE}/api/plaid/create-link-token`,
  plaidExchangeToken: `${API_BASE}/api/plaid/exchange-token`,
  plaidAccounts: `${API_BASE}/api/plaid/accounts`,
};

// ========== AUTH UTILITIES ==========
const AuthUtils = {
  getToken() {
    return localStorage.getItem('token');
  },
  
  getAuthHeaders() {
    return { 'Authorization': `Bearer ${this.getToken()}` };
  },
  
  isAuthenticated() {
    return !!this.getToken();
  },
  
  redirectToLogin() {
    window.location.href = 'login.html';
  },
  
  handleAuthError(response) {
    if (response.status === 401) {
      this.redirectToLogin();
      return true;
    }
    return false;
  }
};

// ========== UI UTILITIES ==========
const UIUtils = {
  showMessage(elementId, message, autoHide = true) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.classList.remove('hidden');
    
    if (autoHide) {
      setTimeout(() => {
        element.classList.add('hidden');
      }, 5000);
    }
  },
  
  hideAllPanels() {
    const panels = document.querySelectorAll('.action-panel');
    panels.forEach(panel => {
      panel.classList.add('hidden');
    });
  },
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  formatDate(dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  },
  
  showLoading(element) {
    if (element) {
      element.disabled = true;
      element.classList.add('loading');
    }
  },
  
  hideLoading(element) {
    if (element) {
      element.disabled = false;
      element.classList.remove('loading');
    }
  }
};

// ========== USER PROFILE MODULE ==========
const UserProfile = {
  async loadProfile() {
    try {
      if (!AuthUtils.isAuthenticated()) {
        AuthUtils.redirectToLogin();
        return null;
      }
      
      const response = await fetch(API_ENDPOINTS.profile, {
        method: 'GET',
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (AuthUtils.handleAuthError(response)) return null;
      if (!response.ok) throw new Error('Failed to load profile');
      
      const profile = await response.json();
      console.log('User profile data:', profile);
      return profile;
    } catch (error) {
      console.error('Profile load error:', error);
      return null;
    }
  },
  
  updateUI(profile) {
    if (!profile) return;
    
    // Get all profile elements
    const nameEl = document.getElementById('user-name');
    const phoneEl = document.getElementById('user-phone');
    const emailEl = document.getElementById('user-email');
    const addressEl = document.getElementById('user-address');
    const kycEl = document.getElementById('user-kyc');
    const balanceEl = document.getElementById('user-balance');
    const kycBanner = document.getElementById('kyc-banner');
    
    // Update elements if they exist
    if (nameEl) {
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
      kycEl.classList.add(`status-${kycStatus}`);
    }
    
    if (balanceEl) {
      balanceEl.textContent = '$500.00'; // Default for testing
    }
    
    // KYC banner logic
    if (kycBanner) {
      const kycStatus = profile.kyc_status || profile.kycStatus || 'pending';
      kycBanner.style.display = (kycStatus === 'approved' || kycStatus === 'pending_review') ? 'none' : 'block';
      
      // Event listener for KYC button
      const startKycBtn = document.getElementById('start-kyc-btn');
      if (startKycBtn) {
        startKycBtn.addEventListener('click', () => {
          window.location.href = 'identity-verification.html';
        });
      }
    }
  },
  
  setupProfileEditModal() {
    const modal = document.getElementById('editProfileModal');
    const openBtn = document.getElementById('openEditProfileModal');
    const closeBtn = document.querySelector('.close-profile-modal');
    const form = document.getElementById('editProfileForm');
    
    if (!modal || !openBtn || !closeBtn || !form) return;
    
    openBtn.addEventListener('click', async () => {
      try {
        // Load current profile for editing
        const profile = await this.loadProfile();
        if (!profile) {
          alert('Could not load your profile. Please try again.');
          return;
        }
        
        // Populate form fields
        document.getElementById('edit-name').value = profile.name || '';
        document.getElementById('edit-username').value = profile.username || '';
        document.getElementById('edit-email').value = profile.email || '';
        document.getElementById('edit-phone').value = profile.phone || '';
        document.getElementById('edit-address').value = profile.address || '';
        
        modal.classList.add('open');
      } catch (error) {
        console.error('Error in edit profile modal:', error);
        alert('An error occurred. Please try again.');
      }
    });
    
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const updatedUser = {
          name: document.getElementById('edit-name').value,
          username: document.getElementById('edit-username').value,
          email: document.getElementById('edit-email').value,
          phone: document.getElementById('edit-phone').value,
          address: document.getElementById('edit-address').value
        };
        
        console.log('Sending updated profile data:', updatedUser);
        
        const response = await fetch(API_ENDPOINTS.profile, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...AuthUtils.getAuthHeaders()
          },
          body: JSON.stringify(updatedUser)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Profile update response:', result);
          
          alert("Profile updated successfully!");
          modal.classList.remove('open');
          Dashboard.loadDashboard(); // Refresh the dashboard
        } else {
          const errorText = await response.text();
          console.error('Profile update failed:', errorText);
          alert("Failed to update profile. Please try again.");
        }
      } catch (error) {
        console.error('Profile update error:', error);
        alert("An error occurred while updating your profile.");
      }
    });
  }
};

// ========== TRANSACTIONS MODULE ==========
const TransactionsModule = {
  async fetchRegularTransactions() {
    try {
      const response = await fetch(API_ENDPOINTS.transactions, {
        headers: AuthUtils.getAuthHeaders()
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
  },
  
  async loadTransactionHistory() {
    try {
      const txList = document.getElementById('transaction-list');
      if (!txList) return;
      
      const transactions = await this.fetchRegularTransactions();
      txList.innerHTML = '';
      
      if (transactions.length === 0) {
        txList.innerHTML = '<li class="empty-message">No transactions found</li>';
        return;
      }
      
      transactions.forEach(tx => {
        const li = document.createElement('li');
        li.textContent = `${tx.recipientName} • ${tx.recipientCountry || 'N/A'} • $${tx.amount} • ${tx.status}`;
        txList.appendChild(li);
      });
    } catch (error) {
      console.error('Error loading transaction history:', error);
    }
  },
  
  async loadIncomingRequests() {
    try {
      const reqList = document.getElementById('request-list');
      if (!reqList) return;
      
      const response = await fetch(API_ENDPOINTS.requests, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      const requests = await response.json();
      reqList.innerHTML = '';
      
      if (requests.length === 0) {
        reqList.innerHTML = '<li class="empty-message">No requests found</li>';
        return;
      }
      
      requests.forEach(req => {
        const li = document.createElement('li');
        li.textContent = `${req.requestNote} • $${req.amountUsd} • From: ${req.requesterId?.name || 'User'}`;
        
        if (req.status === 'pending') {
          const approveBtn = document.createElement('button');
          approveBtn.textContent = 'Approve';
          approveBtn.classList.add('approve-btn');
          approveBtn.addEventListener('click', () => this.approveRequest(req._id));
          li.appendChild(approveBtn);
          
          const declineBtn = document.createElement('button');
          declineBtn.textContent = 'Decline';
          declineBtn.classList.add('decline-btn');
          declineBtn.addEventListener('click', () => this.declineRequest(req._id));
          li.appendChild(declineBtn);
        }
        
        reqList.appendChild(li);
      });
    } catch (error) {
      console.error('Error loading incoming requests:', error);
    }
  },
  
  async approveRequest(requestId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.requests}/${requestId}/approve`, {
        method: 'PUT',
        headers: AuthUtils.getAuthHeaders()
      });
      
      const result = await response.json();
      alert(result.message || 'Request approved');
      Dashboard.loadDashboard();
    } catch (error) {
      console.error('Approve request error:', error);
      alert('Failed to approve request');
    }
  },
  
  async declineRequest(requestId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.requests}/${requestId}/decline`, {
        method: 'PUT',
        headers: AuthUtils.getAuthHeaders()
      });
      
      const result = await response.json();
      alert(result.message || 'Request declined');
      Dashboard.loadDashboard();
    } catch (error) {
      console.error('Decline request error:', error);
      alert('Failed to decline request');
    }
  },
  
  // Enhanced transaction display combining Unit and Plaid
  async enhanceTransactionDisplay() {
    const txList = document.getElementById('transaction-list');
    if (!txList) return;
    
    // Clear current transactions
    txList.innerHTML = '';
    
    try {
      // Get combined transactions from regular, Unit, and Plaid sources
      const [regularTx, unitTx, plaidTx] = await Promise.all([
        this.fetchRegularTransactions(),
        UnitBanking.fetchUnitTransactions(),
        PlaidIntegration.fetchPlaidTransactions()
      ]);
      
      // Combine and sort by date (newest first)
      const allTransactions = [...regularTx, ...unitTx, ...plaidTx].sort((a, b) => {
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
        const amount = UIUtils.formatCurrency(tx.amount);
        
        // Format date
        const formattedDate = UIUtils.formatDate(tx.date, {
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
    } catch (error) {
      console.error('Error loading transactions:', error);
      txList.innerHTML = '<li class="error-message">Error loading transactions</li>';
    }
  }
};

// ========== UNIT BANKING MODULE ==========
const UnitBanking = {
  init() {
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
    this.checkUnitAccount();
    
    // Event listeners for banking action buttons
    if (sendMoneyTrigger && sendMoneyPanel) {
      sendMoneyTrigger.addEventListener('click', () => {
        UIUtils.hideAllPanels();
        sendMoneyPanel.classList.remove('hidden');
      });
    }
    
    if (requestMoneyTrigger && requestMoneyPanel) {
      requestMoneyTrigger.addEventListener('click', () => {
        UIUtils.hideAllPanels();
        requestMoneyPanel.classList.remove('hidden');
      });
    }
    
    if (depositTrigger) {
      depositTrigger.addEventListener('click', () => {
        alert('Deposit functionality will be available soon!');
      });
    }
    
    // Close panel buttons
    if (closePanelButtons) {
      closePanelButtons.forEach(button => {
        button.addEventListener('click', () => {
          UIUtils.hideAllPanels();
        });
      });
    }
    
    // Form submissions
    if (sendMoneyForm) {
      sendMoneyForm.addEventListener('submit', this.handleSendMoney.bind(this));
    }
    
    if (requestMoneyForm) {
      requestMoneyForm.addEventListener('submit', this.handleRequestMoney.bind(this));
    }
    
    // Setup account button
    if (setupAccountBtn) {
      setupAccountBtn.addEventListener('click', () => {
        this.setupUnitAccount();
      });
    }
    
    // Fetch Unit balance
    this.fetchUnitBalance();
  },
  
  async checkUnitAccount() {
    try {
      const response = await fetch(API_ENDPOINTS.unitAccounts, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (response.status === 404) {
        // User doesn't have a Unit account
        const noAccountMessage = document.getElementById('no-account-message');
        if (noAccountMessage) {
          noAccountMessage.classList.remove('hidden');
        }
        
        // Disable banking buttons
        const buttons = [
          document.getElementById('send-money-trigger'),
          document.getElementById('request-money-trigger'),
          document.getElementById('deposit-trigger')
        ];
        
        buttons.forEach(button => {
          if (button) button.disabled = true;
        });
      }
    } catch (error) {
      console.error('Error checking Unit account:', error);
    }
  },
  
  async fetchUnitBalance() {
    try {
      const unitBalanceElement = document.getElementById('unit-balance');
      if (!unitBalanceElement) return;
      
      // Make the API call
      try {
        const response = await fetch(API_ENDPOINTS.unitBalance, {
          headers: AuthUtils.getAuthHeaders()
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
      const unitBalanceElement = document.getElementById('unit-balance');
      if (unitBalanceElement) {
        unitBalanceElement.textContent = '$500.00';
      }
    }
  },
  
  async handleSendMoney(e) {
    e.preventDefault();
    
    const sendButton = document.getElementById('send-button');
    const errorMessage = document.getElementById('send-error-message');
    
    // Get form data
    const receiver = document.getElementById('receiver-input').value.trim();
    const amount = parseFloat(document.getElementById('amount-input').value);
    const note = document.getElementById('note-input').value.trim();
    
    // Basic validation
    if (!receiver) {
      UIUtils.showMessage('send-error-message', 'Please enter a recipient');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      UIUtils.showMessage('send-error-message', 'Please enter a valid amount');
      return;
    }
    
    // Convert to cents for API
    const amountInCents = Math.round(amount * 100);
    
    try {
      // Show loading state
      UIUtils.showLoading(sendButton);
      if (errorMessage) errorMessage.classList.add('hidden');
      
      const response = await fetch(API_ENDPOINTS.unitPaymentsSend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthUtils.getAuthHeaders()
        },
        body: JSON.stringify({
          receiver,
          amount: amountInCents,
          description: note
        })
      });
      
      // Reset loading state
      UIUtils.hideLoading(sendButton);
      
      if (response.ok) {
        const result = await response.json();
        
        // Reset form
        const form = document.getElementById('send-money-form');
        if (form) form.reset();
        
        // Hide panel
        UIUtils.hideAllPanels();
        
        // Show success alert
        alert('Money sent successfully!');
        
        // Refresh dashboard data
        Dashboard.loadDashboard();
      } else {
        const error = await response.json();
        UIUtils.showMessage('send-error-message', error.message || 'Failed to send money');
      }
    } catch (error) {
      console.error('Error sending money:', error);
      UIUtils.showMessage('send-error-message', 'An error occurred. Please try again.');
      UIUtils.hideLoading(sendButton);
    }
  },
  
  async handleRequestMoney(e) {
    e.preventDefault();
    
    const requestButton = document.getElementById('request-button');
    const errorMessage = document.getElementById('request-error-message');
    
    // Get form data
    const requestFrom = document.getElementById('request-from-input').value.trim();
    const amount = parseFloat(document.getElementById('request-amount-input').value);
    const note = document.getElementById('request-note-input').value.trim();
    
    // Basic validation
    if (!requestFrom) {
      UIUtils.showMessage('request-error-message', 'Please enter a recipient');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      UIUtils.showMessage('request-error-message', 'Please enter a valid amount');
      return;
    }
    
    try {
      // Show loading state
      UIUtils.showLoading(requestButton);
      if (errorMessage) errorMessage.classList.add('hidden');
      
      const response = await fetch(`${API_ENDPOINTS.requests}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthUtils.getAuthHeaders()
        },
        body: JSON.stringify({
          requestedFrom: requestFrom,
          amountUsd: amount,
          requestNote: note
        })
      });
      
      // Reset loading state
      UIUtils.hideLoading(requestButton);
      
      if (response.ok) {
        const result = await response.json();
        
        // Reset form
        const form = document.getElementById('request-money-form');
        if (form) form.reset();
        
        // Hide panel
        UIUtils.hideAllPanels();
        
        // Show success alert
        alert('Money request sent successfully!');
        
        // Refresh dashboard data
        Dashboard.loadDashboard();
      } else {
        const error = await response.json();
        UIUtils.showMessage('request-error-message', error.message || 'Failed to request money');
      }
    } catch (error) {
      console.error('Error requesting money:', error);
      UIUtils.showMessage('request-error-message', 'An error occurred. Please try again.');
      UIUtils.hideLoading(requestButton);
    }
  },
  
  async setupUnitAccount() {
    try {
      const response = await fetch(API_ENDPOINTS.unitAccountCreate, {
        method: 'POST',
        headers: AuthUtils.getAuthHeaders()
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
  },
  
  async fetchUnitTransactions() {
    try {
      const response = await fetch(API_ENDPOINTS.unitTransactions, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      // If 404, likely no Unit account yet
      if (response.status === 404) {
        return [];
      }
      
      if (!response.ok) {
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
};

// ========== PLAID INTEGRATION MODULE ==========
const PlaidIntegration = {
  init() {
    this.loadPlaidScript();
    this.setupEventListeners();
  },
  
  loadPlaidScript() {
    // Load Plaid Link script if not already loaded
    if (!document.getElementById('plaid-link-script')) {
      const script = document.createElement('script');
      script.id = 'plaid-link-script';
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      document.head.appendChild(script);
    }
    
    // Load Material Icons for Plaid if not already loaded
    if (!document.querySelector('link[href*="material-icons"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      document.head.appendChild(link);
    }
  },
  
  setupEventListeners() {
    // Get Plaid elements
    const connectBankBtn = document.getElementById('connect-bank-btn');
    const viewTransactionsBtn = document.getElementById('view-transactions-btn');
    const plaidTransactionsPanel = document.getElementById('plaid-transactions-panel');
    
    // Check if Plaid section exists
    if (!connectBankBtn) return;
    
    // Add event listeners
    connectBankBtn.addEventListener('click', this.openPlaidLink.bind(this));
    
    if (viewTransactionsBtn) {
      viewTransactionsBtn.addEventListener('click', this.togglePlaidTransactionsPanel.bind(this));
    }
    
    // Close panel buttons
    if (plaidTransactionsPanel) {
      const closeBtn = plaidTransactionsPanel.querySelector('.close-panel');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          plaidTransactionsPanel.classList.add('hidden');
        });
      }
    }
    
    // Account filter
    const accountFilter = document.getElementById('account-filter');
    if (accountFilter) {
      accountFilter.addEventListener('change', () => {
        this.loadPlaidTransactions();
      });
    }
    
    // Date filter
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        this.loadPlaidTransactions();
      });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-transactions');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadPlaidTransactions(true);
      });
    }
    
    // Load connected accounts
    this.loadPlaidAccounts();
  },
  
  async openPlaidLink() {
    try {
      // Get link token from server
      const response = await fetch(API_ENDPOINTS.plaidLinkToken, {
        method: 'POST',
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to get link token');
      }
      
      const data = await response.json();
      const linkToken = data.link_token;
      
      // Initialize Plaid Link
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: (publicToken, metadata) => {
          // Handle success
          this.exchangePublicToken(publicToken, metadata);
        },
        onExit: (err, metadata) => {
          // Handle exit
          console.log('User exited Plaid Link', err, metadata);
        },
        onEvent: (eventName, metadata) => {
          // Track events
          console.log('Plaid Link event', eventName, metadata);
        }
      });
      
      // Open Plaid Link
      handler.open();
    } catch (error) {
      console.error('Error opening Plaid Link:', error);
      UIUtils.showMessage('plaid-error-message', 'Failed to open bank connection interface. Please try again.');
    }
  },
  
  async exchangePublicToken(publicToken, metadata) {
    try {
      // Exchange token
      const response = await fetch(API_ENDPOINTS.plaidExchangeToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthUtils.getAuthHeaders()
        },
        body: JSON.stringify({
          public_token: publicToken,
          institution_name: metadata.institution.name
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect bank account');
      }
      
      // Show success message
      UIUtils.showMessage('plaid-success-message', 'Bank account connected successfully!');
      
      // Reload accounts
      this.loadPlaidAccounts();
    } catch (error) {
      console.error('Error exchanging public token:', error);
      UIUtils.showMessage('plaid-error-message', 'Failed to connect bank account. Please try again.');
    }
  },
  
  async loadPlaidAccounts() {
    try {
      const accountsList = document.getElementById('plaid-accounts-list');
      const noAccountsMessage = document.getElementById('no-plaid-accounts');
      const accountsContainer = document.getElementById('plaid-accounts-container');
      
      if (!accountsList || !noAccountsMessage || !accountsContainer) return;
      
      // Show loading
      accountsList.innerHTML = '<li class="loading">Loading accounts...</li>';
      
      // Fetch accounts
      const response = await fetch(API_ENDPOINTS.plaidAccounts, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      const accounts = data.accounts || [];
      
      // Update UI based on accounts
      if (accounts.length === 0) {
        accountsContainer.classList.add('hidden');
        noAccountsMessage.classList.remove('hidden');
        
        // Hide view transactions button
        const viewTransactionsBtn = document.getElementById('view-transactions-btn');
        if (viewTransactionsBtn) {
          viewTransactionsBtn.style.display = 'none';
        }
        
        return;
      }
      
      // Show accounts list, hide no accounts message
      accountsContainer.classList.remove('hidden');
      noAccountsMessage.classList.add('hidden');
      
      // Show view transactions button
      const viewTransactionsBtn = document.getElementById('view-transactions-btn');
      if (viewTransactionsBtn) {
        viewTransactionsBtn.style.display = 'flex';
      }
      
      // Clear accounts list
      accountsList.innerHTML = '';
      
      // Update account filter options
      this.updateAccountFilter(accounts);
      
      // Add accounts to list
      accounts.forEach(account => {
        const li = document.createElement('li');
        li.className = 'plaid-account-item';
        li.dataset.accountId = account.id;
        
        // Determine icon based on account type
        let iconName = 'account_balance';
        if (account.type === 'depository') {
          if (account.subtype === 'checking') {
            iconName = 'account_balance';
          } else if (account.subtype === 'savings') {
            iconName = 'savings';
          }
        } else if (account.type === 'credit') {
          iconName = 'credit_card';
        }
        
        li.innerHTML = `
          <div class="account-info">
            <span class="material-icons account-icon">${iconName}</span>
            <div class="account-details">
              <span class="account-name">${account.name}</span>
              <div class="account-meta">
                <span class="account-institution">${account.institution}</span>
                <span class="account-number">•••• ${account.mask || '****'}</span>
              </div>
            </div>
          </div>
          <span class="account-balance">
            <button class="refresh-balance-btn" data-account-id="${account.id}">
              <span class="material-icons">refresh</span>
            </button>
            <span class="balance-amount" id="balance-${account.id}">$-.--</span>
          </span>
        `;
        
        accountsList.appendChild(li);
        
        // Fetch initial balance
        this.fetchPlaidAccountBalance(account.id);
      });
      
      // Add event listeners to refresh buttons
      accountsList.querySelectorAll('.refresh-balance-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const accountId = btn.dataset.accountId;
          this.fetchPlaidAccountBalance(accountId, true);
        });
      });
      
      // Update total balance
      this.updatePlaidTotalBalance();
    } catch (error) {
      console.error('Error loading Plaid accounts:', error);
      const accountsList = document.getElementById('plaid-accounts-list');
      if (accountsList) {
        accountsList.innerHTML = '<li class="error">Failed to load accounts</li>';
      }
    }
  },
  
  async fetchPlaidAccountBalance(accountId, showLoading = false) {
    try {
      const balanceElement = document.getElementById(`balance-${accountId}`);
      
      if (!balanceElement) return;
      
      // Show loading state
      if (showLoading) {
        balanceElement.innerHTML = '<span class="loading-spinner"></span>';
      }
      
      // Fetch balance
      const response = await fetch(`${API_BASE}/api/plaid/balance/${accountId}`, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      const balance = data.balance.available || data.balance.current || 0;
      
      // Format balance
      balanceElement.textContent = UIUtils.formatCurrency(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      const balanceElement = document.getElementById(`balance-${accountId}`);
      if (balanceElement) {
        balanceElement.textContent = 'Error';
      }
    }
  },
  
  async updatePlaidTotalBalance() {
    try {
      const totalBalanceElement = document.getElementById('plaid-total-balance');
      
      if (!totalBalanceElement) return;
      
      // Fetch accounts
      const response = await fetch(API_ENDPOINTS.plaidAccounts, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      const accounts = data.accounts || [];
      
      // Default to $0
      totalBalanceElement.textContent = '$0.00';
      
      if (accounts.length === 0) return;
      
      // Fetch balances for all accounts
      const balancePromises = accounts.map(account => {
        return fetch(`${API_BASE}/api/plaid/balance/${account.id}`, {
          headers: AuthUtils.getAuthHeaders()
        })
        .then(res => res.json())
        .then(data => data.balance.available || data.balance.current || 0)
        .catch(() => 0);
      });
      
      // Sum all balances
      const balances = await Promise.all(balancePromises);
      const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);
      
      // Update total balance display
      totalBalanceElement.textContent = UIUtils.formatCurrency(totalBalance);
    } catch (error) {
      console.error('Error updating total balance:', error);
    }
  },
  
  togglePlaidTransactionsPanel() {
    const panel = document.getElementById('plaid-transactions-panel');
    if (!panel) return;
    
    const isVisible = !panel.classList.contains('hidden');
    
    // Hide all panels first
    UIUtils.hideAllPanels();
    
    if (!isVisible) {
      // Show transactions panel
      panel.classList.remove('hidden');
      
      // Load transactions
      this.loadPlaidTransactions();
    }
  },
  
  async loadPlaidTransactions(append = false) {
    try {
      const transactionsList = document.getElementById('plaid-transactions-list');
      const accountFilter = document.getElementById('account-filter');
      const dateFilter = document.getElementById('date-filter');
      const loadMoreContainer = document.getElementById('load-more-container');
      
      if (!transactionsList || !accountFilter || !dateFilter || !loadMoreContainer) return;
      
      // Get filter values
      const accountId = accountFilter.value;
      const days = parseInt(dateFilter.value, 10);
      
      // Set up pagination
      const limit = 20;
      const offset = append ? parseInt(transactionsList.dataset.offset || '0', 10) : 0;
      
      // Show loading indicator
      if (!append) {
        transactionsList.innerHTML = '<li class="loading">Loading transactions...</li>';
        transactionsList.dataset.offset = '0';
      } else {
        const loadingItem = document.createElement('li');
        loadingItem.className = 'loading';
        loadingItem.textContent = 'Loading more...';
        transactionsList.appendChild(loadingItem);
      }
      
      // Build API URL
      let url = `${API_BASE}/api/plaid/transactions?days=${days}&offset=${offset}&limit=${limit}`;
      if (accountId !== 'all') {
        url += `&account_id=${accountId}`;
      }
      
      // Fetch transactions
      const response = await fetch(url, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      const transactions = data.transactions || [];
      const hasMore = data.has_more || false;
      
      // Update offset for next page
      transactionsList.dataset.offset = (offset + transactions.length).toString();
      
      // Show/hide load more button
      loadMoreContainer.classList.toggle('hidden', !hasMore);
      
      // Handle empty results
      if (transactions.length === 0 && !append) {
        transactionsList.innerHTML = '<li class="empty-message">No transactions found</li>';
        return;
      }
      
      // Remove loading indicator
      if (append) {
        const loadingItems = transactionsList.querySelectorAll('.loading');
        loadingItems.forEach(item => item.remove());
      } else {
        transactionsList.innerHTML = '';
      }
      
      // Add transactions to list
      transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        
        // Determine if debit or credit
        const isDebit = transaction.amount > 0;
        const amountClass = isDebit ? 'debit' : 'credit';
        const amountPrefix = isDebit ? '-' : '+';
        
        // Format date
        const formattedDate = UIUtils.formatDate(transaction.date);
        
        // Format category
        const category = transaction.category ? 
          transaction.category.join(' > ') : 
          'Uncategorized';
        
        li.innerHTML = `
          <div class="transaction-details">
            <span class="transaction-merchant">${transaction.name}
              ${transaction.pending ? '<span class="pending-badge">Pending</span>' : ''}
            </span>
            <span class="transaction-date">${formattedDate}</span>
            <span class="transaction-category">${category}</span>
          </div>
          <span class="transaction-amount ${amountClass}">
            ${amountPrefix}${UIUtils.formatCurrency(Math.abs(transaction.amount))}
          </span>
        `;
        
        transactionsList.appendChild(li);
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      const transactionsList = document.getElementById('plaid-transactions-list');
      if (transactionsList && !transactionsList.querySelector(':not(.loading)')) {
        transactionsList.innerHTML = '<li class="error-message">Failed to load transactions</li>';
      }
    }
  },
  
  async fetchPlaidTransactions() {
    try {
      // This is a simplified version for the combined transactions view
      const response = await fetch(`${API_BASE}/api/plaid/transactions?days=30&limit=50`, {
        headers: AuthUtils.getAuthHeaders()
      });
      
      if (!response.ok) {
        // If 404, no Plaid accounts yet
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch Plaid transactions');
      }
      
      const data = await response.json();
      const transactions = data.transactions || [];
      
      // Map to standardized format for combined view
      return transactions.map(tx => ({
        id: tx.transaction_id,
        amount: tx.amount,
        counterparty: tx.name,
        date: tx.date,
        status: tx.pending ? 'pending' : 'completed',
        description: tx.category ? tx.category.join(', ') : '',
        direction: tx.amount > 0 ? 'debit' : 'credit',
        type: 'plaid'
      }));
    } catch (error) {
      console.error('Error fetching Plaid transactions:', error);
      return [];
    }
  }
};
