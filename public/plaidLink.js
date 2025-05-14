// plaidLink.js - Client-side integration with Plaid Link

/**
 * PlaidLink - Client-side utilities for Plaid Link integration
 * For use in the Pagomigo application
 */
class PlaidLink {
    constructor() {
      this.apiBaseUrl = '/api/plaid';
      this.token = localStorage.getItem('token');
      this.initialized = false;
      this.linkHandler = null;
  
      // DOM elements we'll need
      this.elements = {
        connectBankBtn: document.getElementById('connect-bank-btn'),
        accountsList: document.getElementById('accounts-list'),
        accountsContainer: document.getElementById('accounts-container'),
        noAccountsMessage: document.getElementById('no-accounts-message'),
        errorMessage: document.getElementById('error-message'),
        successMessage: document.getElementById('success-message')
      };
    }
  
    /**
     * Initialize the Plaid Link integration
     */
    async init() {
      try {
        // Make sure the Plaid Link script is loaded
        if (!window.Plaid) {
          await this.loadPlaidScript();
        }
  
        // Set up event listeners
        this.setupEventListeners();
  
        // Load connected accounts
        await this.loadConnectedAccounts();
  
        this.initialized = true;
        console.log('Plaid Link initialized successfully');
  
      } catch (error) {
        console.error('Failed to initialize Plaid Link:', error);
        this.showError('Could not initialize Plaid Link. Please try again later.');
      }
    }
  
