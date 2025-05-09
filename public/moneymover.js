// moneymover.js

const API_BASE = 'https://pagomigo.com';

const sendTab = document.getElementById('sendTab');
const requestTab = document.getElementById('requestTab');
const sendSection = document.getElementById('sendSection');
const requestSection = document.getElementById('requestSection');
const sendForm = document.getElementById('sendForm');
const requestForm = document.getElementById('requestForm');

sendTab.addEventListener('click', () => {
  sendTab.classList.add('active');
  requestTab.classList.remove('active');
  sendSection.classList.remove('hidden');
  requestSection.classList.add('hidden');
});

requestTab.addEventListener('click', () => {
  requestTab.classList.add('active');
  sendTab.classList.remove('active');
  requestSection.classList.remove('hidden');
  sendSection.classList.add('hidden');
});

// Send Money form submit
sendForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const formData = new FormData(sendForm);
  const data = {
    recipientUserName: formData.get('recipientUserName'),
    recipientPhone: formData.get('recipientPhone'),
    recipientCountry: formData.get('recipientCountry'),
    amountUsd: formData.get('amountUsd'),
  };

  try {
    const res = await fetch(`${API_BASE}/api/transactions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message || 'Money sent!');
    sendForm.reset();
  } catch (error) {
    console.error('Send money error:', error);
    alert('Failed to send money.');
  }
});

// Request Money
requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const formData = new FormData(requestForm);
  const data = {
    requestNote: formData.get('requestNote'),
    amountUsd: formData.get('amountUsd'),
  };

  try {
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message || 'Request sent!');
    requestForm.reset();
  } catch (error) {
    console.error('Request money error:', error);
    alert('Failed to send request.');
  }
});

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
