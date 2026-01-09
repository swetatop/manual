// UI interactions for sidebar + logout modal + admin links
function qs(id){ return document.getElementById(id); }

const sidebar = qs("sidebar");
const overlay = qs("sidebarOverlay");
const toggle = qs("menuToggle");

function openSidebar(){
  if(sidebar) sidebar.classList.add("active");
  if(overlay) overlay.classList.add("active");
}
function closeSidebar(){
  if(sidebar) sidebar.classList.remove("active");
  if(overlay) overlay.classList.remove("active");
}

if(toggle){
  toggle.addEventListener("click", () => {
    if(sidebar && sidebar.classList.contains("active")) closeSidebar();
    else openSidebar();
  });
}
if(overlay){
  overlay.addEventListener("click", closeSidebar);
}

// admin buttons
const adminControlBtn = qs("adminControlBtn");
if(adminControlBtn){
  adminControlBtn.addEventListener("click", () => window.location.href = "admin-panel.html");
}
const adminManageBtn = qs("adminManageBtn");
if(adminManageBtn){
  adminManageBtn.addEventListener("click", () => window.location.href = "admin-panel.html");
}

// logout modal
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
  });
}

// close on click outside modal content
if(logoutModal){
  logoutModal.addEventListener("click", (e) => {
    if(e.target === logoutModal) logoutModal.style.display = "none";
  });
}
