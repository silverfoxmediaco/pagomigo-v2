document.addEventListener("DOMContentLoaded", () => {
  const navList = document.getElementById("navList");
  if (navList) {
    navList.innerHTML = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="moneymover.html">Send/Request Money</a></li>
      <li><a href="home.html">Home</a></li>
      <li><a href="#">Settings</a></li>
      <li><a href="billpay.html">Bill Pay</a></li>
      <li id="authMenuItem"><a href="login.html">Login</a></li>
    `;

    // Token check to swap Login -> Logout
    const token = localStorage.getItem("token");
    const authItem = document.getElementById("authMenuItem");
    if (authItem && token) {
      authItem.innerHTML = `<a href="#">Logout</a>`;
      authItem.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        window.location.href = "home.html";
      });
    }
  }

  // === Burger Menu Logic ===
  const hamburger = document.getElementById("hamburger");
  const slideoutMenu = document.getElementById("slideoutMenu");
  const closeBtn = document.getElementById("closeMenu");

  if (hamburger && slideoutMenu) {
    hamburger.addEventListener("click", () => {
      slideoutMenu.classList.add("open");
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

    const menuLinks = slideoutMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        slideoutMenu.classList.remove("open");
      });
    });
  }

  if (closeBtn && slideoutMenu) {
    closeBtn.addEventListener("click", () => {
      slideoutMenu.classList.remove("open");
    });
  }
});
