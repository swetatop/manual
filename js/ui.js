// js/ui.js
// ПРОСТОЙ ui.js: бургер, сайдбар, активный пункт, выход

function qs(id){ return document.getElementById(id); }

const sidebar = qs("sidebar");
const overlay = qs("sidebarOverlay");
const toggle  = qs("menuToggle");

// открыть / закрыть меню
function openSidebar(){
  if(sidebar) sidebar.classList.add("active");
  if(overlay) overlay.classList.add("active");
}
function closeSidebar(){
  if(sidebar) sidebar.classList.remove("active");
  if(overlay) overlay.classList.remove("active");
}

// бургер
if(toggle){
  toggle.addEventListener("click", () => {
    if(sidebar && sidebar.classList.contains("active")) closeSidebar();
    else openSidebar();
  });
}

// клик по затемнению
if(overlay){
  overlay.addEventListener("click", closeSidebar);
}

// ESC закрывает меню
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeSidebar();
});

// активный пункт меню
(function(){
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  document.querySelectorAll(".nav-item").forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if(href === current) link.classList.add("active");

    // на телефоне закрывать меню после клика
    link.addEventListener("click", () => closeSidebar());
  });
})();

// кнопки админки
const adminBtn1 = qs("adminControlBtn");
if(adminBtn1){
  adminBtn1.addEventListener("click", () => location.href = "admin-panel.html");
}
const adminBtn2 = qs("adminManageBtn");
if(adminBtn2){
  adminBtn2.addEventListener("click", () => location.href = "admin-panel.html");
}

// выход
const logoutBtn = qs("logoutBtn");
const logoutModal = qs("logoutModal");
const confirmLogout = qs("confirmLogout");
const cancelLogout = qs("cancelLogout");

if(logoutBtn && logoutModal){
  logoutBtn.addEventListener("click", () => {
    logoutModal.style.display = "flex";
  });
}
if(cancelLogout && logoutModal){
  cancelLogout.addEventListener("click", () => {
    logoutModal.style.display = "none";
  });
}
if(confirmLogout && logoutModal){
  confirmLogout.addEventListener("click", async () => {
    logoutModal.style.display = "none";
    if(window.logout) await window.logout();
    else location.href = "login.html";
  });
}
