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

const API_BASE = '';

// ========== Hide All Panels ==========
function hideAllPanels() {
  document.querySelectorAll('.action-panel, .plaid-panel').forEach(panel => panel.classList.add('hidden'));
}

// ========== Format Currency ==========
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// ========== Show Messages ==========
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

// ========== Debounce ==========
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
  // You can paste your existing `loadPlaidTransactions()` logic here
  // or keep it modularized if already implemented elsewhere.
}

// ========== DOM Ready Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[href*="material-icons"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  loadDashboard?.();
  initBanking?.();
  loadPlaidIntegration();

  if (window.location.hash === '#banking') {
    const bankingSection = document.getElementById('banking');
    bankingSection && setTimeout(() => {
      bankingSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
});
