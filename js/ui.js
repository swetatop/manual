// js/ui.js
// Sidebar + overlay + active menu + logout modal + admin links

function qs(id){ return document.getElementById(id); }

const sidebar = qs("sidebar");
const overlay = qs("sidebarOverlay");
const toggle  = qs("menuToggle");

function openSidebar(){
  if(sidebar) sidebar.classList.add("active");
  if(overlay) overlay.classList.add("active");
}
function closeSidebar(){
  if(sidebar) sidebar.classList.remove("active");
  if(overlay) overlay.classList.remove("active");
}

function isMobile(){
  return window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
}

// ===== Sidebar toggle =====
if(toggle){
  toggle.addEventListener("click", () => {
    if(sidebar && sidebar.classList.contains("active")) closeSidebar();
    else openSidebar();
  });
}
if(overlay){
  overlay.addEventListener("click", closeSidebar);
}

// Close on ESC
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeSidebar();
});

// ===== Active nav item by current file =====
(function markActiveNav(){
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  document.querySelectorAll(".nav-item").forEach(a => {
    const href = (a.getAttribute("href") || "").split("?")[0].toLowerCase();

    // clear
    a.classList.remove("active");

    // mark
    if(href && href === current) a.classList.add("active");

    // Close sidebar after click on mobile
    a.addEventListener("click", () => {
      if(isMobile()) closeSidebar();
    });
  });
})();

// ===== Admin buttons =====
const adminControlBtn = qs("adminControlBtn");
if(adminControlBtn){
  adminControlBtn.addEventListener("click", () => window.location.href = "admin-panel.html");
}
const adminManageBtn = qs("adminManageBtn");
if(adminManageBtn){
  adminManageBtn.addEventListener("click", () => window.location.href = "admin-panel.html");
}

// ===== Logout modal =====
const logoutBtn = qs("logoutBtn");
const logoutModal = qs("logoutModal");
const confirmLogout = qs("confirmLogout");
const cancelLogout = qs("cancelLogout");

if(logoutBtn && logoutModal){
  logoutBtn.addEventListener("click", () => { logoutModal.style.display = "flex"; });
}
if(cancelLogout && logoutModal){
  cancelLogout.addEventListener("click", () => { logoutModal.style.display = "none"; });
}
if(confirmLogout && logoutModal){
  confirmLogout.addEventListener("click", async () => {
    logoutModal.style.display = "none";
    if(window.logout) await window.logout();
    else window.location.href = "login.html";
  });
}

// close on click outside modal content
if(logoutModal){
  logoutModal.addEventListener("click", (e) => {
    if(e.target === logoutModal) logoutModal.style.display = "none";
  });
}