    /**
     * Load the Plaid Link script
     */
    loadPlaidScript() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Plaid Link script'));
        document.head.appendChild(script);
      });
    }
  
    /**
     * Set up event listeners
     */
    setupEventListeners() {
      // Connect bank button
      if (this.elements.connectBankBtn) {
        this.elements.connectBankBtn.addEventListener('click', () => {
          this.openPlaidLink();
        });
      }
    }
  
    /**
     * Helper method for authenticated fetch requests
     */
    async fetchWithAuth(url, options = {}) {
      // Make sure token is current
      this.token = localStorage.getItem('token');
  
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      };
  
      return fetch(url, {
        ...options,
        headers
      });
    }
  
    /**
     * Open Plaid Link to connect a bank account
     */
    async openPlaidLink() {
      try {
        // First, get a link token from our server
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/create-link-token`, {
          method: 'POST'
        });
  
        if (!response.ok) {
          throw new Error('Failed to get link token');
        }
  
        const data = await response.json();
        const linkToken = data.link_token;
  
        // Configure Plaid Link
        const handler = Plaid.create({
          token: linkToken,
          onSuccess: (publicToken, metadata) => {
            this.handleLinkSuccess(publicToken, metadata);
          },
          onExit: (err, metadata) => {
            if (err) {
              console.error('Plaid Link error:', err);
            }
          },
          onEvent: (eventName, metadata) => {
            console.log('Plaid Link event:', eventName, metadata);
          }
        });
  
        // Open Link
        handler.open();
  
      } catch (error) {
        console.error('Error opening Plaid Link:', error);
        this.showError('Failed to connect to your bank. Please try again.');
      }
    }
  
    /**
     * Handle successful Plaid Link flow
     */
    async handleLinkSuccess(publicToken, metadata) {
      try {
        const institution = metadata.institution;
        const accounts = metadata.accounts;
  
        // Exchange public token for access token
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/exchange-token`, {
          method: 'POST',
          body: JSON.stringify({
            public_token: publicToken,
            institution_name: institution.name
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to connect bank account');
        }
  
        // Show success message
        this.showSuccess('Bank account connected successfully!');
  
        // Reload connected accounts
        await this.loadConnectedAccounts();
  
      } catch (error) {
        console.error('Error handling Link success:', error);
        this.showError('Failed to connect your bank account. Please try again.');
      }
    }
  
    /**
     * Load and display connected accounts
     */
    async loadConnectedAccounts() {
      if (!this.elements.accountsList) return;
  
      try {
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/accounts`);
  
        if (!response.ok) {
          throw new Error('Failed to fetch connected accounts');
        }
  
        const data = await response.json();
        const accounts = data.accounts || [];
  
        // Update UI based on whether there are accounts
        if (accounts.length === 0) {
          if (this.elements.noAccountsMessage) {
            this.elements.noAccountsMessage.classList.remove('hidden');
          }
          if (this.elements.accountsContainer) {
            this.elements.accountsContainer.classList.add('hidden');
          }
          return;
        }
  
        // Show accounts container, hide no accounts message
        if (this.elements.noAccountsMessage) {
          this.elements.noAccountsMessage.classList.add('hidden');
        }
        if (this.elements.accountsContainer) {
          this.elements.accountsContainer.classList.remove('hidden');
        }
  
        // Clear existing accounts
        this.elements.accountsList.innerHTML = '';
  
        // Create account list items
        accounts.forEach(account => {
          const li = document.createElement('li');
          li.className = 'bank-account-item';
          li.dataset.accountId = account.id;
          li.dataset.itemId = account.item_id;
  
          // Determine account icon based on type
          let accountIcon = 'account-icon.svg';
          if (account.type === 'depository') {
            accountIcon = 'checking-icon.svg';
          } else if (account.type === 'credit') {
            accountIcon = 'credit-icon.svg';
          }
  
          li.innerHTML = `
            <div class="account-info">
              <img src="${accountIcon}" alt="${account.type}" class="account-type-icon">
              <div class="account-details">
                <span class="account-name">${account.name}</span>
                <span class="account-institution">${account.institution}</span>
                <span class="account-masked-number">•••• ${account.mask}</span>
              </div>
            </div>
            <div class="account-actions">
              <button class="view-transactions-btn" data-account-id="${account.id}">
                Transactions
              </button>
              <button class="check-balance-btn" data-account-id="${account.id}">
                Balance
              </button>
            </div>
          `;
  
          this.elements.accountsList.appendChild(li);
        });
  
        // Add event listeners to the action buttons
        this.elements.accountsList.querySelectorAll('.view-transactions-btn').forEach(btn => {
          btn.addEventListener('click', event => {
            const accountId = event.target.dataset.accountId;
            this.viewTransactions(accountId);
          });
        });
  
        this.elements.accountsList.querySelectorAll('.check-balance-btn').forEach(btn => {
          btn.addEventListener('click', event => {
            const accountId = event.target.dataset.accountId;
            this.checkBalance(accountId);
          });
        });
  
      } catch (error) {
        console.error('Error loading connected accounts:', error);
        if (this.elements.accountsList) {
          this.elements.accountsList.innerHTML = '<li class="error-message">Error loading accounts</li>';
        }
      }
    }
  
    /**
     * View transactions for an account
     */
    async viewTransactions(accountId) {
      // Implementation for viewing transactions
      // This could open a modal, navigate to a transactions page, etc.
      console.log('View transactions for account:', accountId);
    }
  
    /**
     * Check balance for an account
     */
    async checkBalance(accountId) {
      try {
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/balance/${accountId}`);
  
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
  
        const data = await response.json();
        const balance = data.balance;
  
        // Format the balances
        const currentBalance = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(balance.current);
  
        const availableBalance = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(balance.available || balance.current);
  
        // Show balance in a modal or alert
        alert(`Current balance: ${currentBalance}\nAvailable balance: ${availableBalance}`);
  
      } catch (error) {
        console.error('Error checking balance:', error);
        this.showError('Failed to retrieve balance. Please try again.');
      }
    }
  
    /**
     * Show error message
     */
    showError(message) {
      if (!this.elements.errorMessage) return;
  
      this.elements.errorMessage.textContent = message;
      this.elements.errorMessage.classList.remove('hidden');
  
      // Auto hide after 5 seconds
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  
    /**
     * Hide error message
     */
    hideError() {
      if (!this.elements.errorMessage) return;
  
      this.elements.errorMessage.classList.add('hidden');
    }
  
    /**
     * Show success message
     */
    showSuccess(message) {
      if (!this.elements.successMessage) return;
  
      this.elements.successMessage.textContent = message;
      this.elements.successMessage.classList.remove('hidden');
  
      // Auto hide after 5 seconds
      setTimeout(() => {
        this.hideSuccess();
      }, 5000);
    }
  
    /**
     * Hide success message
     */
    hideSuccess() {
      if (!this.elements.successMessage) return;
  
      this.elements.successMessage.classList.add('hidden');
    }
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const plaidLink = new PlaidLink();
    plaidLink.init();
  
    // Make available globally for debugging
    window.plaidLink = plaidLink;
  });