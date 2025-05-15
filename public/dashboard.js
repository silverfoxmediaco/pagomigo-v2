// ========== API Configuration ==========
const API_BASE = '';

// ========== User Dashboard Loading ==========
function loadDashboard() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      window.location.href = 'login.html';
      return;
    }

    // Load user profile data
    fetchUserProfile(token);
    
    // Update UI elements based on authentication status
    document.querySelectorAll('.authenticated-only').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.unauthenticated-only').forEach(el => el.classList.add('hidden'));
  } catch (err) {
    console.error('Dashboard loading error:', err);
  }
}

async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await response.json();
    updateUserProfileUI(userData);
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
}

function updateUserProfileUI(userData) {
  // Update user name display
  const userNameElements = document.querySelectorAll('.user-name');
  userNameElements.forEach(el => {
    el.textContent = userData.name || 'User';
  });

  // Update profile image if available
  const profileImgElements = document.querySelectorAll('.profile-image');
  if (userData.profileImage) {
    profileImgElements.forEach(el => {
      el.src = userData.profileImage;
      el.alt = `${userData.name}'s profile`;
    });
  }

  // Update other user data fields
  const userEmailElements = document.querySelectorAll('.user-email');
  userEmailElements.forEach(el => {
    el.textContent = userData.email || '';
  });
}

// ========== Banking Initialization ==========
function initBanking() {
  // Initialize banking-related UI elements and event listeners
  const bankingSection = document.getElementById('banking');
  if (!bankingSection) return;

  // Set up banking UI here if needed
}

// ========== Burger Menu ==========
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

// ========== UI Utilities ==========
function hideAllPanels() {
  document.querySelectorAll('.action-panel, .plaid-panel').forEach(panel => panel.classList.add('hidden'));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// ========== Notification Functions ==========
function showPlaidError(message) {
  const el = document.getElementById('plaid-error-message');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
}

function showPlaidSuccess(message) {
  const el = document.getElementById('plaid-success-message');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
}

// ========== Utility Functions ==========
function debounce(func, delay = 500) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ========== Plaid Integration ==========
function loadPlaidIntegration() {
  if (!document.getElementById('plaid-link-script')) {
    const script = document.createElement('script');
    script.id = 'plaid-link-script';
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.head.appendChild(script);
  }
  initPlaid();
}

function initPlaid() {
  const connectBtn = document.getElementById('connect-bank-btn');
  const viewTxBtn = document.getElementById('view-transactions-btn');
  const panel = document.getElementById('plaid-transactions-panel');
  const accFilter = document.getElementById('account-filter');
  const dateFilter = document.getElementById('date-filter');
  const loadMoreBtn = document.getElementById('load-more-transactions');

  if (!connectBtn) return;

  connectBtn.addEventListener('click', openPlaidLink);
  viewTxBtn?.addEventListener('click', togglePlaidTransactionsPanel);
  panel?.querySelector('.close-panel')?.addEventListener('click', () => panel.classList.add('hidden'));

  accFilter?.addEventListener('change', debounce(() => loadPlaidTransactions()));
  dateFilter?.addEventListener('change', debounce(() => loadPlaidTransactions()));
  loadMoreBtn?.addEventListener('click', () => loadPlaidTransactions(true));

  loadPlaidAccounts();
}

async function openPlaidLink() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/plaid/create-link-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { link_token } = await res.json();

    if (typeof Plaid === 'undefined') {
      showPlaidError('Plaid failed to load.');
      return;
    }

    const handler = Plaid.create({
      token: link_token,
      onSuccess: (publicToken, metadata) => exchangePublicToken(publicToken, metadata),
      onExit: (err, metadata) => console.log('User exited Plaid Link', err, metadata),
      onEvent: (eventName, metadata) => console.log('Plaid Link event', eventName, metadata)
    });

    handler.open();
  } catch (err) {
    console.error('Open Plaid Link Error:', err);
    showPlaidError('Error connecting bank.');
  }
}

