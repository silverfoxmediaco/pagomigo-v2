//new code
// login.js

const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://www.pagomigo.com';

function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

// === LOGIN LOGIC ===
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const messageEl = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const rawPhone = document.getElementById("login-phone").value;
      const password = document.getElementById("login-password").value;
      const phone = normalizePhone(rawPhone);

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone, password }),
        });

        const result = await response.json();

        if (response.ok) {
          window.location.href = "dashboard.html";
        } else {
          messageEl.textContent = result.message || "Login failed.";
        }
      } catch (error) {
        console.error("Login error:", error);
        messageEl.textContent = "Error logging in. Please try again.";
      }
    });
  }

  // === FORGOT PASSWORD LOGIC ===
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("resetPasswordModal");
  const closeResetBtn = document.querySelector(".close-reset-modal");
  const resetStepPhone = document.getElementById("reset-step-phone");
  const resetStepCode = document.getElementById("reset-step-code");
  const resetStepNewPass = document.getElementById("reset-step-newpass");

  let resetPhone = ''; // keep track of phone across steps

  function showStep(stepToShow) {
    [resetStepPhone, resetStepCode, resetStepNewPass].forEach(step =>
      step.classList.add("hidden")
    );
    stepToShow.classList.remove("hidden");
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetModal.classList.add("open");
      showStep(resetStepPhone);
    });
  }

  if (closeResetBtn) {
    closeResetBtn.addEventListener("click", () => {
      resetModal.classList.remove("open");
    });
  }

  const resetPhoneForm = document.getElementById("resetPhoneForm");
  const verifyCodeForm = document.getElementById("verifyCodeForm");
  const newPasswordForm = document.getElementById("newPasswordForm");

  if (resetPhoneForm) {
    resetPhoneForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      resetPhone = normalizePhone(document.getElementById("reset-phone").value);

      const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Verification code sent.");
        showStep(resetStepCode);
      } else {
        alert(result.message || "Failed to send code.");
      }
    });
  }

  if (verifyCodeForm) {
    verifyCodeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = document.getElementById("reset-code").value;

      const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone, code }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Phone verified. Please set your new password.");
        showStep(resetStepNewPass);
      } else {
        alert(result.message || "Code verification failed.");
      }
    });
  }

  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("new-password").value;

      const res = await fetch(`${API_BASE}/api/auth/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone, newPassword }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Password updated! You can now log in.");
        resetModal.classList.remove("open");
      } else {
        alert(result.message || "Failed to update password.");
      }
    });
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

// Close menu logic
const menuLinks = slideoutMenu?.querySelectorAll("a") || [];
menuLinks.forEach(link => {
  link.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (!slideoutMenu.contains(e.target) && !hamburger.contains(e.target)) {
    slideoutMenu.classList.remove("open");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && slideoutMenu.classList.contains("open")) {
    slideoutMenu.classList.remove("open");
  }
});

/*
//old code
//this is temporary for testing
const API_BASE = '';
//reactivate this when deploying
//const API_BASE = 'https://www.pagomigo.com';

// Shared phone formatter
function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

// === LOGIN LOGIC ===
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const messageEl = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const rawPhone = document.getElementById("login-phone").value;
      const password = document.getElementById("login-password").value;
      const phone = normalizePhone(rawPhone);

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone, password }),
        });

        const result = await response.json();

        if (response.ok) {
          window.location.href = "dashboard.html";
        } else {
          messageEl.textContent = result.message || "Login failed.";
        }
      } catch (error) {
        console.error("Login error:", error);
        messageEl.textContent = "Error logging in. Please try again.";
      }
    });
  }

  // === FORGOT PASSWORD LOGIC ===
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("resetPasswordModal");
  const closeResetBtn = document.querySelector(".close-reset-modal");
  const resetStepPhone = document.getElementById("reset-step-phone");
  const resetStepCode = document.getElementById("reset-step-code");
  const resetStepNewPass = document.getElementById("reset-step-newpass");

  let resetPhone = ''; // keep track of phone across steps

  function showStep(stepToShow) {
    [resetStepPhone, resetStepCode, resetStepNewPass].forEach(step =>
      step.classList.add("hidden")
    );
    stepToShow.classList.remove("hidden");
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetModal.classList.add("open");
      showStep(resetStepPhone);
    });
  }

  if (closeResetBtn) {
    closeResetBtn.addEventListener("click", () => {
      resetModal.classList.remove("open");
    });
  }

  const resetPhoneForm = document.getElementById("resetPhoneForm");
  const verifyCodeForm = document.getElementById("verifyCodeForm");
  const newPasswordForm = document.getElementById("newPasswordForm");

  if (resetPhoneForm) {
    resetPhoneForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      resetPhone = normalizePhone(document.getElementById("reset-phone").value);

      const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Verification code sent.");
        showStep(resetStepCode);
      } else {
        alert(result.message || "Failed to send code.");
      }
    });
  }

  if (verifyCodeForm) {
    verifyCodeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = document.getElementById("reset-code").value;

      const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone, code }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Phone verified. Please set your new password.");
        showStep(resetStepNewPass);
      } else {
        alert(result.message || "Code verification failed.");
      }
    });
  }

  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("new-password").value;

      const res = await fetch(`${API_BASE}/api/auth/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone, newPassword }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Password updated! You can now log in.");
        resetModal.classList.remove("open");
      } else {
        alert(result.message || "Failed to update password.");
      }
    });
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
//
// Close the menu when clicking outside of it
document.addEventListener("click", (e) => {
  if (!slideoutMenu.contains(e.target) && !hamburger.contains(e.target)) {
    slideoutMenu.classList.remove("open");
  }
});
//
// Close the menu when clicking on a link
const menuLinks = slideoutMenu.querySelectorAll("a");
menuLinks.forEach((link) => {
  link.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
});
//
// Close the menu when pressing the Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && slideoutMenu.classList.contains("open")) {
    slideoutMenu.classList.remove("open");
  }
});
//
// Close the menu when clicking on the close button
const closeMenuBtn = document.getElementById("closeMenu");
if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
}*/
