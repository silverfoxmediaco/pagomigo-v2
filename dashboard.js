
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

// Fetch user profile
async function loadDashboard() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const profile = await res.json();

    document.getElementById("user-name").textContent = profile.name;
    document.getElementById("user-email").textContent = profile.email;
    document.getElementById("user-kyc").textContent = profile.kyc_status;

    if (!profile.phoneVerified) {
      alert("Please verify your phone to continue.");
      window.location.href = "/home.html";
      return;
    }

  } catch (err) {
    console.error("Dashboard load error:", err);
    window.location.href = "/home.html"; // redirect if fetch fails
  }
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", loadDashboard);
} else {
  loadDashboard();
}