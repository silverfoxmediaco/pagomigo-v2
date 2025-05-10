// Add this near the top of your file, after the API_BASE declaration
document.addEventListener('DOMContentLoaded', function() {
  // Check KYC status when page loads
  checkKycStatus();
  
  // Rest of your existing initialization code can stay...
});

// Add these new functions for KYC handling
async function checkKycStatus() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const user = await res.json();
      const kycStatus = user.kyc_status || 'pending';
      localStorage.setItem('kycStatus', kycStatus);
      
      // Check if KYC is approved
      if (kycStatus !== 'approved') {
        // Add warning banner at the top
        addKycWarningBanner();
        
        // Disable send/request buttons if not approved
        disableTransactionButtons();
      }
    }
  } catch (error) {
    console.error('Error checking KYC status:', error);
  }
}

function addKycWarningBanner() {
  // Create warning banner
  const banner = document.createElement('div');
  banner.className = 'kyc-warning-banner';
  banner.innerHTML = `
    <p>Your identity verification is required before you can send or request money.</p>
    <button id="verify-identity-btn" class="primary-btn">Verify Identity</button>
  `;
  
  // Insert at the top of the main content
  const mainContent = document.querySelector('.moneymover-container') || document.querySelector('main');
  if (mainContent) {
    mainContent.insertBefore(banner, mainContent.firstChild);
    
    // Add event listener to the button
    document.getElementById('verify-identity-btn').addEventListener('click', function() {
      redirectToKyc('transaction');
    });
  }
}

function disableTransactionButtons() {
  // Disable send form submit button
  const sendButton = sendForm.querySelector('button[type="submit"]');
  if (sendButton) {
    sendButton.disabled = true;
    sendButton.title = 'Identity verification required';
    sendButton.addEventListener('click', function(e) {
      e.preventDefault();
      redirectToKyc('send');
    });
  }
  
  // Disable request form submit button
  const requestButton = requestForm.querySelector('button[type="submit"]');
  if (requestButton) {
    requestButton.disabled = true;
    requestButton.title = 'Identity verification required';
    requestButton.addEventListener('click', function(e) {
      e.preventDefault();
      redirectToKyc('request');
    });
  }
}

function redirectToKyc(action) {
  // Store the intended action to return to after KYC
  localStorage.setItem('pendingAction', action);
  
  // Show a friendly message
  alert('To keep your account secure, we need to verify your identity before you can send or receive money. Let\'s complete this quick process now!');
  
  // Redirect to KYC page
  window.location.href = 'identity-verification.html';
}
