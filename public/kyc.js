// kyc.js
const API_BASE = '';

// Function to dynamically load Persona SDK
function loadPersonaSDK() {
  return new Promise((resolve, reject) => {
    if (window.Persona) {
      console.log("Persona SDK already loaded");
      return resolve(window.Persona);
    }
    
    console.log("Attempting to load Persona SDK dynamically");
    const script = document.createElement('script');
    script.src = 'https://cdn.withpersona.com/dist/persona-v4.js';
    script.async = true;
    
    script.onload = () => {
      console.log("Persona SDK loaded successfully");
      resolve(window.Persona);
    };
    
    script.onerror = (err) => {
      console.error("Failed to load Persona SDK:", err);
      reject(new Error("Failed to load Persona SDK"));
    };
    
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  // Try to load Persona SDK
  try {
    await loadPersonaSDK();
  } catch (error) {
    console.error("Error loading Persona SDK:", error);
  }

  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  
  // Check user's KYC status first
  checkKycStatus();
  
  // Elements
  const startPersonaBtn = document.getElementById('start-persona-btn');
  const returnToDashboardBtn = document.getElementById('return-to-dashboard');
  const returnToDashboardVerifiedBtn = document.getElementById('return-to-dashboard-verified');
  
  // Event listeners
  if (startPersonaBtn) {
    startPersonaBtn.addEventListener('click', initiatePersona);
  }
  
  if (returnToDashboardBtn) {
    returnToDashboardBtn.addEventListener('click', returnToDashboard);
  }
  
  if (returnToDashboardVerifiedBtn) {
    returnToDashboardVerifiedBtn.addEventListener('click', returnToDashboard);
  }
  
  // Check if user arrived here from a specific action
  const pendingAction = localStorage.getItem('pendingAction');
  if (pendingAction) {
    // Display custom message based on the pending action
    const introText = document.querySelector('.kyc-intro p:first-of-type');
    if (introText) {
      if (pendingAction === 'send') {
        introText.textContent = 'To send money securely, we need to verify your identity first.';
      } else if (pendingAction === 'request') {
        introText.textContent = 'To receive money, we need to verify your identity first.';
      }
    }
  }
});

async function checkKycStatus() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await res.json();
    localStorage.setItem('kycStatus', profile.kyc_status || 'pending');
    
    // If already verified or pending review, show appropriate screen
    if (profile.kyc_status === 'approved') {
      showView('kyc-already-verified');
    } else if (profile.kyc_status === 'pending_review') {
      showView('kyc-complete');
    } else {
      showView('kyc-intro');
    }
  } catch (error) {
    console.error('Error checking KYC status:', error);
    showView('kyc-intro'); // Default to intro view on error
  }
}

function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.kyc-intro, .persona-container, .kyc-complete, .kyc-already-verified')
    .forEach(el => el.classList.add('hidden'));
  
  // Show the requested view
  document.getElementById(viewId).classList.remove('hidden');
}

async function initiatePersona() {
  try {
    // Check if Persona SDK is loaded
    if (!window.Persona || !window.Persona.Client) {
      console.error('Persona SDK not loaded');
      
      // Try to load it dynamically as a fallback
      try {
        await loadPersonaSDK();
      } catch (sdkError) {
        alert('The identity verification service is not available. Please refresh the page and try again.');
        return;
      }
      
      // Double-check after loading attempt
      if (!window.Persona || !window.Persona.Client) {
        alert('The identity verification service is not available. Please refresh the page and try again.');
        return;
      }
    }
    
    // Get the current user's information
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const user = await res.json();
    
    // Show Persona container and hide intro
    showView('persona-container');
    
    // Initialize Persona client
    const referenceId = user._id.toString ? user._id.toString() : String(user._id);
    console.log('User reference ID for Persona:', referenceId);

    const client = new window.Persona.Client({
      templateId: 'itmpl_pFWFRbSWT9CJkEnSBiAQVdUa6dY6', 
      environment: 'sandbox', // Use 'production' for live environment
      referenceId: referenceId, // User's unique identifier
      onReady: () => {
        console.log('Persona is ready');
      },
      onComplete: async ({ inquiryId, status, fields }) => {
        console.log('Verification completed:', { inquiryId, status });
        await completeVerification(inquiryId);
      },
      onCancel: () => {
        showView('kyc-intro');
      },
      onError: (error) => {
        console.error('Persona error:', error);
        alert('There was an error with the verification process. Please try again.');
        showView('kyc-intro');
      }
    });
    
    // Start the verification process
    client.open({
      name: user.name,
      emailAddress: user.email,
      phoneNumber: user.phone
    });
    
  } catch (error) {
    console.error('Error initiating Persona:', error);
    alert('Unable to start the verification process. Please try again later.');
    showView('kyc-intro');
  }
}

async function completeVerification(inquiryId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/persona/complete-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inquiryId })
    });
    
    if (!res.ok) {
      throw new Error('Failed to complete verification');
    }
    
    // Update local KYC status
    localStorage.setItem('kycStatus', 'pending_review');
    
    // Show completion screen
    showView('kyc-complete');
  } catch (error) {
    console.error('Error completing verification:', error);
    alert('There was an issue submitting your verification. Please contact support.');
  }
}

function returnToDashboard() {
  const pendingAction = localStorage.getItem('pendingAction');
  
  if (pendingAction) {
    localStorage.removeItem('pendingAction');
    if (pendingAction === 'send') {
      window.location.href = 'moneymover.html?action=send';
    } else if (pendingAction === 'request') {
      window.location.href = 'moneymover.html?action=request';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    window.location.href = 'dashboard.html';
  }
}
