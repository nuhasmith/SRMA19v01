// ============================================================
//  MAIN.JS – NAVIGASI, AUTH, INISIALISASI (Versi Terbaru)
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. AUTH & USER
    // ============================================================
    if (!Auth.requireAuth('login.html')) throw new Error('Silakan login.');
    const currentUser = Auth.getCurrentUser();
    if (currentUser.role !== 'admin') {
        window.location.href = 'dashboard_petugas.html';
        throw new Error('Akses ditolak');
    }
    window.currentUser = currentUser; // Ekspos ke global untuk modul lain

    // ============================================================
    //  2. SIDEBAR TOGGLE
    // ============================================================
    let sidebarCollapsed = false;
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebarCollapsed = !sidebarCollapsed;
            document.getElementById('sidebar')?.classList.toggle('collapsed');
            document.getElementById('mainContent')?.classList.toggle('expanded');
            const icon = document.getElementById('collapseIcon');
            if (icon) icon.className = sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
        });
    }

    // ============================================================
    //  3. NAVIGATION
    // ============================================================
    const MENU_KEY = 'srma19_active_menu';
    const CACHE_KEY = 'srma19_admin_data';
    const CACHE_DURATION = 5 * 60 * 1000;

    // === CACHE UTILITIES ===
    function getCachedData() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data.payload;
        } catch { return null; }
    }
    window.getCachedData = getCachedData;

    function setCachedData(payload) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), payload }));
        } catch {}
    }
    window.setCachedData = setCachedData;

    // === UPDATE MENU UI ===
    function updateMenuUI(page) {
        document.querySelectorAll('.nav-item[data-page], .bottom-item[data-page]').forEach(el => el.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        document.querySelector(`.bottom-item[data-page="${page}"]`)?.classList.add('active');
    }

    // === NAVIGATE ===
    function navigate(page) {
        updateMenuUI(page);
        localStorage.setItem(MENU_KEY, page);
        const container = document.getElementById('mainContent');
        if (!container) return;

        switch (page) {
            case 'dashboard':
                if (typeof window.renderDashboard === 'function') window.renderDashboard(container);
                else container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="text-muted mt-2">Memuat dashboard...</p></div>';
                break;
            case 'peserta':
                if (typeof window.renderPeserta === 'function') window.renderPeserta(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul peserta belum dimuat.</div>';
                break;
            case 'absensi':
                if (typeof window.renderAbsensi === 'function') window.renderAbsensi(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul absensi belum dimuat.</div>';
                break;
            case 'izin':
                if (typeof window.renderIzin === 'function') window.renderIzin(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul izin belum dimuat.</div>';
                break;
            case 'jadwal':
                if (typeof window.renderJadwal === 'function') window.renderJadwal(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul jadwal belum dimuat.</div>';
                break;
            case 'petugas':
                if (typeof window.renderPetugas === 'function') window.renderPetugas(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul petugas belum dimuat.</div>';
                break;
            case 'wali_asuh':
                if (typeof window.renderWaliAsuh === 'function') window.renderWaliAsuh(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul wali asuh belum dimuat.</div>';
                break;
            case 'alumni':
                if (typeof window.renderAlumni === 'function') window.renderAlumni(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul alumni belum dimuat.</div>';
                break;
            case 'laporan':
                if (typeof window.renderLaporan === 'function') window.renderLaporan(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul laporan belum dimuat.</div>';
                break;
            case 'absensi_qr':
                if (typeof window.renderAbsensiQR === 'function') window.renderAbsensiQR(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Modul scan QR belum dimuat.</div>';
                break;
            default:
                if (typeof window.renderDashboard === 'function') window.renderDashboard(container);
                else container.innerHTML = '<div class="text-center py-5 text-muted">Halaman tidak ditemukan.</div>';
        }
    }
    window.navigate = navigate;

    // ============================================================
    //  4. TOAST SYSTEM
    // ============================================================
    function showToast(msg, type = 'info') {
        const colors = {
            success: ['#10b981', '#ecfdf5', 'fa-check-circle'],
            error: ['#ef4444', '#fef2f2', 'fa-times-circle'],
            warning: ['#f59e0b', '#fffbeb', 'fa-exclamation-triangle'],
            info: ['#3b82f6', '#eff6ff', 'fa-info-circle']
        };
        const [border, bg, icon] = colors[type] || colors.info;
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-item has-progress';
        toast.innerHTML = `
            <div class="toast-icon ${type}"><i class="fas ${icon}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'warning' ? 'Peringatan' : 'Informasi'}</div>
                <div class="toast-message">${msg}</div>
            </div>
            <button class="toast-close" onclick="this.closest('.toast-item').remove()"><i class="fas fa-times"></i></button>
            <div class="toast-progress" style="color:${border};"></div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('removing');
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
            }
        }, 3800);

        toast.addEventListener('click', function(e) {
            if (!e.target.closest('.toast-close')) {
                this.classList.add('removing');
                setTimeout(() => { if (this.parentNode) this.remove(); }, 300);
            }
        });
    }
    window.showToast = showToast;

    // ============================================================
    //  5. LOGOUT
    // ============================================================
    function handleLogout() {
        if (confirm('Logout?')) {
            Auth.logout();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }
    window.handleLogout = handleLogout;

    // ============================================================
    //  6. CLOSE MODAL (global)
    // ============================================================
    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    }
    window.closeModal = closeModal;

    // ============================================================
    //  7. BOTTOM SHEET (mobile)
    // ============================================================
    function toggleBottomSheet() {
        const existing = document.querySelector('.bottom-sheet-overlay');
        if (existing) { existing.remove(); return; }

        const overlay = document.createElement('div');
        overlay.className = 'bottom-sheet-overlay';
        overlay.style.cssText = `
            position: fixed; bottom: 60px; left: 0; right: 0; z-index: 1060;
            background: #fff; border-radius: 16px 16px 0 0;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
            padding: 16px 20px 24px;
            max-height: 60vh; overflow-y: auto;
            animation: slideUp 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;">
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('jadwal');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-calendar-alt me-2"></i> Jadwal Kegiatan
                </button>
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('wali_asuh');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-users-cog me-2"></i> Wali Asuh
                </button>
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('alumni');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-graduation-cap me-2"></i> Data Alumni
                </button>
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('laporan');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-chart-pie me-2"></i> Laporan Summary
                </button>
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('petugas');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-user-shield me-2"></i> Data Petugas
                </button>
                <button class="btn btn-outline-secondary w-100 text-start" onclick="navigate('absensi_qr');this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-qrcode me-2"></i> Scan QR
                </button>
                <hr>
                <button class="btn btn-outline-danger w-100 text-start" onclick="handleLogout();this.closest('.bottom-sheet-overlay').remove()">
                    <i class="fas fa-sign-out-alt me-2"></i> Logout
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            document.addEventListener('click', function closeSheet(e) {
                if (!overlay.contains(e.target) && !e.target.closest('.bottom-item')) {
                    overlay.remove();
                    document.removeEventListener('click', closeSheet);
                }
            });
        }, 100);
    }
    window.toggleBottomSheet = toggleBottomSheet;

    // ============================================================
    //  8. ADD CSS ANIMATION FOR BOTTOM SHEET
    // ============================================================
    (function addStyle() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(100%); }
                to { opacity: 1; transform: translateY(0); }
            }
            .toast-item {
                pointer-events: auto; background: #ffffff; border-radius: 14px;
                padding: 16px 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
                display: flex; align-items: center; gap: 14px;
                animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                transform-origin: top right; border: 1px solid rgba(0,0,0,0.04);
                position: relative;
            }
            .toast-item.removing { animation: toastOut 0.3s ease forwards; }
            @keyframes toastIn {
                from { opacity: 0; transform: translateX(40px) scale(0.95); }
                to { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes toastOut {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to { opacity: 0; transform: translateX(40px) scale(0.95); }
            }
            .toast-item .toast-progress {
                position: absolute; bottom: 0; left: 0; height: 3px;
                background: currentColor; border-radius: 0 0 14px 14px;
                animation: toastProgress 3.5s linear forwards; opacity: 0.25;
            }
            @keyframes toastProgress {
                from { width: 100%; }
                to { width: 0%; }
            }
        `;
        document.head.appendChild(style);
    })();

    // ============================================================
    //  9. INISIALISASI
    // ============================================================
    const user = Auth.getCurrentUser();
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = user.nama || 'Admin';
    if (roleEl) roleEl.textContent = user.role || 'admin';
    if (avatarEl) avatarEl.textContent = (user.nama || 'A').charAt(0).toUpperCase();

    // Navigasi ke menu terakhir atau default dashboard
    const savedPage = localStorage.getItem(MENU_KEY);
    if (savedPage && savedPage !== 'dashboard') {
        updateMenuUI(savedPage);
        navigate(savedPage);
    } else {
        updateMenuUI('dashboard');
        navigate('dashboard');
    }

    // ============================================================
    //  10. REFRESH PERIODIK (opsional)
    // ============================================================
    setInterval(() => {
        const current = localStorage.getItem(MENU_KEY);
        if (current === 'dashboard' && typeof window.loadDashboardStats === 'function') {
            window.loadDashboardStats();
        }
    }, 30000);

    console.log('✅ Main.js loaded - SPA Admin SRMA 19');

})();