async function exchangePublicToken(publicToken, metadata) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/plaid/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        public_token: publicToken,
        institution_name: metadata.institution.name
      })
    });
    showPlaidSuccess('Bank account connected!');
    loadPlaidAccounts();
  } catch (err) {
    console.error('Exchange Token Error:', err);
    showPlaidError('Bank connection failed.');
  }
}

async function loadPlaidAccounts() {
  try {
    const token = localStorage.getItem('token');
    const list = document.getElementById('plaid-accounts-list');
    const noMsg = document.getElementById('no-plaid-accounts');
    const container = document.getElementById('plaid-accounts-container');
    const viewTxBtn = document.getElementById('view-transactions-btn');

    if (!list || !noMsg || !container) return;
    list.innerHTML = '<li class="loading">Loading accounts...</li>';

    const res = await fetch(`${API_BASE}/api/plaid/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accounts = [] } = await res.json();

    if (accounts.length === 0) {
      container.classList.add('hidden');
      noMsg.classList.remove('hidden');
      viewTxBtn && (viewTxBtn.style.display = 'none');
      return;
    }

    container.classList.remove('hidden');
    noMsg.classList.add('hidden');
    viewTxBtn && (viewTxBtn.style.display = 'flex');
    list.innerHTML = '';
    updateAccountFilter(accounts);

    accounts.forEach(account => {
      const li = document.createElement('li');
      li.className = 'plaid-account-item';
      li.dataset.accountId = account.id;

      const icon = account.type === 'credit' ? 'credit_card' :
                   account.subtype === 'savings' ? 'savings' :
                   'account_balance';

      li.innerHTML = `
        <div class="account-info">
          <span class="material-icons account-icon">${icon}</span>
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
      list.appendChild(li);
      fetchPlaidAccountBalance(account.id);
    });

    list.querySelectorAll('.refresh-balance-btn').forEach(btn =>
      btn.addEventListener('click', e => {
        e.preventDefault();
        fetchPlaidAccountBalance(btn.dataset.accountId, true);
      })
    );

    updatePlaidTotalBalance();
  } catch (err) {
    console.error('Load Accounts Error:', err);
    const list = document.getElementById('plaid-accounts-list');
    list && (list.innerHTML = '<li class="error">Failed to load accounts</li>');
  }
}

