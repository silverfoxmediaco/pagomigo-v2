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
      kycEl.textContent = profile.kyc_status || profile.kycStatus || 'pending';
    }
    
    if (balanceEl) {
      const balance = parseFloat(profile.balance) || 0;
      balanceEl.textContent = `$${balance.toFixed(2)}`;
    }

    // KYC banner logic - moved inside the loadDashboard function
    const kycBanner = document.getElementById('kyc-banner');
    if (kycBanner) {
      if (profile.kyc_status === 'approved' || profile.kyc_status === 'pending_review') {
        kycBanner.style.display = 'none';
      } else {
        kycBanner.style.display = 'block';
        // Event listener for KYC button
        const startKycBtn = document.getElementById('start-kyc-btn');
        if (startKycBtn) {
          startKycBtn.addEventListener('click', function() {
            window.location.href = 'identity-verification.html';
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
