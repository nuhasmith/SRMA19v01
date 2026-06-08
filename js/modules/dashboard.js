// ============================================================
//  DASHBOARD.JS – Dashboard & Statistik
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderDashboard, refreshDashboard, backupData, loadDashboardStats };

// ============================================================
//  2. IMPORTS
// ============================================================
// Fungsi global dari main.js
const { getCachedData, setCachedData, showToast } = window;

// ============================================================
//  3. RENDER DASHBOARD
// ============================================================
function renderDashboard(container) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h4 class="fw-bold mb-0"><i class="fas fa-tachometer-alt me-2" style="color:#0d6efd;"></i>Dashboard Admin</h4>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-primary rounded-pill" onclick="refreshDashboard()">
                    <i class="fas fa-sync-alt me-1"></i> Refresh
                </button>
                <button class="btn btn-outline-secondary rounded-pill" onclick="backupData()">
                    <i class="fas fa-cloud-download-alt me-1"></i> Backup
                </button>
            </div>
        </div>

        <div class="stat-grid" id="statGrid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                <div class="stat-value" id="totalPeserta">-</div>
                <div class="stat-label">Total Peserta</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-clipboard-check"></i></div>
                <div class="stat-value" id="totalAbsensi">-</div>
                <div class="stat-label">Total Absensi</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-calendar-day"></i></div>
                <div class="stat-value" id="hadirHariIni">-</div>
                <div class="stat-label">Hadir Hari Ini</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-file-medical-alt"></i></div>
                <div class="stat-value" id="izinHariIni">-</div>
                <div class="stat-label">Izin Hari Ini</div>
            </div>
        </div>

        <div class="table-card">
            <div class="card-header">
                <h6><i class="fas fa-clock me-2" style="color:#0d6efd;"></i>Absensi Terbaru</h6>
                <span class="small text-muted">Data real-time</span>
            </div>
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Kode</th><th>Nama</th><th>Sesi</th><th>Status</th></tr>
                    </thead>
                    <tbody id="recentAbsensi">
                        <tr><td colspan="7" class="text-center py-3 text-muted">Memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Load dashboard data
    loadDashboardStats();
}

// ============================================================
//  4. LOAD DASHBOARD STATS
// ============================================================
async function loadDashboardStats() {
    const cached = getCachedData();
    if (cached) {
        updateStats(cached);
        updateTable(cached.absensi || []);
    }

    const shouldRefresh = !cached || (Date.now() - cached.timestamp > CACHE_DURATION);
    if (!shouldRefresh) return;

    try {
        const [pesertaRes, absensiRes, izinRes] = await Promise.all([
            API.listPeserta(),
            API.listAbsensi('', '', 1, 10),
            API.listIzin()
        ]);

        const data = {
            peserta: pesertaRes.status === 'success' ? pesertaRes.data : [],
            absensi: absensiRes.status === 'success' ? absensiRes.data : [],
            izin: izinRes.status === 'success' ? izinRes.data : []
        };
        data.timestamp = Date.now();
        setCachedData(data);
        updateStats(data);
        updateTable(data.absensi || []);
    } catch (e) {
        console.error('Gagal refresh data dashboard:', e);
    }
}

// ============================================================
//  5. UPDATE STATS UI
// ============================================================
function updateStats(data) {
    const totalPeserta = data.peserta?.length || 0;
    const totalAbsensi = data.absensi?.length || 0;
    const today = new Date().toISOString().split('T')[0];
    const hadirHariIni = data.absensi?.filter(a => a.Tanggal === today && a.Status === 'Hadir').length || 0;
    const izinHariIni = data.izin?.filter(i => i.Tanggal === today).length || 0;

    const elTotalPeserta = document.getElementById('totalPeserta');
    const elTotalAbsensi = document.getElementById('totalAbsensi');
    const elHadirHariIni = document.getElementById('hadirHariIni');
    const elIzinHariIni = document.getElementById('izinHariIni');

    if (elTotalPeserta) elTotalPeserta.textContent = totalPeserta;
    if (elTotalAbsensi) elTotalAbsensi.textContent = totalAbsensi;
    if (elHadirHariIni) elHadirHariIni.textContent = hadirHariIni;
    if (elIzinHariIni) elIzinHariIni.textContent = izinHariIni;
}

// ============================================================
//  6. UPDATE TABLE UI
// ============================================================
function updateTable(absensi) {
    const tbody = document.getElementById('recentAbsensi');
    if (!tbody) return;

    if (!absensi || absensi.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">Belum ada data absensi</td></tr>';
        return;
    }

    let rows = '';
    absensi.slice(0, 6).forEach((a, i) => {
        const statusClass = a.Status === 'Hadir' ? 'hadir' : a.Status === 'Izin' ? 'izin' : a.Status === 'Sakit' ? 'sakit' : 'tidak';
        rows += `<tr>
            <td>${i+1}</td>
            <td>${a.Tanggal || '-'}</td>
            <td>${a.Jam || '-'}</td>
            <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${(a.Kode||'').slice(-4)}</code></td>
            <td><strong>${a.Nama || '-'}</strong></td>
            <td class="small">${a.Sesi_Nama || '-'}</td>
            <td><span class="badge-status ${statusClass}">${a.Status || 'Hadir'}</span></td>
        </tr>`;
    });
    tbody.innerHTML = rows;
}

// ============================================================
//  7. REFRESH DASHBOARD
// ============================================================
async function refreshDashboard() {
    showToast('Memperbarui data...', 'info');
    localStorage.removeItem(CACHE_KEY);
    await loadDashboardStats();
    showToast('Data dashboard diperbarui', 'success');
}

// ============================================================
//  8. BACKUP DATA
// ============================================================
async function backupData() {
    showToast('Mengambil data...', 'info');
    try {
        const [peserta, absensi, jadwal, petugas, izin, wali, alumni] = await Promise.all([
            API.listPeserta(),
            API.listAbsensi('', '', 1, 1000),
            API.getJadwal(),
            API.listPetugas(),
            API.listIzin(),
            API.listWaliAsuh(),
            API.listAlumni()
        ]);
        const backup = {
            timestamp: new Date().toISOString(),
            peserta: peserta.data || [],
            absensi: absensi.data || [],
            jadwal: jadwal.data || [],
            petugas: petugas.data || [],
            izin: izin.data || [],
            waliAsuh: wali.data || [],
            alumni: alumni.data || []
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_srma19_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup berhasil diunduh!', 'success');
    } catch (e) {
        showToast('Gagal backup: ' + e.message, 'error');
    }
}

// ============================================================
//  9. CONSTANTS
// ============================================================
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  10. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
// Fungsi refreshDashboard dan backupData sudah di-expose via window di main.js
// Namun kita perlu memastikan fungsi-fungsi lain juga tersedia jika dipanggil dari HTML
window.loadDashboardStats = loadDashboardStats;
window.updateStats = updateStats;
window.updateTable = updateTable;

console.log('✅ Dashboard module loaded');