async function fetchPlaidAccountBalance(accountId, showLoading = false) {
  try {
    const token = localStorage.getItem('token');
    const el = document.getElementById(`balance-${accountId}`);
    if (!el) return;
    if (showLoading) el.innerHTML = '<span class="loading-spinner"></span>';

    const res = await fetch(`${API_BASE}/api/plaid/balance/${accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const balance = data.balance?.available ?? data.balance?.current ?? 0;
    el.textContent = formatCurrency(balance);
  } catch (err) {
    console.error('Fetch Balance Error:', err);
    const el = document.getElementById(`balance-${accountId}`);
    el && (el.textContent = 'Error');
  }
}

async function updatePlaidTotalBalance() {
  try {
    const token = localStorage.getItem('token');
    const el = document.getElementById('plaid-total-balance');
    if (!el) return;

    const res = await fetch(`${API_BASE}/api/plaid/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accounts = [] } = await res.json();

    const balances = await Promise.all(
      accounts.map(acc =>
        fetch(`${API_BASE}/api/plaid/balance/${acc.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => d.balance?.available ?? d.balance?.current ?? 0)
          .catch(() => 0)
      )
    );

    const total = balances.reduce((sum, b) => sum + b, 0);
    el.textContent = formatCurrency(total);
  } catch (err) {
    console.error('Update Total Balance Error:', err);
  }
}

function updateAccountFilter(accounts) {
  const filter = document.getElementById('account-filter');
  if (!filter) return;
  const current = filter.value;
  while (filter.options.length > 1) filter.remove(1);
  accounts.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.name} (${a.institution})`;
    filter.appendChild(opt);
  });
  if ([...filter.options].some(o => o.value === current)) {
    filter.value = current;
  }
}

function togglePlaidTransactionsPanel() {
  const panel = document.getElementById('plaid-transactions-panel');
  if (!panel) return;
  const isVisible = !panel.classList.contains('hidden');
  hideAllPanels();
  if (!isVisible) {
    panel.classList.remove('hidden');
    loadPlaidTransactions();
  }
}

async function loadPlaidTransactions(append = false) {
  try {
    const token = localStorage.getItem('token');
    const list = document.getElementById('plaid-transactions-list');
    const loading = document.getElementById('plaid-transactions-loading');
    const empty = document.getElementById('plaid-transactions-empty');
    const loadMore = document.getElementById('load-more-transactions');
    
    if (!list || !loading || !empty || !loadMore) return;
    
    const accountFilter = document.getElementById('account-filter')?.value || '';
    const dateFilter = document.getElementById('date-filter')?.value || 'all';
    
    if (!append) {
      list.innerHTML = '';
      loading.classList.remove('hidden');
      empty.classList.add('hidden');
      loadMore.classList.add('hidden');
    }
    
    const skip = append ? list.querySelectorAll('.transaction-item').length : 0;

    const url = new URL(`${API_BASE}/api/plaid/transactions`);
    url.searchParams.append('skip', skip);
    url.searchParams.append('limit', 20);
    if (accountFilter) url.searchParams.append('account_id', accountFilter);
    if (dateFilter !== 'all') url.searchParams.append('date_filter', dateFilter);
    
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const { transactions = [], hasMore = false } = await res.json();
    
    loading.classList.add('hidden');
    loadMore.classList.toggle('hidden', !hasMore);
    
    if (transactions.length === 0 && !append) {
      empty.classList.remove('hidden');
      return;
    }
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const li = document.createElement('li');
      li.className = 'transaction-item';
      
      const icon = tx.category?.[0] === 'Food and Drink' ? 'restaurant' :
                   tx.category?.[0] === 'Travel' ? 'flight' :
                   tx.category?.[0] === 'Payment' ? 'payment' :
                   tx.category?.[0] === 'Transfer' ? 'sync_alt' :
                   tx.category?.[0] === 'Shopping' ? 'shopping_cart' : 'receipt';
      
      const amount = parseFloat(tx.amount);
      const isNegative = amount > 0; // In Plaid, positive = money leaving account
      
      li.innerHTML = `
        <div class="tx-info">
          <span class="material-icons tx-icon ${isNegative ? 'expense' : 'income'}">${icon}</span>
          <div class="tx-details">
            <span class="tx-name">${tx.name}</span>
            <div class="tx-meta">
              <span class="tx-date">${date.toLocaleDateString()}</span>
              <span class="tx-category">${tx.category?.[0] || 'Uncategorized'}</span>
            </div>
          </div>
        </div>
        <span class="tx-amount ${isNegative ? 'expense' : 'income'}">
          ${isNegative ? '-' : '+'}${formatCurrency(Math.abs(amount))}
        </span>
      `;
      
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Load Transactions Error:', err);
    const loading = document.getElementById('plaid-transactions-loading');
    const list = document.getElementById('plaid-transactions-list');
    
    loading?.classList.add('hidden');
    if (list && !list.innerHTML) {
      list.innerHTML = '<li class="error-item">Failed to load transactions</li>';
    }
  }
}

// ========== DOM Ready Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  // Load Material Icons if not already loaded
  if (!document.querySelector('link[href*="material-icons"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  // Initialize all components
  loadDashboard();
  initBanking?.();
  loadPlaidIntegration();

  // Handle hash navigation
  if (window.location.hash === '#banking') {
    const bankingSection = document.getElementById('banking');
    bankingSection && setTimeout(() => {
      bankingSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
});
