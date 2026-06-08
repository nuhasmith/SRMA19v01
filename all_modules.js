// ============================================================
//  ALL_MODULES.JS – Gabungan semua modul SPA Admin
//  SRMA 19 Bantul
//  Versi: 6.0 – QR scan tanpa iframe, semua menu berfungsi
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  BAGIAN 1: MAIN.JS – Navigasi, Auth, Cache, Toast, dll.
    // ============================================================

    // --- AUTH ---
    if (!Auth.requireAuth('login.html')) throw new Error('Silakan login.');
    const currentUser = Auth.getCurrentUser();
    if (currentUser.role !== 'admin') {
        window.location.href = 'dashboard_petugas.html';
        throw new Error('Akses ditolak');
    }
    window.currentUser = currentUser;

    // --- SIDEBAR TOGGLE ---
    let sidebarCollapsed = false;
    document.getElementById('toggleSidebar')?.addEventListener('click', function() {
        sidebarCollapsed = !sidebarCollapsed;
        document.getElementById('sidebar')?.classList.toggle('collapsed');
        document.getElementById('mainContent')?.classList.toggle('expanded');
        const icon = document.getElementById('collapseIcon');
        if (icon) icon.className = sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    });

    // --- NAVIGATION ---
    const MENU_KEY = 'srma19_active_menu';
    const CACHE_KEY = 'srma19_admin_data';
    const CACHE_DURATION = 5 * 60 * 1000;

    function getCachedData() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data;
        } catch { return null; }
    }
    window.getCachedData = getCachedData;

    function setCachedData(payload) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }));
        } catch {}
    }
    window.setCachedData = setCachedData;

    function updateMenuUI(page) {
        document.querySelectorAll('.nav-item[data-page], .bottom-item[data-page]').forEach(el => el.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        document.querySelector(`.bottom-item[data-page="${page}"]`)?.classList.add('active');
    }

    function navigate(page) {
        updateMenuUI(page);
        localStorage.setItem(MENU_KEY, page);
        const container = document.getElementById('mainContent');
        switch (page) {
            case 'dashboard': window.renderDashboard(container); break;
            case 'peserta': window.renderPeserta(container); break;
            case 'absensi': window.renderAbsensi(container); break;
            case 'izin': window.renderIzin(container); break;
            case 'jadwal': window.renderJadwal(container); break;
            case 'petugas': window.renderPetugas(container); break;
            case 'wali_asuh': window.renderWaliAsuh(container); break;
            case 'alumni': window.renderAlumni(container); break;
            case 'laporan': window.renderLaporan(container); break;
            case 'absensi_qr': window.renderAbsensiQR(container); break;
            default: window.renderDashboard(container);
        }
    }
    window.navigate = navigate;

    // --- TOAST ---
    function showToast(msg, type = 'info') {
        const colors = {
            success: ['#10b981', '#ecfdf5', 'fa-check-circle'],
            error: ['#ef4444', '#fef2f2', 'fa-times-circle'],
            warning: ['#f59e0b', '#fffbeb', 'fa-exclamation-triangle'],
            info: ['#3b82f6', '#eff6ff', 'fa-info-circle']
        };
        const [border, bg, icon] = colors[type] || colors.info;
        const container = document.getElementById('toastContainer');
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

    // --- LOGOUT ---
    function handleLogout() {
        if (confirm('Logout?')) {
            Auth.logout();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }
    window.handleLogout = handleLogout;

    // --- CLOSE MODAL (global) ---
    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    }
    window.closeModal = closeModal;

    // --- BOTTOM SHEET ---
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
    //  BAGIAN 2: DASHBOARD.JS
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
        loadDashboardStats();
    }
    window.renderDashboard = renderDashboard;

    async function loadDashboardStats() {
        const cached = getCachedData();
        if (cached) {
            updateStats(cached);
            updateTable(cached.absensi || []);
        } else {
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
                setCachedData(data);
                updateStats(data);
                updateTable(data.absensi || []);
            } catch (e) {
                console.error('Gagal refresh data dashboard:', e);
            }
        }
    }
    window.loadDashboardStats = loadDashboardStats;

    function updateStats(data) {
        const totalPeserta = data.peserta?.length || 0;
        const totalAbsensi = data.absensi?.length || 0;
        const today = new Date().toISOString().split('T')[0];
        const hadirHariIni = data.absensi?.filter(a => a.Tanggal === today && a.Status === 'Hadir').length || 0;
        const izinHariIni = data.izin?.filter(i => i.Tanggal === today).length || 0;

        const el1 = document.getElementById('totalPeserta');
        const el2 = document.getElementById('totalAbsensi');
        const el3 = document.getElementById('hadirHariIni');
        const el4 = document.getElementById('izinHariIni');
        if (el1) el1.textContent = totalPeserta;
        if (el2) el2.textContent = totalAbsensi;
        if (el3) el3.textContent = hadirHariIni;
        if (el4) el4.textContent = izinHariIni;
    }
    window.updateStats = updateStats;

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
    window.updateTable = updateTable;

    async function refreshDashboard() {
        showToast('Memperbarui data...', 'info');
        localStorage.removeItem(CACHE_KEY);
        await loadDashboardStats();
        showToast('Data dashboard diperbarui', 'success');
    }
    window.refreshDashboard = refreshDashboard;

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
    window.backupData = backupData;

    // ============================================================
    //  BAGIAN 3: PESERTA.JS
    // ============================================================

    let pesertaData = [];
    let pesertaFiltered = [];
    let selectedKode = new Set();
    let waliAsuhList = [];
    let qrImagesCache = {};
    let previewData = null;
    let isGenerating = false;

    function renderPeserta(container) {
        const cached = getCachedData();
        if (cached?.peserta) {
            pesertaData = cached.peserta.map(p => ({ ...p, Kode: String(p.Kode || '') }));
            pesertaFiltered = [...pesertaData];
        }
        if (cached?.waliAsuh) {
            waliAsuhList = cached.waliAsuh.filter(w => w.Status === 'Aktif');
        }

        const rombelList = [...new Set(pesertaData.map(p => p.Rombel).filter(Boolean))];
        const angkatanList = [...new Set(pesertaData.map(p => p.Angkatan).filter(Boolean))];
        const agamaList = [...new Set(pesertaData.map(p => p.Agama).filter(Boolean))];

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-users me-2" style="color:#0d6efd;"></i>Data Peserta <span class="badge bg-secondary rounded-pill">${pesertaData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showPesertaModal(null)"><i class="fas fa-plus me-1"></i> Tambah</button>
                    <button class="btn btn-sm btn-outline-success rounded-pill" onclick="document.getElementById('importCSVPesertaInput').click()"><i class="fas fa-upload me-1"></i> Impor</button>
                    <input type="file" id="importCSVPesertaInput" accept=".csv" style="display:none" onchange="importCSVPeserta(this)">
                    <button class="btn btn-sm btn-primary rounded-pill" onclick="exportCSVPeserta()"><i class="fas fa-download me-1"></i> CSV</button>
                    <button class="btn btn-sm btn-danger rounded-pill" onclick="exportPesertaPDF()"><i class="fas fa-file-pdf me-1"></i> PDF</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" id="btnDeleteSelectedPeserta" onclick="deleteSelectedPeserta()" disabled><i class="fas fa-trash-alt me-1"></i> Hapus (<span id="selectedCountPeserta">0</span>)</button>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="arsipLulus()"><i class="fas fa-archive me-1"></i> Arsip Lulus</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshPeserta(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <input type="text" id="searchPeserta" placeholder="🔍 Cari nama / kode" style="flex:1;min-width:150px;" oninput="applyFilterPeserta()">
                    <select id="filterStatusPeserta" onchange="applyFilterPeserta()"><option value="">Status</option><option>Aktif</option><option>Nonaktif</option><option>Lulus</option></select>
                    <select id="filterRombelPeserta" onchange="applyFilterPeserta()"><option value="">Rombel</option>${rombelList.map(r => `<option>${r}</option>`).join('')}</select>
                    <select id="filterAngkatanPeserta" onchange="applyFilterPeserta()"><option value="">Angkatan</option>${angkatanList.map(a => `<option>${a}</option>`).join('')}</select>
                    <select id="filterAgamaPeserta" onchange="applyFilterPeserta()"><option value="">Agama</option>${agamaList.map(a => `<option>${a}</option>`).join('')}</select>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterPeserta()">Reset</button>
                    <span class="small text-muted ms-2" id="infoCountPeserta">Menampilkan ${pesertaFiltered.length} dari ${pesertaData.length} entri</span>
                </div>
            </div>
            <div class="card-modern barcode-panel mb-3">
                <div class="row g-2">
                    <div class="col-md-6">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <label class="mb-0" style="font-weight:600;font-size:0.85rem;">Tampilkan:</label>
                            <div class="form-check form-check-inline mb-0"><input class="form-check-input" type="checkbox" id="barcodeShowNama" checked><label class="form-check-label" for="barcodeShowNama">Nama</label></div>
                            <div class="form-check form-check-inline mb-0"><input class="form-check-input" type="checkbox" id="barcodeShowKode" checked><label class="form-check-label" for="barcodeShowKode">Kode</label></div>
                            <div class="form-check form-check-inline mb-0"><input class="form-check-input" type="checkbox" id="barcodeShowWali1" checked><label class="form-check-label" for="barcodeShowWali1">Wali 1</label></div>
                            <div class="form-check form-check-inline mb-0"><input class="form-check-input" type="checkbox" id="barcodeShowWali2" checked><label class="form-check-label" for="barcodeShowWali2">Wali 2</label></div>
                            <div class="form-check form-check-inline mb-0"><input class="form-check-input" type="checkbox" id="barcodeShowPublisher" checked><label class="form-check-label" for="barcodeShowPublisher">Penerbit</label></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <label class="mb-0" style="font-weight:600;font-size:0.85rem;">Teks:</label>
                            <input type="text" id="barcodePublisherText" value="Diterbitkan oleh SRMA 19 Bantul" style="width:160px;">
                            <label class="mb-0" style="font-weight:600;font-size:0.85rem;">Kertas:</label>
                            <select id="paperSizeSelect"><option value="b3">B3</option><option value="a4" selected>A4</option><option value="a5">A5</option><option value="f4">F4</option><option value="letter">Letter</option></select>
                            <button class="btn btn-sm btn-info rounded-pill" onclick="previewBarcode()"><i class="fas fa-eye me-1"></i> Preview & Download</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-modern p-0"><div id="pesertaTableContainer"></div></div>
        `;
        applyFilterPeserta();
        updateDeleteButtonPeserta();
    }
    window.renderPeserta = renderPeserta;

    function applyFilterPeserta() {
        const q = (document.getElementById('searchPeserta')?.value || '').toLowerCase().trim();
        const status = document.getElementById('filterStatusPeserta')?.value || '';
        const rombel = document.getElementById('filterRombelPeserta')?.value || '';
        const angkatan = document.getElementById('filterAngkatanPeserta')?.value || '';
        const agama = document.getElementById('filterAgamaPeserta')?.value || '';

        pesertaFiltered = pesertaData.filter(p =>
            (!q || (String(p.Kode||'').toLowerCase().includes(q) || (p.Nama||'').toLowerCase().includes(q))) &&
            (!status || (p.Keterangan||'Aktif') === status) &&
            (!rombel || p.Rombel === rombel) &&
            (!angkatan || (p.Angkatan||'') === angkatan) &&
            (!agama || p.Agama === agama)
        );
        for (const k of selectedKode) {
            if (!pesertaFiltered.some(p => String(p.Kode) === k)) selectedKode.delete(k);
        }
        renderTablePeserta();
        updateDeleteButtonPeserta();
        const info = document.getElementById('infoCountPeserta');
        if (info) info.textContent = `Menampilkan ${pesertaFiltered.length} dari ${pesertaData.length} entri`;
    }
    window.applyFilterPeserta = applyFilterPeserta;

    function resetFilterPeserta() {
        document.getElementById('searchPeserta').value = '';
        document.getElementById('filterStatusPeserta').value = '';
        document.getElementById('filterRombelPeserta').value = '';
        document.getElementById('filterAngkatanPeserta').value = '';
        document.getElementById('filterAgamaPeserta').value = '';
        applyFilterPeserta();
    }
    window.resetFilterPeserta = resetFilterPeserta;

    function renderTablePeserta() {
        const allChecked = pesertaFiltered.length > 0 && pesertaFiltered.every(p => selectedKode.has(String(p.Kode)));
        let rows = '';
        pesertaFiltered.forEach((p, i) => {
            const idx = pesertaData.indexOf(p);
            const kodeStr = String(p.Kode || '');
            const statusClass = (p.Keterangan||'Aktif').toLowerCase();
            const statusLabel = (p.Keterangan||'Aktif');
            rows += `<tr>
                <td>${i+1}</td>
                <td><input type="checkbox" ${selectedKode.has(kodeStr)?'checked':''} onchange="toggleSelectPeserta('${kodeStr}', this.checked)"></td>
                <td><strong>${p.Nama||'-'}</strong></td>
                <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:0.8rem;">${kodeStr.slice(-4)}</code></td>
                <td>${p.Jenis_Kelamin||p.jk||'-'}</td>
                <td>${p.Agama||'-'}</td>
                <td>${p.Rombel||'-'}</td>
                <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
                <td>${p.Angkatan||'-'}</td>
                <td>${p.Wali_Asuh_1||'-'}</td>
                <td>${p.Wali_Asuh_2||'-'}</td>
                <td class="text-center" style="white-space:nowrap;">
                    <button class="btn btn-sm btn-outline-primary rounded-pill px-2 py-1" onclick="showPesertaModal(${idx})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-warning rounded-pill px-2 py-1" onclick="togglePesertaStatus(${idx})" title="Toggle Status"><i class="fas fa-toggle-on"></i></button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-2 py-1" onclick="deletePesertaSingle(${idx})" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="12" class="text-center py-4 text-muted">Tidak ada data peserta</td></tr>';

        document.getElementById('pesertaTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:40px;">No</th>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllPeserta(this.checked)"></th>
                            <th>Nama</th><th>Kode</th><th>JK</th><th>Agama</th>
                            <th>Rombel</th><th>Status</th><th>Angkatan</th>
                            <th>Wali Asuh 1</th><th>Wali Asuh 2</th>
                            <th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTablePeserta = renderTablePeserta;

    function toggleSelectAllPeserta(checked) {
        if (checked) pesertaFiltered.forEach(p => selectedKode.add(String(p.Kode)));
        else selectedKode.clear();
        renderTablePeserta();
        updateDeleteButtonPeserta();
    }
    window.toggleSelectAllPeserta = toggleSelectAllPeserta;

    function toggleSelectPeserta(kode, checked) {
        if (checked) selectedKode.add(kode);
        else selectedKode.delete(kode);
        updateDeleteButtonPeserta();
    }
    window.toggleSelectPeserta = toggleSelectPeserta;

    function updateDeleteButtonPeserta() {
        const btn = document.getElementById('btnDeleteSelectedPeserta');
        const cnt = document.getElementById('selectedCountPeserta');
        if (btn) btn.disabled = selectedKode.size === 0;
        if (cnt) cnt.textContent = selectedKode.size;
    }
    window.updateDeleteButtonPeserta = updateDeleteButtonPeserta;

    function showPesertaModal(index = null) {
        const existing = index !== null && index >= 0 ? pesertaData[index] : null;
        const title = existing ? '✏️ Edit Peserta' : '➕ Tambah Peserta';
        const agamaOptions = ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','Lainnya'];
        const waliOptions = waliAsuhList.map(w => `<option value="${w.Nama}">${w.Nama} (${w.Nomor_HP||'-'})</option>`).join('');
        const modalHtml = `
            <div class="modal-overlay" id="pesertaModal">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="mb-3"><label>Kode Peserta <span class="text-danger">*</span></label><input class="form-control" id="pmKode" value="${existing?.Kode||''}" ${existing?'disabled':''} placeholder="SRMA19-XXX"></div>
                    <div class="mb-3"><label>Nama Lengkap <span class="text-danger">*</span></label><input class="form-control" id="pmNama" value="${existing?.Nama||''}" placeholder="Nama lengkap"></div>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><label>Jenis Kelamin</label><select class="form-select" id="pmJK"><option value="Laki-laki" ${existing?.Jenis_Kelamin==='Laki-laki'?'selected':''}>Laki-laki</option><option value="Perempuan" ${existing?.Jenis_Kelamin==='Perempuan'?'selected':''}>Perempuan</option></select></div>
                        <div class="col-6"><label>Agama</label><select class="form-select" id="pmAgama">${agamaOptions.map(a => `<option ${existing?.Agama===a?'selected':''}>${a}</option>`).join('')}</select></div>
                    </div>
                    <div class="mb-3"><label>Asal</label><input class="form-control" id="pmAsal" value="${existing?.Asal||''}" placeholder="Asal daerah"></div>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><label>Rombel</label><input class="form-control" id="pmRombel" value="${existing?.Rombel||''}" placeholder="Rombel"></div>
                        <div class="col-6"><label>Angkatan</label><input class="form-control" id="pmAngkatan" value="${existing?.Angkatan||''}" placeholder="Tahun"></div>
                    </div>
                    <div class="mb-3"><label>Keterangan (Status)</label><select class="form-select" id="pmKeterangan"><option value="Aktif" ${(existing?.Keterangan||'Aktif')==='Aktif'?'selected':''}>Aktif</option><option value="Nonaktif" ${existing?.Keterangan==='Nonaktif'?'selected':''}>Nonaktif</option><option value="Lulus" ${existing?.Keterangan==='Lulus'?'selected':''}>Lulus</option></select></div>
                    <div class="mb-3"><label>Wali Asuh 1</label><select class="form-select" id="pmWali1"><option value="">-- Pilih Wali Asuh --</option>${waliOptions}</select></div>
                    <div class="mb-3"><label>Wali Asuh 2</label><select class="form-select" id="pmWali2"><option value="">-- Pilih Wali Asuh --</option>${waliOptions}</select></div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary rounded-pill px-4" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary rounded-pill px-4" onclick="savePeserta(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (existing) {
            document.getElementById('pmWali1').value = existing.Wali_Asuh_1 || '';
            document.getElementById('pmWali2').value = existing.Wali_Asuh_2 || '';
        }
    }
    window.showPesertaModal = showPesertaModal;

    async function savePeserta(index) {
        const kode = document.getElementById('pmKode').value.trim();
        const nama = document.getElementById('pmNama').value.trim();
        if (!kode || !nama) {
            showToast('Kode dan Nama wajib diisi.', 'error');
            return;
        }
        const data = {
            kode: kode.toUpperCase(),
            nama: nama,
            jk: document.getElementById('pmJK').value,
            agama: document.getElementById('pmAgama').value,
            asal: document.getElementById('pmAsal').value.trim(),
            rombel: document.getElementById('pmRombel').value.trim(),
            keterangan: document.getElementById('pmKeterangan').value,
            angkatan: document.getElementById('pmAngkatan').value.trim(),
            wali_asuh_1: document.getElementById('pmWali1').value,
            wali_asuh_2: document.getElementById('pmWali2').value
        };
        const btn = document.querySelector('#pesertaModal .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            let res;
            if (index !== null && index >= 0) {
                res = await API.updatePeserta(data);
            } else {
                res = await API.addPeserta(data);
            }
            if (res.status === 'ok') {
                closeModal();
                await refreshPeserta(true);
                showToast(res.message, 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal menyimpan data.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i> Simpan';
        }
    }
    window.savePeserta = savePeserta;

    async function refreshPeserta(silent = false) {
        if (!silent) showToast('Memperbarui data peserta...', 'info');
        try {
            const res = await API.listPeserta();
            if (res.status === 'success') {
                pesertaData = res.data.map(p => ({ ...p, Kode: String(p.Kode || '') }));
                const cached = getCachedData() || {};
                cached.peserta = pesertaData;
                setCachedData(cached);
                applyFilterPeserta();
                if (!silent) showToast(`Data peserta diperbarui (${pesertaData.length} entri)`, 'success');
            } else {
                if (!silent) showToast(res.message || 'Gagal memuat data', 'error');
            }
        } catch (e) {
            if (!silent) showToast('Gagal terhubung ke server', 'error');
        }
    }
    window.refreshPeserta = refreshPeserta;

    async function togglePesertaStatus(index) {
        const p = pesertaData[index];
        if (!p) return;
        const newStatus = (p.Keterangan === 'Aktif' || !p.Keterangan) ? 'Nonaktif' : 'Aktif';
        if (!confirm(`Ubah status ${p.Nama} menjadi ${newStatus}?`)) return;
        const res = await API.updatePeserta({ kode: p.Kode, keterangan: newStatus });
        if (res.status === 'ok') {
            await refreshPeserta(true);
            showToast(`Status ${p.Nama} diubah menjadi ${newStatus}`, 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.togglePesertaStatus = togglePesertaStatus;

    async function deletePesertaSingle(index) {
        const p = pesertaData[index];
        if (!p) return;
        if (!confirm(`Hapus peserta ${p.Nama} (${p.Kode})?`)) return;
        const res = await API.deletePeserta(p.Kode);
        if (res.status === 'ok') {
            await refreshPeserta(true);
            showToast('Peserta dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.deletePesertaSingle = deletePesertaSingle;

    async function deleteSelectedPeserta() {
        if (selectedKode.size === 0) return;
        if (!confirm(`Hapus ${selectedKode.size} peserta terpilih?`)) return;
        let deleted = 0;
        for (const kode of selectedKode) {
            const res = await API.deletePeserta(kode);
            if (res.status === 'ok') deleted++;
        }
        selectedKode.clear();
        await refreshPeserta(true);
        showToast(`${deleted} peserta dihapus.`, 'success');
    }
    window.deleteSelectedPeserta = deleteSelectedPeserta;

    function exportCSVPeserta() {
        const filtered = pesertaFiltered.length ? pesertaFiltered : pesertaData;
        if (!filtered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const rows = [['Kode','Nama','JK','Agama','Asal','Rombel','Keterangan','Angkatan','Wali Asuh 1','Wali Asuh 2']];
        filtered.forEach(p => rows.push([String(p.Kode), p.Nama, p.Jenis_Kelamin||p.jk||'', p.Agama||'', p.Asal||'', p.Rombel||'', p.Keterangan||'Aktif', p.Angkatan||'', p.Wali_Asuh_1||'', p.Wali_Asuh_2||'']));
        const csv = rows.map(r=>r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peserta_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        showToast('CSV berhasil diunduh.', 'success');
    }
    window.exportCSVPeserta = exportCSVPeserta;

    function exportPesertaPDF() {
        const filtered = pesertaFiltered.length ? pesertaFiltered : pesertaData;
        if (!filtered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        let rows = '';
        filtered.forEach((p, i) => {
            rows += `<tr><td style="border:1px solid #d1d5db;padding:4px;">${i+1}</td><td style="border:1px solid #d1d5db;padding:4px;">${String(p.Kode)}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Nama||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Jenis_Kelamin||p.jk||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Agama||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Asal||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Rombel||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Keterangan||'Aktif'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Angkatan||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Wali_Asuh_1||'-'}</td><td style="border:1px solid #d1d5db;padding:4px;">${p.Wali_Asuh_2||'-'}</td></tr>`;
        });
        const html = `
            <div style="font-family:'Inter',Arial,sans-serif;padding:20px;background:#fff;">
                <div style="text-align:center;margin-bottom:20px;border-bottom:3px solid #0d6efd;padding-bottom:10px;">
                    <h3 style="color:#0d6efd;margin:0;font-size:18px;">SEKOLAH RAKYAT MENENGAH ATAS 19 BANTUL</h3>
                    <p style="margin:2px 0;font-size:11px;color:#475569;">Sentra Terpadu Prof. Dr. Soeharso, Sonosewu, Ngestiharjo, Kasihan, Bantul</p>
                    <hr style="border:0;border-top:1px solid #e2e8f0;margin:8px 0;"><h4 style="margin:6px 0;font-size:16px;">DAFTAR PESERTA DIDIK</h4>
                    <p style="font-size:11px;color:#6c757d;">Dicetak: ${tanggalCetak}</p>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:9px;font-family:'Inter',Arial,sans-serif;">
                    <thead><tr style="background-color:#f8fafc;"><th style="border:1px solid #d1d5db;padding:4px;">No</th><th style="border:1px solid #d1d5db;padding:4px;">Kode</th><th style="border:1px solid #d1d5db;padding:4px;">Nama</th><th style="border:1px solid #d1d5db;padding:4px;">JK</th><th style="border:1px solid #d1d5db;padding:4px;">Agama</th><th style="border:1px solid #d1d5db;padding:4px;">Asal</th><th style="border:1px solid #d1d5db;padding:4px;">Rombel</th><th style="border:1px solid #d1d5db;padding:4px;">Status</th><th style="border:1px solid #d1d5db;padding:4px;">Angkatan</th><th style="border:1px solid #d1d5db;padding:4px;">Wali Asuh 1</th><th style="border:1px solid #d1d5db;padding:4px;">Wali Asuh 2</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div style="margin-top:12px;font-size:9px;color:#6c757d;text-align:center;border-top:1px solid #e2e8f0;padding-top:8px;">Total: ${filtered.length} peserta</div>
            </div>`;
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#fff;padding:20px;opacity:0;pointer-events:none;z-index:-9999;';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        showToast('Menyiapkan PDF...', 'info');
        setTimeout(() => {
            html2pdf().set({
                filename: `peserta_${now.toISOString().slice(0,10)}.pdf`,
                margin: 10,
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).from(tempDiv).save().then(() => {
                document.body.removeChild(tempDiv);
                showToast('PDF berhasil diunduh.', 'success');
            }).catch((err) => {
                document.body.removeChild(tempDiv);
                showToast('Gagal mengunduh: ' + err.message, 'error');
            });
        }, 500);
    }
    window.exportPesertaPDF = exportPesertaPDF;

    async function importCSVPeserta(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(e) {
            const lines = e.target.result.split('\n').filter(l=>l.trim());
            if (lines.length < 2) {
                showToast('File CSV kosong atau tidak valid.', 'error');
                return;
            }
            const rows = lines.slice(1).map(l=>l.split(',').map(c=>c.trim().replace(/^"(.*)"$/,'$1')));
            const res = await API.importPeserta(JSON.stringify(rows));
            if (res.status === 'ok') {
                await refreshPeserta(true);
                showToast(`Impor selesai. ${res.added||0} baru, ${res.updated||0} diperbarui.`, 'success');
            } else {
                showToast(res.message, 'error');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }
    window.importCSVPeserta = importCSVPeserta;

    async function arsipLulus() {
        if (!confirm('Pindahkan semua peserta dengan status "Lulus" ke arsip alumni?')) return;
        showToast('Memproses...', 'info');
        const res = await API.arsipLulus();
        if (res.status === 'ok') {
            await refreshPeserta(true);
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.arsipLulus = arsipLulus;

    function generateQRImage(text, size) {
        return new Promise((resolve) => {
            const cacheKey = text + '_' + size;
            if (qrImagesCache[cacheKey]) {
                resolve(qrImagesCache[cacheKey]);
                return;
            }
            const container = document.createElement('div');
            container.style.cssText = `position:fixed;top:0;left:-9999px;width:${size}px;height:${size}px;background:white;z-index:9999;`;
            document.body.appendChild(container);
            const qr = new QRCode(container, {
                text: text,
                width: size,
                height: size,
                colorDark: "#0d6efd",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            setTimeout(() => {
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    const dataUrl = canvas.toDataURL('image/png');
                    document.body.removeChild(container);
                    qrImagesCache[cacheKey] = dataUrl;
                    resolve(dataUrl);
                } else {
                    document.body.removeChild(container);
                    resolve('');
                }
            }, 500);
        });
    }

    async function previewBarcode() {
        if (isGenerating) return;
        isGenerating = true;
        let targetPeserta = [];
        if (selectedKode.size > 0) {
            targetPeserta = pesertaFiltered.filter(p => selectedKode.has(String(p.Kode)));
        } else {
            targetPeserta = pesertaFiltered;
        }
        if (targetPeserta.length === 0) {
            showToast('Tidak ada peserta yang dipilih.', 'warning');
            isGenerating = false;
            return;
        }
        const showNama = document.getElementById('barcodeShowNama')?.checked ?? true;
        const showKode = document.getElementById('barcodeShowKode')?.checked ?? true;
        const showWali1 = document.getElementById('barcodeShowWali1')?.checked ?? true;
        const showWali2 = document.getElementById('barcodeShowWali2')?.checked ?? true;
        const showPublisher = document.getElementById('barcodeShowPublisher')?.checked ?? true;
        const publisherText = document.getElementById('barcodePublisherText')?.value || 'Diterbitkan oleh SRMA 19 Bantul';
        const paperSize = document.getElementById('paperSizeSelect').value;
        const cardWidth = 85.6;
        const cardHeight = 53.98;
        const cardMargin = 4;
        let pdfFormat = 'a4';
        let pdfOrientation = 'landscape';
        if (paperSize === 'b3') {
            pdfFormat = 'b3';
            pdfOrientation = 'landscape';
        }
        const qrSize = Math.floor(cardWidth * 0.55);
        showToast('Menyiapkan preview kartu...', 'info');
        const oldPreview = document.getElementById('barcodePreviewModal');
        if (oldPreview) oldPreview.remove();
        const container = document.createElement('div');
        container.id = 'barcodePreviewContainer';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:-9999;overflow:auto;background:#ffffff;';
        document.body.appendChild(container);
        const cardsPerPage = 10;
        const totalCards = targetPeserta.length;
        const totalPages = Math.ceil(totalCards / cardsPerPage);
        let allPagesHtml = '';
        for (let page = 0; page < totalPages; page++) {
            const startIdx = page * cardsPerPage;
            const endIdx = Math.min(startIdx + cardsPerPage, totalCards);
            const pagePeserta = targetPeserta.slice(startIdx, endIdx);
            const isLastPage = (page === totalPages - 1);
            let rowsHtml = '';
            let currentRow = [];
            for (let i = 0; i < pagePeserta.length; i++) {
                currentRow.push(pagePeserta[i]);
                if (currentRow.length === 5 || i === pagePeserta.length - 1) {
                    const rowPromises = currentRow.map(async (p) => {
                        const qrData = (p.Kode ? String(p.Kode).trim() : 'SRMA19-000');
                        return await generateQRImage(qrData, qrSize);
                    });
                    const rowQrImages = await Promise.all(rowPromises);
                    let rowHtml = `<div style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:${cardMargin}mm;justify-content:center;margin-bottom:${cardMargin}mm;">`;
                    for (let j = 0; j < currentRow.length; j++) {
                        const p = currentRow[j];
                        let infoHtml = '';
                        if (showNama) infoHtml += `<div style="font-size:${Math.floor(cardHeight/18)}mm;font-weight:800;color:#1e293b;margin-top:${Math.floor(cardHeight/20)}mm;">${p.Nama || '-'}</div>`;
                        if (showKode) infoHtml += `<div style="font-size:${Math.floor(cardHeight/24)}mm;color:#475569;margin-top:${Math.floor(cardHeight/30)}mm;">Kode: <span style="font-weight:700;color:#0d6efd;">${p.Kode || ''}</span></div>`;
                        if (showWali1 && p.Wali_Asuh_1) infoHtml += `<div style="font-size:${Math.floor(cardHeight/24)}mm;color:#475569;margin-top:${Math.floor(cardHeight/30)}mm;">Wali 1: ${p.Wali_Asuh_1}</div>`;
                        if (showWali2 && p.Wali_Asuh_2) infoHtml += `<div style="font-size:${Math.floor(cardHeight/24)}mm;color:#475569;margin-top:${Math.floor(cardHeight/30)}mm;">Wali 2: ${p.Wali_Asuh_2}</div>`;
                        if (showPublisher) infoHtml += `<div style="font-size:${Math.floor(cardHeight/30)}mm;color:#64748b;margin-top:${Math.floor(cardHeight/20)}mm;border-top:1px solid #e2e8f0;padding-top:${Math.floor(cardHeight/20)}mm;">${publisherText}</div>`;
                        const cardHtml = `
                            <div style="border:2px solid #94a3b8;border-radius:0;padding:${Math.floor(cardHeight/15)}mm;width:${cardWidth}mm;min-height:${cardHeight}mm;text-align:center;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.06);display:flex;flex-direction:column;justify-content:space-between;">
                                <div>
                                    <div style="background:linear-gradient(135deg, #0d6efd 0%, #1e40af 100%);border-radius:0;padding:${Math.floor(cardHeight/30)}mm;margin-bottom:${Math.floor(cardHeight/20)}mm;">
                                        <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                                            <span style="color:#fff;font-size:${Math.floor(cardHeight/20)}mm;font-weight:700;letter-spacing:1px;">SRMA 19 BANTUL</span>
                                        </div>
                                    </div>
                                    <img src="${rowQrImages[j]}" style="width:${qrSize}mm;height:${qrSize}mm;display:inline-block;background:#fff;padding:${Math.floor(cardHeight/30)}mm;border-radius:0;box-shadow:0 2px 8px rgba(0,0,0,0.04);" />
                                    ${infoHtml}
                                </div>
                            </div>`;
                        rowHtml += cardHtml;
                    }
                    rowHtml += `</div>`;
                    rowsHtml += rowHtml;
                    currentRow = [];
                }
            }
            const pageHtml = `<div style="page-break-after:${isLastPage ? 'auto' : 'always'};padding:${cardMargin}mm;font-family:'Inter',Arial,sans-serif;background:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;">${rowsHtml}</div>`;
            allPagesHtml += pageHtml;
        }
        container.innerHTML = allPagesHtml;
        previewData = {
            targetPeserta,
            showNama,
            showKode,
            showWali1,
            showWali2,
            showPublisher,
            publisherText,
            paperSize,
            pdfFormat,
            pdfOrientation,
            container,
            isMultiple: totalCards > 1
        };
        const previewHtml = `
            <div class="preview-modal show" id="barcodePreviewModal">
                <div class="preview-content">
                    <div class="preview-header">
                        <h4>👁️ Preview Kartu Murid (${totalCards} peserta — ${totalPages} halaman)</h4>
                        <div class="preview-actions">
                            <button class="btn btn-sm btn-success rounded-pill" onclick="downloadBarcodePDF()"><i class="fas fa-download me-1"></i> Download PDF</button>
                            <button class="btn btn-sm btn-primary rounded-pill" onclick="exportBarcodeJPG()"><i class="fas fa-image me-1"></i> Export JPG</button>
                            <button class="btn btn-sm btn-secondary rounded-pill" onclick="closePreviewBarcode()"><i class="fas fa-times"></i> Tutup</button>
                        </div>
                    </div>
                    <div id="previewBody">${container.innerHTML}</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', previewHtml);
        document.body.removeChild(container);
        showToast('Preview siap. Periksa kartu, lalu klik Download.', 'success');
        isGenerating = false;
    }
    window.previewBarcode = previewBarcode;

    function closePreviewBarcode() {
        const modal = document.getElementById('barcodePreviewModal');
        if (modal) modal.remove();
        previewData = null;
    }
    window.closePreviewBarcode = closePreviewBarcode;

    async function downloadBarcodePDF() {
        if (!previewData) {
            showToast('Tidak ada data preview.', 'error');
            return;
        }
        const previewBody = document.getElementById('previewBody');
        if (!previewBody) {
            showToast('Preview tidak ditemukan.', 'error');
            return;
        }
        const previewContainer = previewBody.firstElementChild;
        if (!previewContainer) {
            showToast('Elemen preview tidak ditemukan.', 'error');
            return;
        }
        showToast('Mengunduh PDF dari preview...', 'info');
        const originalStyle = {
            opacity: previewContainer.style.opacity,
            zIndex: previewContainer.style.zIndex,
            pointerEvents: previewContainer.style.pointerEvents,
            position: previewContainer.style.position,
            top: previewContainer.style.top,
            left: previewContainer.style.left,
            width: previewContainer.style.width,
            height: previewContainer.style.height,
            display: previewContainer.style.display,
            visibility: previewContainer.style.visibility,
            overflow: previewContainer.style.overflow
        };
        previewContainer.style.opacity = '1';
        previewContainer.style.zIndex = '9999';
        previewContainer.style.pointerEvents = 'none';
        previewContainer.style.position = 'fixed';
        previewContainer.style.top = '0';
        previewContainer.style.left = '0';
        previewContainer.style.width = '100%';
        previewContainer.style.height = 'auto';
        previewContainer.style.display = 'block';
        previewContainer.style.visibility = 'visible';
        previewContainer.style.overflow = 'visible';
        await new Promise(resolve => setTimeout(resolve, 500));
        const namaSiswa = previewData.targetPeserta.length === 1 ? previewData.targetPeserta[0].Nama.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'multiple';
        const filename = `kartu_murid_${namaSiswa}_${previewData.paperSize}_${new Date().toISOString().slice(0,10)}.pdf`;
        try {
            await html2pdf().set({
                filename: filename,
                margin: 10,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: previewContainer.scrollWidth, height: previewContainer.scrollHeight },
                jsPDF: { unit: 'mm', format: previewData.pdfFormat, orientation: previewData.pdfOrientation }
            }).from(previewContainer).save();
            closePreviewBarcode();
            showToast('PDF berhasil diunduh!', 'success');
        } catch (e) {
            showToast('Gagal mengunduh PDF: ' + e.message, 'error');
            console.error('PDF Error:', e);
        } finally {
            Object.assign(previewContainer.style, originalStyle);
        }
    }
    window.downloadBarcodePDF = downloadBarcodePDF;

    async function exportBarcodeJPG() {
        if (!previewData) {
            showToast('Tidak ada data preview.', 'error');
            return;
        }
        const previewBody = document.getElementById('previewBody');
        if (!previewBody) {
            showToast('Preview tidak ditemukan.', 'error');
            return;
        }
        const previewContainer = previewBody.firstElementChild;
        if (!previewContainer) {
            showToast('Elemen preview tidak ditemukan.', 'error');
            return;
        }
        const isMultiple = previewData.targetPeserta.length > 1;
        showToast('Mengekspor JPG...', 'info');
        const namaSiswa = previewData.targetPeserta.length === 1 ? previewData.targetPeserta[0].Nama.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'multiple';
        try {
            if (!isMultiple) {
                const cardEl = previewContainer.querySelector('[style*="border:2px solid"]') || previewContainer.querySelector('div > div > div');
                const targetEl = cardEl || previewContainer;
                const canvas = await html2canvas(targetEl, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
                const link = document.createElement('a');
                link.download = `kartu_murid_${namaSiswa}_${new Date().toISOString().slice(0,10)}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            } else {
                const originalStyle = {
                    opacity: previewContainer.style.opacity,
                    zIndex: previewContainer.style.zIndex,
                    pointerEvents: previewContainer.style.pointerEvents,
                    position: previewContainer.style.position,
                    top: previewContainer.style.top,
                    left: previewContainer.style.left,
                    width: previewContainer.style.width,
                    height: previewContainer.style.height,
                    display: previewContainer.style.display,
                    visibility: previewContainer.style.visibility,
                    overflow: previewContainer.style.overflow
                };
                const a4WidthPx = 1123;
                previewContainer.style.opacity = '1';
                previewContainer.style.zIndex = '9999';
                previewContainer.style.pointerEvents = 'none';
                previewContainer.style.position = 'fixed';
                previewContainer.style.top = '0';
                previewContainer.style.left = '0';
                previewContainer.style.width = a4WidthPx + 'px';
                previewContainer.style.height = 'auto';
                previewContainer.style.display = 'block';
                previewContainer.style.visibility = 'visible';
                previewContainer.style.overflow = 'visible';
                await new Promise(resolve => setTimeout(resolve, 300));
                const canvas = await html2canvas(previewContainer, { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: a4WidthPx, height: previewContainer.scrollHeight });
                Object.assign(previewContainer.style, originalStyle);
                const link = document.createElement('a');
                link.download = `kartu_murid_${namaSiswa}_${new Date().toISOString().slice(0,10)}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                link.click();
            }
            showToast('JPG berhasil diunduh!', 'success');
        } catch (e) {
            showToast('Gagal mengekspor JPG: ' + e.message, 'error');
            console.error('JPG Export Error:', e);
        }
    }
    window.exportBarcodeJPG = exportBarcodeJPG;

    // ============================================================
    //  BAGIAN 4: ABSENSI.JS
    // ============================================================

    let absensiData = [];
    let absensiFiltered = [];
    let selectedTimestamps = new Set();
    let currentPageAbsensi = 1;
    let totalAbsensiEntries = 0;
    const pageSizeAbsensi = 100;

    function renderAbsensi(container) {
        const cached = getCachedData();
        if (cached?.absensi) {
            absensiData = cached.absensi;
            absensiFiltered = [...absensiData];
            totalAbsensiEntries = cached.totalAbsensi || absensiData.length;
        }
        const sesiList = [...new Set(absensiData.map(a => a.Sesi_Nama).filter(Boolean))];
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-clipboard-list me-2" style="color:#0d6efd;"></i>Data Absensi <span class="badge bg-secondary rounded-pill">${totalAbsensiEntries}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-danger rounded-pill" onclick="exportPDFAbsensi()"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-sm btn-success rounded-pill" onclick="exportCSVAbsensi()"><i class="fas fa-download"></i> CSV</button>
                    <button class="btn btn-sm btn-warning rounded-pill" onclick="generateAbsence()"><i class="fas fa-robot"></i> Generate</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" id="btnDeleteAbsensi" onclick="deleteSelectedAbsensi()" disabled><i class="fas fa-trash-alt me-1"></i> Hapus (<span id="absensiSelectedCount">0</span>)</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshAbsensi(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <input type="text" class="form-control form-control-sm" id="searchAbsensi" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterAbsensi()">
                    <input type="date" class="form-control form-control-sm" id="fTglAbsensi" style="width:140px" onchange="applyFilterAbsensi()">
                    <select class="form-select form-select-sm" id="fSesiAbsensi" style="width:150px" onchange="applyFilterAbsensi()">
                        <option value="">Semua Sesi</option>
                        ${sesiList.map(s => `<option>${s}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterAbsensi()">Reset</button>
                    <span class="small text-muted ms-2" id="lastUpdateAbsensi"></span>
                </div>
            </div>
            <div class="card-modern p-0"><div id="absensiTableContainer"></div></div>
            <div id="paginationContainerAbsensi"></div>
        `;
        applyFilterAbsensi();
        updateDeleteButtonAbsensi();
        document.getElementById('lastUpdateAbsensi').textContent = `Terakhir: ${new Date().toLocaleTimeString()}`;
    }
    window.renderAbsensi = renderAbsensi;

    async function refreshAbsensi(silent = false) {
        if (!silent) showToast('Memperbarui data absensi...', 'info');
        const tgl = document.getElementById('fTglAbsensi')?.value || '';
        const sesi = document.getElementById('fSesiAbsensi')?.value || '';
        try {
            const res = await API.listAbsensi(tgl, sesi, currentPageAbsensi, pageSizeAbsensi);
            if (res.status === 'success') {
                absensiData = res.data;
                totalAbsensiEntries = res.total;
                const cached = getCachedData() || {};
                cached.absensi = absensiData;
                cached.totalAbsensi = totalAbsensiEntries;
                setCachedData(cached);
                applyFilterAbsensi(true);
                if (!silent) showToast(`✅ Data diperbarui (${absensiData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshAbsensi = refreshAbsensi;

    function applyFilterAbsensi(silent = false) {
        const q = (document.getElementById('searchAbsensi')?.value || '').toLowerCase().trim();
        const t = document.getElementById('fTglAbsensi')?.value || '';
        const s = document.getElementById('fSesiAbsensi')?.value || '';
        absensiFiltered = absensiData.filter(a =>
            (!q || (a.Nama||'').toLowerCase().includes(q) || (a.Kode||'').toLowerCase().includes(q) || (a.Petugas||'').toLowerCase().includes(q)) &&
            (!t || a.Tanggal === t) &&
            (!s || a.Sesi_Nama === s)
        );
        for (const ts of selectedTimestamps) {
            if (!absensiFiltered.some(a => a.Timestamp === ts)) selectedTimestamps.delete(ts);
        }
        renderTableAbsensi();
        renderPaginationAbsensi();
        updateDeleteButtonAbsensi();
        if (!silent) {
            const info = document.getElementById('infoCountAbsensi');
            if (info) info.textContent = `Menampilkan ${absensiFiltered.length} dari ${totalAbsensiEntries} entri`;
        }
    }
    window.applyFilterAbsensi = applyFilterAbsensi;

    function resetFilterAbsensi() {
        document.getElementById('searchAbsensi').value = '';
        document.getElementById('fTglAbsensi').value = '';
        document.getElementById('fSesiAbsensi').value = '';
        currentPageAbsensi = 1;
        applyFilterAbsensi();
    }
    window.resetFilterAbsensi = resetFilterAbsensi;

    async function changePageAbsensi(page) {
        currentPageAbsensi = page;
        const container = document.getElementById('absensiTableContainer');
        if (container) container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
        await refreshAbsensi(true);
    }
    window.changePageAbsensi = changePageAbsensi;

    function renderTableAbsensi() {
        const allChecked = absensiFiltered.length > 0 && absensiFiltered.every(a => selectedTimestamps.has(a.Timestamp));
        let rows = '';
        absensiFiltered.forEach(a => {
            const statusClass = a.Status === 'Hadir' ? 'hadir' : a.Status === 'Izin' ? 'izin' : a.Status === 'Sakit' ? 'sakit' : 'tidak';
            rows += `<tr>
                <td><input type="checkbox" ${selectedTimestamps.has(a.Timestamp) ? 'checked' : ''} onchange="toggleSelectAbsensi('${a.Timestamp}', this.checked)"></td>
                <td>${a.Tanggal || '-'}</td>
                <td>${a.Jam || '-'}</td>
                <td><code>${(a.Kode || '').slice(-4)}</code></td>
                <td><strong>${a.Nama || '-'}</strong></td>
                <td class="small">${a.Sesi_Nama || '-'}</td>
                <td><span class="badge-status ${statusClass}">${a.Status || 'Hadir'}</span></td>
                <td class="small">${a.Petugas || '-'}</td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="8" class="text-center py-3 text-muted">Tidak ada data absensi</td></tr>';

        const container = document.getElementById('absensiTableContainer');
        if (!container) return;
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllAbsensi(this.checked)"></th>
                            <th>Tgl</th><th>Jam</th><th>Kode</th><th>Nama</th><th>Sesi</th><th>Status</th><th>Petugas</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableAbsensi = renderTableAbsensi;

    function renderPaginationAbsensi() {
        const totalPages = Math.ceil(totalAbsensiEntries / pageSizeAbsensi) || 1;
        const container = document.getElementById('paginationContainerAbsensi');
        if (!container) return;
        let html = `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <small class="text-muted" id="infoCountAbsensi">Menampilkan ${absensiFiltered.length} dari ${totalAbsensiEntries} entri</small>
                <div>`;
        if (currentPageAbsensi > 1) html += `<button class="btn btn-sm btn-outline-primary" onclick="changePageAbsensi(${currentPageAbsensi - 1})">← Sebelumnya</button> `;
        if (currentPageAbsensi < totalPages) html += `<button class="btn btn-sm btn-outline-primary" onclick="changePageAbsensi(${currentPageAbsensi + 1})">Berikutnya →</button>`;
        html += `</div></div>`;
        container.innerHTML = html;
    }
    window.renderPaginationAbsensi = renderPaginationAbsensi;

    function toggleSelectAllAbsensi(checked) {
        if (checked) absensiFiltered.forEach(a => selectedTimestamps.add(a.Timestamp));
        else selectedTimestamps.clear();
        renderTableAbsensi();
        updateDeleteButtonAbsensi();
    }
    window.toggleSelectAllAbsensi = toggleSelectAllAbsensi;

    function toggleSelectAbsensi(ts, checked) {
        if (checked) selectedTimestamps.add(ts);
        else selectedTimestamps.delete(ts);
        updateDeleteButtonAbsensi();
    }
    window.toggleSelectAbsensi = toggleSelectAbsensi;

    function updateDeleteButtonAbsensi() {
        const btn = document.getElementById('btnDeleteAbsensi');
        const cnt = document.getElementById('absensiSelectedCount');
        if (btn) btn.disabled = selectedTimestamps.size === 0;
        if (cnt) cnt.textContent = selectedTimestamps.size;
    }
    window.updateDeleteButtonAbsensi = updateDeleteButtonAbsensi;

    async function deleteSelectedAbsensi() {
        if (selectedTimestamps.size === 0) return;
        if (!confirm(`Hapus ${selectedTimestamps.size} data absensi terpilih?`)) return;
        const timestamps = Array.from(selectedTimestamps);
        const btn = document.getElementById('btnDeleteAbsensi');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menghapus...';
        try {
            const res = await API.deleteAbsensi(timestamps);
            if (res.status === 'ok') {
                selectedTimestamps.clear();
                await refreshAbsensi(true);
                showToast(`✅ ${res.message}`, 'success');
            } else {
                showToast(`❌ ${res.message}`, 'error');
            }
        } catch (e) {
            showToast('❌ Gagal menghapus data.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Hapus Terpilih';
            updateDeleteButtonAbsensi();
        }
    }
    window.deleteSelectedAbsensi = deleteSelectedAbsensi;

    async function generateAbsence() {
        const tgl = document.getElementById('fTglAbsensi')?.value;
        if (!tgl) {
            showToast('Pilih tanggal terlebih dahulu.', 'warning');
            return;
        }
        if (!confirm(`Catat "Tidak Berangkat" dan "Izin" untuk tanggal ${tgl}?`)) return;
        const btn = document.querySelector('button[onclick*="generateAbsence"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Memproses...';
        try {
            const res = await API.generateAbsence(tgl);
            if (res.status === 'ok') {
                showToast(`✅ ${res.message}`, 'success');
                await refreshAbsensi(true);
            } else {
                showToast(`❌ ${res.message}`, 'error');
            }
        } catch (e) {
            showToast('❌ Gagal generate.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-robot me-1"></i> Generate Tidak Berangkat';
        }
    }
    window.generateAbsence = generateAbsence;

    function exportPDFAbsensi() {
        if (!absensiFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const tgl = document.getElementById('fTglAbsensi')?.value || 'Semua';
        const sesi = document.getElementById('fSesiAbsensi')?.value || 'Semua';
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        const html = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3>SEKOLAH RAKYAT MENENGAH ATAS 19 BANTUL</h3>
                <p>Sentra Terpadu Prof. Dr. Soeharso, Sonosewu</p>
                <hr><h4>LAPORAN ABSENSI</h4>
                <p>Filter: ${tgl} | Sesi: ${sesi}</p>
                <p>Dicetak: ${tanggalCetak}</p>
            </div>
            <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:11px;">
                <thead><tr><th>No</th><th>Tgl</th><th>Jam</th><th>Kode</th><th>Nama</th><th>Sesi</th><th>Status</th><th>Petugas</th></tr></thead>
                <tbody>${absensiFiltered.map((a, i) => `<tr><td>${i+1}</td><td>${a.Tanggal}</td><td>${a.Jam}</td><td>${a.Kode.slice(-4)}</td><td>${a.Nama}</td><td>${a.Sesi_Nama}</td><td>${a.Status || 'Hadir'}</td><td>${a.Petugas}</td></tr>`).join('')}</tbody>
            </table>`;
        html2pdf().set({
            filename: `Laporan_Absensi_${tgl}_${now.toISOString().slice(0,10)}.pdf`,
            margin: 10,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(html).save();
    }
    window.exportPDFAbsensi = exportPDFAbsensi;

    function exportCSVAbsensi() {
        if (!absensiFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const rows = [['"Tanggal"','"Jam"','"Kode"','"Nama"','"Sesi"','"Status"','"Petugas"']];
        absensiFiltered.forEach(a => rows.push([`"${a.Tanggal}"`,`"${a.Jam}"`,`"${a.Kode}"`,`"${a.Nama}"`,`"${a.Sesi_Nama}"`,`"${a.Status||'Hadir'}"`,`"${a.Petugas}"`]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `absensi_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        showToast('✅ CSV berhasil diunduh.', 'success');
    }
    window.exportCSVAbsensi = exportCSVAbsensi;

    // ============================================================
    //  BAGIAN 5: IZIN.JS
    // ============================================================

    let izinData = [];
    let izinFiltered = [];
    let selectedIzinIds = new Set();

    function renderIzin(container) {
        const cached = getCachedData();
        if (cached?.izin) {
            izinData = cached.izin;
            izinFiltered = [...izinData];
        }
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-file-medical-alt me-2" style="color:#0d6efd;"></i>Data Izin <span class="badge bg-secondary rounded-pill">${izinData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showIzinModal(null)"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" id="btnDeleteSelectedIzin" onclick="deleteSelectedIzin()" disabled><i class="fas fa-trash-alt me-1"></i> Hapus (<span id="selectedCountIzin">0</span>)</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshIzin(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <input type="text" class="form-control form-control-sm" id="searchIzin" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterIzin()">
                    <input type="date" class="form-control form-control-sm" id="fTglIzin" style="width:140px" onchange="applyFilterIzin()">
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterIzin()">Reset</button>
                    <span class="small text-muted ms-2" id="infoCountIzin">Menampilkan ${izinFiltered.length} dari ${izinData.length} entri</span>
                </div>
            </div>
            <div class="card-modern p-0"><div id="izinTableContainer"></div></div>
        `;
        applyFilterIzin();
        updateDeleteButtonIzin();
    }
    window.renderIzin = renderIzin;

    async function refreshIzin(silent = false) {
        if (!silent) showToast('Memperbarui data izin...', 'info');
        try {
            const res = await API.listIzin();
            if (res.status === 'success') {
                izinData = res.data;
                const cached = getCachedData() || {};
                cached.izin = izinData;
                setCachedData(cached);
                applyFilterIzin();
                if (!silent) showToast(`✅ Data izin diperbarui (${izinData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshIzin = refreshIzin;

    function applyFilterIzin() {
        const q = (document.getElementById('searchIzin')?.value || '').toLowerCase().trim();
        const tgl = document.getElementById('fTglIzin')?.value || '';
        izinFiltered = izinData.filter(izin =>
            (!q || (izin.Nama_Peserta || '').toLowerCase().includes(q) || (izin.Kode_Peserta || '').toLowerCase().includes(q)) &&
            (!tgl || izin.Tanggal === tgl)
        );
        for (const id of selectedIzinIds) {
            if (!izinFiltered.some(i => String(i.ID) === id)) selectedIzinIds.delete(id);
        }
        renderTableIzin();
        updateDeleteButtonIzin();
        const info = document.getElementById('infoCountIzin');
        if (info) info.textContent = `Menampilkan ${izinFiltered.length} dari ${izinData.length} entri`;
    }
    window.applyFilterIzin = applyFilterIzin;

    function resetFilterIzin() {
        document.getElementById('searchIzin').value = '';
        document.getElementById('fTglIzin').value = '';
        applyFilterIzin();
    }
    window.resetFilterIzin = resetFilterIzin;

    function renderTableIzin() {
        const allChecked = izinFiltered.length > 0 && izinFiltered.every(iz => selectedIzinIds.has(String(iz.ID)));
        let rows = '';
        izinFiltered.forEach((iz, idx) => {
            const realIdx = izinData.indexOf(iz);
            rows += `<tr>
                <td><input type="checkbox" ${selectedIzinIds.has(String(iz.ID))?'checked':''} onchange="toggleSelectIzin('${String(iz.ID)}', this.checked)"></td>
                <td>${iz.Tanggal || '-'}</td>
                <td><code>${(iz.Kode_Peserta || '').slice(-4)}</code></td>
                <td>${iz.Nama_Peserta || '-'}</td>
                <td>${iz.Keterangan || '-'}</td>
                <td>${iz.Bukti_Surat ? '<a href="#" onclick="lihatBuktiIzin(' + realIdx + ')"><i class="fas fa-paperclip"></i> Lihat</a>' : '-'}</td>
                <td>${iz.Petugas || '-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary p-1" onclick="showIzinModal(${realIdx})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1" onclick="hapusIzin(${realIdx})"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="8" class="text-center py-3 text-muted">Belum ada data izin</td></tr>';

        document.getElementById('izinTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllIzin(this.checked)"></th>
                            <th>Tanggal</th><th>Kode</th><th>Nama</th><th>Keterangan</th><th>Bukti</th><th>Petugas</th><th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableIzin = renderTableIzin;

    function toggleSelectAllIzin(checked) {
        if (checked) izinFiltered.forEach(iz => selectedIzinIds.add(String(iz.ID)));
        else selectedIzinIds.clear();
        renderTableIzin();
        updateDeleteButtonIzin();
    }
    window.toggleSelectAllIzin = toggleSelectAllIzin;

    function toggleSelectIzin(id, checked) {
        if (checked) selectedIzinIds.add(id);
        else selectedIzinIds.delete(id);
        updateDeleteButtonIzin();
    }
    window.toggleSelectIzin = toggleSelectIzin;

    function updateDeleteButtonIzin() {
        const btn = document.getElementById('btnDeleteSelectedIzin');
        const cnt = document.getElementById('selectedCountIzin');
        if (btn) btn.disabled = selectedIzinIds.size === 0;
        if (cnt) cnt.textContent = selectedIzinIds.size;
    }
    window.updateDeleteButtonIzin = updateDeleteButtonIzin;

    function showIzinModal(index = null) {
        const existing = index !== null ? izinData[index] : null;
        const title = existing ? '✏️ Edit Izin' : '➕ Tambah Izin';
        const modalHtml = `
            <div class="modal-overlay" id="izinModal">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="mb-3"><label>Kode Peserta <span class="text-danger">*</span></label><input type="text" class="form-control" id="imKode" value="${existing?.Kode_Peserta || ''}" placeholder="SRMA19-XXX" required></div>
                    <div class="mb-3"><label>Nama Peserta <span class="text-danger">*</span></label><input type="text" class="form-control" id="imNama" value="${existing?.Nama_Peserta || ''}" required></div>
                    <div class="mb-3"><label>Tanggal <span class="text-danger">*</span></label><input type="date" class="form-control" id="imTanggal" value="${existing?.Tanggal || ''}" required></div>
                    <div class="mb-3"><label>Keterangan <span class="text-danger">*</span></label><input type="text" class="form-control" id="imKeterangan" value="${existing?.Keterangan || ''}" placeholder="Sakit, izin keluarga, dll." required></div>
                    <div class="mb-3"><label>Bukti Surat (foto/scan, max 49KB)</label><input type="file" accept="image/*" class="form-control" id="imBukti">${existing?.Bukti_Surat ? '<small class="text-muted">Sudah ada bukti sebelumnya. Upload baru untuk mengganti.</small>' : ''}</div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary rounded-pill px-4" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary rounded-pill px-4" onclick="saveIzin(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showIzinModal = showIzinModal;

    async function saveIzin(index) {
        const kode = document.getElementById('imKode').value.trim().toUpperCase();
        const nama = document.getElementById('imNama').value.trim();
        const tgl = document.getElementById('imTanggal').value;
        const keterangan = document.getElementById('imKeterangan').value.trim();
        if (!kode || !nama || !tgl || !keterangan) {
            showToast('Semua field wajib diisi.', 'error');
            return;
        }
        let bukti = '';
        const fileInput = document.getElementById('imBukti');
        if (fileInput.files && fileInput.files[0]) {
            if (fileInput.files[0].size > 50000) {
                showToast('Ukuran file maksimal 50KB.', 'error');
                return;
            }
            bukti = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(fileInput.files[0]);
            });
        } else if (index !== null && izinData[index]?.Bukti_Surat) {
            bukti = izinData[index].Bukti_Surat;
        }
        const data = {
            kode_peserta: kode,
            nama_peserta: nama,
            tanggal: tgl,
            keterangan: keterangan,
            petugas: window.currentUser?.nama || 'Unknown',
            bukti_surat: bukti
        };
        const btn = document.querySelector('#izinModal .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            let res;
            if (index !== null) {
                data.id = izinData[index].ID;
                res = await API.updateIzin(data);
            } else {
                res = await API.addIzin(data);
            }
            if (res.status === 'ok') {
                closeModal();
                await refreshIzin();
                showToast(res.message, 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal menyimpan data.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i> Simpan';
        }
    }
    window.saveIzin = saveIzin;

    async function hapusIzin(index) {
        if (!confirm('Hapus izin ini?')) return;
        const res = await API.deleteIzin(izinData[index].ID);
        if (res.status === 'ok') {
            await refreshIzin();
            showToast('Izin dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.hapusIzin = hapusIzin;

    async function deleteSelectedIzin() {
        if (selectedIzinIds.size === 0) return;
        if (!confirm(`Hapus ${selectedIzinIds.size} izin terpilih?`)) return;
        let deleted = 0;
        for (const id of selectedIzinIds) {
            const res = await API.deleteIzin(id);
            if (res.status === 'ok') deleted++;
        }
        selectedIzinIds.clear();
        await refreshIzin();
        showToast(`✅ ${deleted} izin dihapus.`, 'success');
    }
    window.deleteSelectedIzin = deleteSelectedIzin;

    function lihatBuktiIzin(index) {
        const izin = izinData[index];
        if (!izin?.Bukti_Surat) {
            showToast('Tidak ada bukti surat.', 'warning');
            return;
        }
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`<html><head><title>Bukti Izin</title></head><body><img src="${izin.Bukti_Surat}" style="max-width:100%;height:auto;display:block;margin:auto;"></body></html>`);
        } else {
            showToast('Pop-up diblokir. Izinkan pop-up untuk melihat bukti.', 'warning');
        }
    }
    window.lihatBuktiIzin = lihatBuktiIzin;

    // ============================================================
    //  BAGIAN 6: JADWAL.JS
    // ============================================================

    let jadwalData = [];
    let filterAgamaJadwal = '';

    function renderJadwal(container) {
        const cached = getCachedData();
        if (cached?.jadwal) {
            jadwalData = cached.jadwal.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
        }
        const savedFilter = sessionStorage.getItem('srma19_jadwal_filter');
        if (savedFilter) filterAgamaJadwal = savedFilter;

        container.innerHTML = `<div id="jadwalContent"></div>`;
        renderJadwalContent();
    }
    window.renderJadwal = renderJadwal;

    function renderJadwalContent() {
        const agamaList = [...new Set(jadwalData.map(j => j.agama).filter(Boolean))].sort();
        const filtered = filterAgamaJadwal ? jadwalData.filter(j => j.agama === filterAgamaJadwal) : jadwalData;

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-calendar-alt me-2" style="color:#0d6efd;"></i>Jadwal Kegiatan</h4>
                <div class="d-flex gap-2 flex-wrap">
                    <input type="date" id="prayerDate" value="${new Date().toISOString().split('T')[0]}" class="form-control form-control-sm" style="width:150px;">
                    <button class="btn btn-sm btn-warning rounded-pill" onclick="updatePrayerTimes()"><i class="fas fa-cloud-sun me-1"></i>Perbarui Sholat</button>
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showJadwalModal()"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshJadwal(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <label class="fw-bold me-2">Filter Agama:</label>
                    <select class="form-select form-select-sm" id="filterAgamaJadwal" onchange="changeFilterAgamaJadwal(this.value)" style="width:150px;">
                        <option value="">Semua Agama</option>
                        ${agamaList.map(a => `<option value="${a}" ${filterAgamaJadwal === a ? 'selected' : ''}>${a}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterJadwal()">Reset</button>
                </div>
            </div>
            <div id="jadwalListContainer"></div>
        `;
        document.getElementById('jadwalContent').innerHTML = html;

        if (!jadwalData.length) {
            document.getElementById('jadwalListContainer').innerHTML = '<div class="text-center py-5 text-muted">Belum ada jadwal. Klik "Tambah" untuk membuat baru.</div>';
            return;
        }
        if (!filtered.length) {
            document.getElementById('jadwalListContainer').innerHTML = '<div class="text-center py-5 text-muted">Tidak ada jadwal untuk agama yang dipilih.</div>';
            return;
        }

        const grouped = {};
        filtered.forEach(j => { if (!grouped[j.agama]) grouped[j.agama] = []; grouped[j.agama].push(j); });

        let listHtml = '';
        for (const [agama, items] of Object.entries(grouped)) {
            listHtml += `<div class="mb-4"><h5 class="fw-bold mb-2"><i class="fas fa-users me-2" style="color:#0d6efd;"></i>${agama} <span class="badge bg-secondary rounded-pill">${items.length}</span></h5><div class="row g-2">`;
            items.forEach(j => {
                const realIdx = jadwalData.indexOf(j);
                listHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card-modern p-3" style="border-left:4px solid ${j.color||'#0d6efd'};">
                            <div class="d-flex align-items-center gap-3">
                                <div style="width:40px;height:40px;border-radius:10px;background:${j.bg||'#f0f0f0'};color:${j.color||'#333'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><i class="fas ${j.icon||'fa-circle'}"></i></div>
                                <div class="flex-grow-1"><strong class="small">${j.nama}</strong><div><small class="text-muted">${j.mulai} - ${j.selesai}</small></div></div>
                                <div class="d-flex gap-1 flex-shrink-0">
                                    <button class="btn btn-sm btn-outline-warning p-1" onclick="editJadwal(${realIdx})" title="Edit"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-outline-danger p-1" onclick="deleteJadwal(${realIdx})" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            listHtml += `</div></div>`;
        }
        document.getElementById('jadwalListContainer').innerHTML = listHtml;
    }

    async function refreshJadwal(silent = false) {
        if (!silent) showToast('Memperbarui jadwal...', 'info');
        try {
            const res = await API.getJadwal();
            if (res.status === 'success') {
                jadwalData = res.data.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
                const cached = getCachedData() || {};
                cached.jadwal = jadwalData;
                setCachedData(cached);
                renderJadwalContent();
                if (!silent) showToast('✅ Jadwal diperbarui.', 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat jadwal.', 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshJadwal = refreshJadwal;

    function changeFilterAgamaJadwal(agama) {
        filterAgamaJadwal = agama;
        renderJadwalContent();
        sessionStorage.setItem('srma19_jadwal_filter', agama);
    }
    window.changeFilterAgamaJadwal = changeFilterAgamaJadwal;

    function resetFilterJadwal() {
        filterAgamaJadwal = '';
        sessionStorage.removeItem('srma19_jadwal_filter');
        renderJadwalContent();
        const select = document.getElementById('filterAgamaJadwal');
        if (select) select.value = '';
    }
    window.resetFilterJadwal = resetFilterJadwal;

    async function updatePrayerTimes() {
        const date = document.getElementById('prayerDate').value;
        if (!date) {
            showToast('Pilih tanggal terlebih dahulu.', 'warning');
            return;
        }
        const btn = document.querySelector('button[onclick*="updatePrayerTimes"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Memperbarui...';
        try {
            const res = await API.updatePrayerTimes(date);
            if (res.status === 'ok') {
                showToast(res.message, 'success');
                await refreshJadwal(true);
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal terhubung ke server.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-sun me-1"></i>Perbarui Sholat';
        }
    }
    window.updatePrayerTimes = updatePrayerTimes;

    function showJadwalModal(index = null) {
        const existing = index !== null && index >= 0 ? jadwalData[index] : null;
        const icons = ['fa-sun','fa-coffee','fa-mosque','fa-church','fa-om','fa-dharmachakra','fa-spa','fa-users','fa-utensil-spoon','fa-moon','fa-cross'];
        const agamaOptions = ['Islam','Kristen','Katolik','Hindu','Buddha','Penghayat','Lainnya'];
        const modalHtml = `
            <div class="modal-overlay" id="jadwalModal">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${existing ? '✏️ Edit Jadwal' : '➕ Tambah Jadwal'}</h5>
                        <button class="btn-close" onclick="closeModal()"></button>
                    </div>
                    <div class="mb-3"><label>Agama</label><select class="form-select" id="jmAgama">${agamaOptions.map(a => `<option ${(existing?.agama||'Islam')===a?'selected':''}>${a}</option>`).join('')}</select></div>
                    <div class="mb-3"><label>Nama Kegiatan</label><input class="form-control" id="jmNama" value="${existing?.nama||''}" placeholder="Contoh: Apel Pagi"></div>
                    <div class="row mb-3">
                        <div class="col"><label>Mulai</label><input type="time" class="form-control" id="jmMulai" value="${existing?.mulai||''}"></div>
                        <div class="col"><label>Selesai</label><input type="time" class="form-control" id="jmSelesai" value="${existing?.selesai||''}"></div>
                    </div>
                    <div class="mb-3"><label>Icon</label><select class="form-select" id="jmIcon">${icons.map(i => `<option value="${i}" ${existing?.icon===i?'selected':''}>${i}</option>`).join('')}</select></div>
                    <div class="mb-3"><label>Warna</label><input type="color" class="form-control" id="jmColor" value="${existing?.color||'#0d6efd'}"></div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary" onclick="saveJadwal(${index})"><i class="fas fa-save me-1"></i>Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showJadwalModal = showJadwalModal;

    async function saveJadwal(index) {
        const agama = document.getElementById('jmAgama').value;
        const nama = document.getElementById('jmNama').value.trim();
        const mulai = document.getElementById('jmMulai').value;
        const selesai = document.getElementById('jmSelesai').value;
        const icon = document.getElementById('jmIcon').value;
        const color = document.getElementById('jmColor').value;
        if (!nama || !mulai || !selesai) {
            showToast('Nama, Mulai, Selesai wajib diisi.', 'error');
            return;
        }
        const newEntry = {
            id: (index !== null && jadwalData[index]?.id) ? jadwalData[index].id : Date.now(),
            agama, nama, mulai, selesai, icon, color, bg: color + '1a'
        };
        let updatedJadwal = [...jadwalData];
        if (index !== null && index >= 0) {
            if (index < updatedJadwal.length) updatedJadwal[index] = newEntry;
            else { showToast('Index tidak valid.', 'error'); return; }
        } else {
            updatedJadwal.push(newEntry);
        }
        const btn = document.querySelector('#jadwalModal .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            const res = await API.saveJadwal(updatedJadwal);
            if (res.status === 'ok') {
                jadwalData = updatedJadwal.sort((a,b) => (parseInt(a.id)||0) - (parseInt(b.id)||0));
                setCachedData({ ...getCachedData(), jadwal: jadwalData });
                closeModal();
                renderJadwalContent();
                showToast('✅ Jadwal disimpan.', 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal menyimpan jadwal.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Simpan';
        }
    }
    window.saveJadwal = saveJadwal;

    async function deleteJadwal(index) {
        if (!confirm('Hapus jadwal ini?')) return;
        const deleted = jadwalData.splice(index, 1);
        try {
            const res = await API.saveJadwal(jadwalData);
            if (res.status === 'ok') {
                setCachedData({ ...getCachedData(), jadwal: jadwalData });
                renderJadwalContent();
                showToast('✅ Jadwal dihapus.', 'success');
            } else {
                jadwalData.splice(index, 0, deleted[0]);
                showToast(res.message, 'error');
            }
        } catch (e) {
            jadwalData.splice(index, 0, deleted[0]);
            showToast('Gagal menghapus jadwal.', 'error');
        }
    }
    window.deleteJadwal = deleteJadwal;

    function editJadwal(index) { showJadwalModal(index); }
    window.editJadwal = editJadwal;

    // ============================================================
    //  BAGIAN 7: PETUGAS.JS
    // ============================================================

    let petugasData = [];
    let petugasFiltered = [];
    let selectedPetugasUsernames = new Set();

    function renderPetugas(container) {
        const cached = getCachedData();
        if (cached?.petugas) {
            petugasData = cached.petugas;
            petugasFiltered = [...petugasData];
        }
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-user-shield me-2" style="color:#0d6efd;"></i>Data Petugas <span class="badge bg-secondary rounded-pill">${petugasData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showPetugasModal(null)"><i class="fas fa-plus me-1"></i> Tambah</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern p-0"><div id="petugasTableContainer"></div></div>
        `;
        renderTablePetugas();
    }
    window.renderPetugas = renderPetugas;

    function renderTablePetugas() {
        const allChecked = petugasFiltered.length > 0 && petugasFiltered.every(p => selectedPetugasUsernames.has(p.Username));
        let rows = '';
        petugasFiltered.forEach((p, i) => {
            const realIdx = petugasData.indexOf(p);
            const statusClass = (p.Status === 'Aktif') ? 'bg-success' : 'bg-secondary';
            rows += `<tr>
                <td>${i+1}</td>
                <td><input type="checkbox" ${selectedPetugasUsernames.has(p.Username) ? 'checked' : ''} onchange="toggleSelectPetugas('${p.Username}', this.checked)"></td>
                <td><strong>${p.Nama || '-'}</strong></td>
                <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${p.Username || '-'}</code></td>
                <td>${p.Role || '-'}</td>
                <td><span class="badge ${statusClass}">${p.Status || 'Aktif'}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary p-1" onclick="showPetugasModal(${realIdx})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-warning p-1" onclick="toggleStatusPetugas(${realIdx})" title="Toggle Status"><i class="fas fa-toggle-on"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1" onclick="deletePetugas(${realIdx})" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="7" class="text-center py-3 text-muted">Belum ada data petugas</td></tr>';

        document.getElementById('petugasTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;">No</th>
                            <th style="width:30px;"><input type="checkbox" ${allChecked ? 'checked' : ''} onchange="toggleSelectAllPetugas(this.checked)"></th>
                            <th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTablePetugas = renderTablePetugas;

    function toggleSelectAllPetugas(checked) {
        if (checked) petugasFiltered.forEach(p => selectedPetugasUsernames.add(p.Username));
        else selectedPetugasUsernames.clear();
        renderTablePetugas();
    }
    window.toggleSelectAllPetugas = toggleSelectAllPetugas;

    function toggleSelectPetugas(username, checked) {
        if (checked) selectedPetugasUsernames.add(username);
        else selectedPetugasUsernames.delete(username);
        renderTablePetugas();
    }
    window.toggleSelectPetugas = toggleSelectPetugas;

    async function refreshPetugas(silent = false) {
        if (!silent) showToast('Memperbarui data petugas...', 'info');
        try {
            const res = await API.listPetugas();
            if (res.status === 'success') {
                petugasData = res.data;
                const cached = getCachedData() || {};
                cached.petugas = petugasData;
                setCachedData(cached);
                petugasFiltered = [...petugasData];
                selectedPetugasUsernames.clear();
                renderTablePetugas();
                if (!silent) showToast(`✅ Data petugas diperbarui (${petugasData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshPetugas = refreshPetugas;

    function showPetugasModal(index = null) {
        const existing = index !== null && index >= 0 ? petugasData[index] : null;
        const title = existing ? '✏️ Edit Petugas' : '➕ Tambah Petugas';
        const modalHtml = `
            <div class="modal-overlay" id="petugasModal">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="mb-3"><label>Username <span class="text-danger">*</span></label><input class="form-control" id="ptUsername" value="${existing?.Username || ''}" ${existing ? 'disabled' : ''} placeholder="Username"></div>
                    <div class="mb-3"><label>Nama <span class="text-danger">*</span></label><input class="form-control" id="ptNama" value="${existing?.Nama || ''}" placeholder="Nama lengkap"></div>
                    <div class="mb-3"><label>PIN ${existing ? '(kosongkan jika tidak berubah)' : '<span class="text-danger">*</span>'}</label><input type="password" class="form-control" id="ptPin" placeholder="${existing ? 'Min 4 digit' : 'Min 4 digit'}" minlength="4" maxlength="6"></div>
                    <div class="mb-3"><label>Role</label><select class="form-select" id="ptRole"><option value="admin" ${existing?.Role === 'admin' ? 'selected' : ''}>Admin</option><option value="petugas" ${existing?.Role === 'petugas' ? 'selected' : ''}>Petugas</option></select></div>
                    <div class="mb-3"><label>Status</label><select class="form-select" id="ptStatus"><option value="Aktif" ${(existing?.Status || 'Aktif') === 'Aktif' ? 'selected' : ''}>Aktif</option><option value="Nonaktif" ${existing?.Status === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option></select></div>
                    <div class="mb-3"><label>Foto (opsional)</label><input type="file" accept="image/*" class="form-control" id="ptFoto"></div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary rounded-pill px-4" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary rounded-pill px-4" onclick="savePetugas(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showPetugasModal = showPetugasModal;

    async function savePetugas(index) {
        const username = document.getElementById('ptUsername').value.trim();
        const nama = document.getElementById('ptNama').value.trim();
        const pin = document.getElementById('ptPin').value;
        const role = document.getElementById('ptRole').value;
        const status = document.getElementById('ptStatus').value;
        const fotoInput = document.getElementById('ptFoto');

        if (!username || !nama) {
            showToast('Username dan Nama wajib diisi.', 'error');
            return;
        }
        if (index === null && !pin) {
            showToast('PIN wajib diisi untuk petugas baru.', 'error');
            return;
        }

        let foto = '';
        if (fotoInput.files && fotoInput.files[0]) {
            if (fotoInput.files[0].size > 500000) {
                showToast('Ukuran foto maksimal 500KB.', 'error');
                return;
            }
            foto = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(fotoInput.files[0]);
            });
        } else if (index !== null && petugasData[index]?.Foto) {
            foto = petugasData[index].Foto;
        }

        const data = { username, nama, role, status };
        if (pin) data.pin = pin;
        if (foto) data.foto = foto;

        const btn = document.querySelector('#petugasModal .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            let res;
            if (index !== null && index >= 0) {
                res = await API.updatePetugas(data);
            } else {
                res = await API.addPetugas(data);
            }
            if (res.status === 'ok') {
                closeModal();
                await refreshPetugas(true);
                showToast(res.message, 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal menyimpan data.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i> Simpan';
        }
    }
    window.savePetugas = savePetugas;

    async function toggleStatusPetugas(index) {
        const p = petugasData[index];
        if (!p) return;
        const newStatus = (p.Status === 'Aktif' || !p.Status) ? 'Nonaktif' : 'Aktif';
        if (!confirm(`Ubah status ${p.Nama} menjadi ${newStatus}?`)) return;
        const res = await API.updatePetugas({ username: p.Username, status: newStatus });
        if (res.status === 'ok') {
            await refreshPetugas(true);
            showToast(`Status ${p.Nama} diubah menjadi ${newStatus}`, 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.toggleStatusPetugas = toggleStatusPetugas;

    async function deletePetugas(index) {
        const p = petugasData[index];
        if (!p) return;
        if (!confirm(`Hapus petugas ${p.Nama} (@${p.Username})?`)) return;
        const res = await API.deletePetugas(p.Username);
        if (res.status === 'ok') {
            await refreshPetugas(true);
            showToast('Petugas dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.deletePetugas = deletePetugas;

    // ============================================================
    //  BAGIAN 8: WALI_ASUH.JS
    // ============================================================

    let waliData = [];
    let waliFiltered = [];
    let selectedWaliIds = new Set();

    function renderWaliAsuh(container) {
        const cached = getCachedData();
        if (cached?.waliAsuh) {
            waliData = cached.waliAsuh;
            waliFiltered = [...waliData];
        }
        const statusOptions = ['Aktif', 'Nonaktif'];
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-users-cog me-2" style="color:#0d6efd;"></i>Wali Asuh <span class="badge bg-secondary rounded-pill">${waliData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showWaliModal(null)"><i class="fas fa-plus"></i> Tambah</button>
                    <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="syncWaliCount()"><i class="fas fa-sync-alt me-1"></i> Sync Count</button>
                    <button class="btn btn-sm btn-danger rounded-pill" onclick="exportPDFWali()"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-sm btn-success rounded-pill" onclick="exportCSVWali()"><i class="fas fa-download"></i> CSV</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" id="btnDeleteSelectedWali" onclick="deleteSelectedWali()" disabled><i class="fas fa-trash-alt me-1"></i> Hapus (<span id="selectedCountWali">0</span>)</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshWali(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <input type="text" class="form-control form-control-sm" id="searchWali" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterWali()">
                    <select class="form-select form-select-sm" id="filterStatusWali" style="width:120px" onchange="applyFilterWali()">
                        <option value="">Semua Status</option>
                        ${statusOptions.map(s => `<option>${s}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterWali()">Reset</button>
                    <span class="small text-muted ms-2" id="infoCountWali">Menampilkan ${waliFiltered.length} dari ${waliData.length} entri</span>
                </div>
            </div>
            <div class="card-modern p-0"><div id="waliTableContainer"></div></div>
        `;
        applyFilterWali();
        updateDeleteButtonWali();
    }
    window.renderWaliAsuh = renderWaliAsuh;

    async function refreshWali(silent = false) {
        if (!silent) showToast('Memperbarui data wali asuh...', 'info');
        try {
            const res = await API.listWaliAsuh();
            if (res.status === 'success') {
                waliData = res.data;
                const cached = getCachedData() || {};
                cached.waliAsuh = waliData;
                setCachedData(cached);
                applyFilterWali();
                if (!silent) showToast(`✅ Data wali asuh diperbarui (${waliData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshWali = refreshWali;

    function applyFilterWali() {
        const q = (document.getElementById('searchWali')?.value || '').toLowerCase().trim();
        const status = document.getElementById('filterStatusWali')?.value || '';
        waliFiltered = waliData.filter(w =>
            (!q || (w.Nama||'').toLowerCase().includes(q) || (w.Nomor_HP||'').toLowerCase().includes(q) || (w.Alamat||'').toLowerCase().includes(q)) &&
            (!status || (w.Status||'Aktif') === status)
        );
        for (const id of selectedWaliIds) {
            if (!waliFiltered.some(w => String(w.ID) === id)) selectedWaliIds.delete(id);
        }
        renderTableWali();
        updateDeleteButtonWali();
        const info = document.getElementById('infoCountWali');
        if (info) info.textContent = `Menampilkan ${waliFiltered.length} dari ${waliData.length} entri`;
    }
    window.applyFilterWali = applyFilterWali;

    function resetFilterWali() {
        document.getElementById('searchWali').value = '';
        document.getElementById('filterStatusWali').value = '';
        applyFilterWali();
    }
    window.resetFilterWali = resetFilterWali;

    function renderTableWali() {
        const allChecked = waliFiltered.length > 0 && waliFiltered.every(w => selectedWaliIds.has(String(w.ID)));
        let rows = '';
        waliFiltered.forEach((w, i) => {
            const realIdx = waliData.indexOf(w);
            const statusBadge = (w.Status||'Aktif') === 'Aktif' ? 'bg-success' : 'bg-secondary';
            rows += `<tr>
                <td>${i+1}</td>
                <td><input type="checkbox" ${selectedWaliIds.has(String(w.ID))?'checked':''} onchange="toggleSelectWali('${String(w.ID)}', this.checked)"></td>
                <td><strong>${w.Nama||'-'}</strong></td>
                <td>${w.Nomor_HP||'-'}</td>
                <td>${w.Alamat||'-'}</td>
                <td><span class="badge badge-count" style="background:#8b5cf6;color:#fff;border-radius:50px;padding:2px 10px;font-size:0.75rem;">${w.Jumlah_Murid_Asuh||0}</span></td>
                <td><span class="badge ${statusBadge}">${w.Status||'Aktif'}</span></td>
                <td>${w.Keterangan||'-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary p-1" onclick="showWaliModal(${realIdx})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1" onclick="deleteWaliSingle(${realIdx})"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="9" class="text-center py-3 text-muted">Tidak ada data wali asuh</td></tr>';

        document.getElementById('waliTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;">No</th>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllWali(this.checked)"></th>
                            <th>Nama</th><th>Nomor HP</th><th>Alamat</th><th>Jumlah Murid</th><th>Status</th><th>Keterangan</th><th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableWali = renderTableWali;

    function toggleSelectAllWali(checked) {
        if (checked) waliFiltered.forEach(w => selectedWaliIds.add(String(w.ID)));
        else selectedWaliIds.clear();
        renderTableWali();
        updateDeleteButtonWali();
    }
    window.toggleSelectAllWali = toggleSelectAllWali;

    function toggleSelectWali(id, checked) {
        if (checked) selectedWaliIds.add(id);
        else selectedWaliIds.delete(id);
        updateDeleteButtonWali();
    }
    window.toggleSelectWali = toggleSelectWali;

    function updateDeleteButtonWali() {
        const btn = document.getElementById('btnDeleteSelectedWali');
        const cnt = document.getElementById('selectedCountWali');
        if (btn) btn.disabled = selectedWaliIds.size === 0;
        if (cnt) cnt.textContent = selectedWaliIds.size;
    }
    window.updateDeleteButtonWali = updateDeleteButtonWali;

    function showWaliModal(index = null) {
        const existing = index !== null && index >= 0 ? waliData[index] : null;
        const title = existing ? '✏️ Edit Wali Asuh' : '➕ Tambah Wali Asuh';
        const modalHtml = `
            <div class="modal-overlay" id="waliModal">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"></button>
                    </div>
                    <div class="mb-3"><label>Nama Wali Asuh <span class="text-danger">*</span></label><input class="form-control" id="wmNama" value="${existing?.Nama||''}" placeholder="Nama lengkap"></div>
                    <div class="mb-3"><label>Nomor HP</label><input class="form-control" id="wmNomorHP" value="${existing?.Nomor_HP||''}" placeholder="08xxxx"></div>
                    <div class="mb-3"><label>Alamat</label><input class="form-control" id="wmAlamat" value="${existing?.Alamat||''}" placeholder="Alamat lengkap"></div>
                    <div class="mb-3"><label>Jumlah Murid Asuh (Otomatis)</label><input type="number" class="form-control" id="wmJumlah" value="${existing?.Jumlah_Murid_Asuh||0}" readonly disabled style="background:#f8f9fa;"><small class="text-muted">Terhitung otomatis dari data peserta.</small></div>
                    <div class="mb-3"><label>Status</label><select class="form-select" id="wmStatus"><option value="Aktif" ${(existing?.Status||'Aktif')==='Aktif'?'selected':''}>Aktif</option><option value="Nonaktif" ${existing?.Status==='Nonaktif'?'selected':''}>Nonaktif</option></select></div>
                    <div class="mb-3"><label>Keterangan</label><textarea class="form-control" id="wmKeterangan" rows="2" placeholder="Catatan tambahan">${existing?.Keterangan||''}</textarea></div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary" onclick="saveWali(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showWaliModal = showWaliModal;

    async function saveWali(index) {
        const nama = document.getElementById('wmNama').value.trim();
        if (!nama) {
            showToast('Nama wali asuh wajib diisi.', 'error');
            return;
        }
        const data = {
            nama: nama,
            nomor_hp: document.getElementById('wmNomorHP').value.trim(),
            alamat: document.getElementById('wmAlamat').value.trim(),
            jumlah_murid: parseInt(document.getElementById('wmJumlah').value) || 0,
            status: document.getElementById('wmStatus').value,
            keterangan: document.getElementById('wmKeterangan').value.trim()
        };
        if (index !== null && index >= 0) data.id = waliData[index].ID;
        const btn = document.querySelector('#waliModal .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            let res;
            if (index !== null && index >= 0) {
                res = await API.updateWaliAsuh(data);
            } else {
                res = await API.addWaliAsuh(data);
            }
            if (res.status === 'ok') {
                closeModal();
                await refreshWali(true);
                showToast(res.message, 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('Gagal menyimpan data.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i> Simpan';
        }
    }
    window.saveWali = saveWali;

    async function deleteWaliSingle(index) {
        const w = waliData[index];
        if (!w) return;
        if (!confirm(`Hapus wali asuh ${w.Nama}?`)) return;
        const res = await API.deleteWaliAsuh(w.ID);
        if (res.status === 'ok') {
            await refreshWali(true);
            showToast('✅ Wali asuh dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.deleteWaliSingle = deleteWaliSingle;

    async function deleteSelectedWali() {
        if (selectedWaliIds.size === 0) return;
        if (!confirm(`Hapus ${selectedWaliIds.size} wali asuh terpilih?`)) return;
        let deleted = 0;
        for (const id of selectedWaliIds) {
            const res = await API.deleteWaliAsuh(id);
            if (res.status === 'ok') deleted++;
        }
        selectedWaliIds.clear();
        await refreshWali(true);
        showToast(`✅ ${deleted} wali asuh dihapus.`, 'success');
    }
    window.deleteSelectedWali = deleteSelectedWali;

    async function syncWaliCount() {
        if (!confirm('Sinkronkan jumlah murid dari data peserta?')) return;
        showToast('🔄 Menghitung ulang jumlah murid...', 'info');
        try {
            const res = await API.syncWaliCount();
            if (res.status === 'ok') {
                await refreshWali(true);
                showToast(`✅ ${res.message}`, 'success');
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('❌ Gagal sync.', 'error');
        }
    }
    window.syncWaliCount = syncWaliCount;

    function exportPDFWali() {
        if (!waliFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        const html = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3>SEKOLAH RAKYAT MENENGAH ATAS 19 BANTUL</h3>
                <p>Sentra Terpadu Prof. Dr. Soeharso, Sonosewu</p>
                <hr><h4>DATA WALI ASUH</h4>
                <p>Dicetak: ${tanggalCetak}</p>
            </div>
            <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead><tr><th>No</th><th>Nama</th><th>Nomor HP</th><th>Alamat</th><th>Jumlah Murid</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody>${waliFiltered.map((w, i) => `<tr><td>${i+1}</td><td>${w.Nama||'-'}</td><td>${w.Nomor_HP||'-'}</td><td>${w.Alamat||'-'}</td><td>${w.Jumlah_Murid_Asuh||0}</td><td>${w.Status||'Aktif'}</td><td>${w.Keterangan||'-'}</td></tr>`).join('')}</tbody>
            </table>`;
        html2pdf().set({
            filename: `wali_asuh_${now.toISOString().slice(0,10)}.pdf`,
            margin: 10,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(html).save();
    }
    window.exportPDFWali = exportPDFWali;

    function exportCSVWali() {
        if (!waliFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const rows = [['Nama','Nomor HP','Alamat','Jumlah Murid','Status','Keterangan']];
        waliFiltered.forEach(w => rows.push([w.Nama||'', w.Nomor_HP||'', w.Alamat||'', w.Jumlah_Murid_Asuh||0, w.Status||'Aktif', w.Keterangan||'']));
        const csv = rows.map(r=>r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wali_asuh_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        showToast('✅ CSV berhasil diunduh.', 'success');
    }
    window.exportCSVWali = exportCSVWali;

    // ============================================================
    //  BAGIAN 9: ALUMNI.JS
    // ============================================================

    let alumniData = [];
    let alumniFiltered = [];

    function renderAlumni(container) {
        const cached = getCachedData();
        if (cached?.alumni) {
            alumniData = cached.alumni;
            alumniFiltered = [...alumniData];
        }
        const angkatanList = [...new Set(alumniData.map(a => a.Angkatan).filter(Boolean))];
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-graduation-cap me-2" style="color:#0d6efd;"></i>Data Alumni <span class="badge bg-secondary rounded-pill">${alumniData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-danger rounded-pill" onclick="exportPDFAlumni()"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-sm btn-success rounded-pill" onclick="exportCSVAlumni()"><i class="fas fa-download"></i> CSV</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshAlumni(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <input type="text" class="form-control form-control-sm" id="searchAlumni" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterAlumni()">
                    <select class="form-select form-select-sm" id="filterAngkatanAlumni" style="width:130px" onchange="applyFilterAlumni()">
                        <option value="">Semua Angkatan</option>
                        ${angkatanList.map(a => `<option>${a}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterAlumni()">Reset</button>
                    <span class="small text-muted ms-2" id="infoCountAlumni">Menampilkan ${alumniFiltered.length} dari ${alumniData.length} entri</span>
                </div>
            </div>
            <div class="card-modern p-0"><div id="alumniTableContainer"></div></div>
        `;
        applyFilterAlumni();
    }
    window.renderAlumni = renderAlumni;

    async function refreshAlumni(silent = false) {
        if (!silent) showToast('Memperbarui data alumni...', 'info');
        try {
            const res = await API.listAlumni();
            if (res.status === 'success') {
                alumniData = res.data;
                const cached = getCachedData() || {};
                cached.alumni = alumniData;
                setCachedData(cached);
                applyFilterAlumni();
                if (!silent) showToast(`✅ Data alumni diperbarui (${alumniData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshAlumni = refreshAlumni;

    function applyFilterAlumni() {
        const q = (document.getElementById('searchAlumni')?.value || '').toLowerCase().trim();
        const angkatan = document.getElementById('filterAngkatanAlumni')?.value || '';
        alumniFiltered = alumniData.filter(a =>
            (!q || (a.Nama||'').toLowerCase().includes(q) || (a.Kode||'').toLowerCase().includes(q)) &&
            (!angkatan || (a.Angkatan||'') === angkatan)
        );
        renderTableAlumni();
        const info = document.getElementById('infoCountAlumni');
        if (info) info.textContent = `Menampilkan ${alumniFiltered.length} dari ${alumniData.length} entri`;
    }
    window.applyFilterAlumni = applyFilterAlumni;

    function resetFilterAlumni() {
        document.getElementById('searchAlumni').value = '';
        document.getElementById('filterAngkatanAlumni').value = '';
        applyFilterAlumni();
    }
    window.resetFilterAlumni = resetFilterAlumni;

    function renderTableAlumni() {
        let rows = '';
        alumniFiltered.forEach((a, i) => {
            rows += `<tr>
                <td>${i+1}</td>
                <td><code>${String(a.Kode||'').slice(-4)}</code></td>
                <td><strong>${a.Nama||'-'}</strong></td>
                <td>${a.Jenis_Kelamin||a.jk||'-'}</td>
                <td>${a.Agama||'-'}</td>
                <td>${a.Asal||'-'}</td>
                <td>${a.Rombel||'-'}</td>
                <td>${a.Angkatan||'-'}</td>
                <td>${a.Tanggal_Lulus||'-'}</td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="9" class="text-center py-3 text-muted">Tidak ada data alumni</td></tr>';

        document.getElementById('alumniTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr><th style="width:30px;">No</th><th>Kode</th><th>Nama</th><th>JK</th><th>Agama</th><th>Asal</th><th>Rombel</th><th>Angkatan</th><th>Tanggal Lulus</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableAlumni = renderTableAlumni;

    function exportPDFAlumni() {
        if (!alumniFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        const html = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3>SEKOLAH RAKYAT MENENGAH ATAS 19 BANTUL</h3>
                <p>Sentra Terpadu Prof. Dr. Soeharso, Sonosewu</p>
                <hr><h4>DAFTAR ALUMNI</h4>
                <p>Dicetak: ${tanggalCetak}</p>
            </div>
            <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead><tr><th>No</th><th>Kode</th><th>Nama</th><th>JK</th><th>Agama</th><th>Asal</th><th>Rombel</th><th>Angkatan</th><th>Tanggal Lulus</th></tr></thead>
                <tbody>${alumniFiltered.map((a, i) => `<tr><td>${i+1}</td><td>${a.Kode}</td><td>${a.Nama}</td><td>${a.Jenis_Kelamin||a.jk||''}</td><td>${a.Agama||''}</td><td>${a.Asal||''}</td><td>${a.Rombel||''}</td><td>${a.Angkatan||''}</td><td>${a.Tanggal_Lulus||''}</td></tr>`).join('')}</tbody>
            </table>`;
        html2pdf().set({
            filename: `alumni_${now.toISOString().slice(0,10)}.pdf`,
            margin: 10,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(html).save();
    }
    window.exportPDFAlumni = exportPDFAlumni;

    function exportCSVAlumni() {
        if (!alumniFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const rows = [['Kode','Nama','JK','Agama','Asal','Rombel','Angkatan','Tanggal Lulus']];
        alumniFiltered.forEach(a => rows.push([String(a.Kode||''), a.Nama||'', a.Jenis_Kelamin||a.jk||'', a.Agama||'', a.Asal||'', a.Rombel||'', a.Angkatan||'', a.Tanggal_Lulus||'']));
        const csv = rows.map(r=>r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumni_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        showToast('✅ CSV berhasil diunduh.', 'success');
    }
    window.exportCSVAlumni = exportCSVAlumni;

    // ============================================================
    //  BAGIAN 10: LAPORAN.JS
    // ============================================================

    let laporanPesertaData = [];
    let laporanAbsensiData = [];
    let laporanIzinData = [];
    let laporanJadwalData = [];
    let laporanSummaryData = [];
    let laporanFiltered = [];

    function renderLaporan(container) {
        const cached = getCachedData();
        if (cached?.peserta) {
            laporanPesertaData = cached.peserta.map(p => ({ ...p, Kode: String(p.Kode || '') }));
        }
        if (cached?.absensi) {
            laporanAbsensiData = cached.absensi;
        }
        if (cached?.izin) {
            laporanIzinData = cached.izin;
        }
        if (cached?.jadwal) {
            laporanJadwalData = cached.jadwal;
        }
        const rombelList = [...new Set(laporanPesertaData.map(p => p.Rombel).filter(Boolean))];
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-chart-pie me-2" style="color:#0d6efd;"></i>Laporan Summary Siswa</h4>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="loadLaporanData(); applyFilterLaporan();"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="filter-group">
                    <label>Tanggal Mulai:</label>
                    <input type="date" class="form-control form-control-sm" id="tglMulaiLaporan" style="width:140px">
                    <label>Tanggal Selesai:</label>
                    <input type="date" class="form-control form-control-sm" id="tglSelesaiLaporan" style="width:140px">
                    <select class="form-select form-select-sm" id="filterStatusLaporan" style="width:120px">
                        <option value="">Semua Status</option>
                        <option>Hadir</option>
                        <option>Izin</option>
                        <option>Tidak Berangkat</option>
                    </select>
                    <select class="form-select form-select-sm" id="filterRombelLaporan" style="width:130px">
                        <option value="">Semua Rombel</option>
                        ${rombelList.map(r => `<option>${r}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-primary rounded-pill" onclick="applyFilterLaporan()"><i class="fas fa-search"></i> Tampilkan</button>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterLaporan()">Reset</button>
                    <button class="btn btn-sm btn-info rounded-pill" onclick="previewLaporanPDF()"><i class="fas fa-eye"></i> Preview & Cetak PDF</button>
                </div>
            </div>
            <div class="summary-card" style="background:#fff;border-radius:12px;padding:16px;margin-bottom:15px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;gap:20px;flex-wrap:wrap;">
                <div><strong>Total Siswa:</strong> <span id="totalSiswaLaporan">0</span></div>
                <div><strong>Total Hadir:</strong> <span id="totalHadirLaporan">0</span></div>
                <div><strong>Total Izin:</strong> <span id="totalIzinLaporan">0</span></div>
                <div><strong>Total Tidak Berangkat:</strong> <span id="totalTidakLaporan">0</span></div>
                <div><strong>Total Sakit:</strong> <span id="totalSakitLaporan">0</span></div>
            </div>
            <div class="card-modern p-0"><div id="laporanTableContainer"></div></div>
        `;
    }
    window.renderLaporan = renderLaporan;

    async function loadLaporanData() {
        try {
            const [p, a, i, j] = await Promise.all([
                API.listPeserta(),
                API.listAbsensi('', '', 1, 1000),
                API.listIzin(),
                API.getJadwal()
            ]);
            if (p.status === 'success') laporanPesertaData = p.data.map(ps => ({ ...ps, Kode: String(ps.Kode || '') }));
            if (a.status === 'success') laporanAbsensiData = a.data;
            if (i.status === 'success') laporanIzinData = i.data;
            if (j.status === 'success') laporanJadwalData = j.data;
            const cached = getCachedData() || {};
            cached.peserta = laporanPesertaData;
            cached.absensi = laporanAbsensiData;
            cached.izin = laporanIzinData;
            cached.jadwal = laporanJadwalData;
            setCachedData(cached);
            showToast('Data laporan diperbarui', 'success');
        } catch (e) {
            showToast('Gagal memuat data', 'error');
        }
    }
    window.loadLaporanData = loadLaporanData;

    function buildLaporanSummary(tglMulai, tglSelesai) {
        const activePeserta = laporanPesertaData.filter(p => p.Keterangan === 'Aktif');
        const start = tglMulai ? new Date(tglMulai) : null;
        const end = tglSelesai ? new Date(tglSelesai) : null;

        let filteredAbsensi = laporanAbsensiData;
        if (start && end) {
            filteredAbsensi = laporanAbsensiData.filter(a => {
                const d = new Date(a.Tanggal);
                return d >= start && d <= end;
            });
        }

        laporanSummaryData = activePeserta.map(p => {
            const kode = String(p.Kode);
            const absensiPeserta = filteredAbsensi.filter(a => String(a.Kode) === kode);
            const hadir = absensiPeserta.filter(a => a.Status === 'Hadir').length;
            const tidakBerangkat = absensiPeserta.filter(a => a.Status === 'Tidak Berangkat').length;
            const izinAbsensi = absensiPeserta.filter(a => a.Status === 'Izin').length;
            const izinManual = laporanIzinData.filter(iz => String(iz.Kode_Peserta) === kode).length;
            const totalIzin = izinAbsensi + izinManual;
            const sakit = absensiPeserta.filter(a => a.Status === 'Sakit').length;

            let totalSesi = 0;
            if (tglMulai && tglSelesai) {
                const agama = p.Agama || 'Islam';
                const sesiAgama = laporanJadwalData.filter(j => j.agama === agama);
                const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                totalSesi = sesiAgama.length * diffDays;
            }
            const persenHadir = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0;

            return {
                kode: kode,
                nama: p.Nama || '-',
                agama: p.Agama || '-',
                rombel: p.Rombel || '-',
                hadir: hadir,
                tidakBerangkat: tidakBerangkat,
                izin: totalIzin,
                sakit: sakit,
                totalSesi: totalSesi,
                persenHadir: persenHadir,
                waliAsuh1: p.Wali_Asuh_1 || '-',
                waliAsuh2: p.Wali_Asuh_2 || '-'
            };
        });
    }

    function applyFilterLaporan() {
        const tglMulai = document.getElementById('tglMulaiLaporan').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporan').value;
        const status = document.getElementById('filterStatusLaporan')?.value || '';
        const rombel = document.getElementById('filterRombelLaporan')?.value || '';

        if (!tglMulai || !tglSelesai) {
            showToast('Pilih rentang tanggal terlebih dahulu.', 'warning');
            return;
        }

        buildLaporanSummary(tglMulai, tglSelesai);
        laporanFiltered = laporanSummaryData.filter(s =>
            (!status || s.status === status) &&
            (!rombel || s.rombel === rombel)
        );
        renderLaporanSummary();
    }
    window.applyFilterLaporan = applyFilterLaporan;

    function resetFilterLaporan() {
        document.getElementById('tglMulaiLaporan').value = '';
        document.getElementById('tglSelesaiLaporan').value = '';
        document.getElementById('filterStatusLaporan').value = '';
        document.getElementById('filterRombelLaporan').value = '';
        laporanFiltered = [];
        renderLaporanSummary();
    }
    window.resetFilterLaporan = resetFilterLaporan;

    function renderLaporanSummary() {
        const totalHadir = laporanFiltered.reduce((sum, s) => sum + s.hadir, 0);
        const totalTidak = laporanFiltered.reduce((sum, s) => sum + s.tidakBerangkat, 0);
        const totalIzin = laporanFiltered.reduce((sum, s) => sum + s.izin, 0);
        const totalSakit = laporanFiltered.reduce((sum, s) => sum + s.sakit, 0);
        const totalPelanggaran = laporanFiltered.reduce((sum, s) => sum + (s.pelanggaran || 0), 0);

        let rows = '';
        laporanFiltered.forEach((s, i) => {
            rows += `<tr>
                <td>${i+1}</td>
                <td><code>${s.kode.slice(-4)}</code></td>
                <td><strong>${s.nama}</strong></td>
                <td>${s.agama}</td>
                <td>${s.rombel}</td>
                <td><span class="badge-status hadir">${s.hadir}</span></td>
                <td><span class="badge-status izin">${s.izin}</span></td>
                <td><span class="badge-status tidak">${s.tidakBerangkat}</span></td>
                <td><span class="badge-status sakit">${s.sakit}</span></td>
                <td>${s.persenHadir}%</td>
                <td>${s.waliAsuh1}</td>
                <td>${s.waliAsuh2}</td>
            </tr>`;
        });

        document.getElementById('laporanTableContainer').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>No</th><th>Kode</th><th>Nama</th><th>Agama</th><th>Rombel</th>
                            <th>Hadir</th><th>Izin</th><th>Tidak Berangkat</th><th>Sakit</th><th>% Hadir</th>
                            <th>Wali Asuh 1</th><th>Wali Asuh 2</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        document.getElementById('totalSiswaLaporan').textContent = laporanFiltered.length;
        document.getElementById('totalHadirLaporan').textContent = totalHadir;
        document.getElementById('totalIzinLaporan').textContent = totalIzin;
        document.getElementById('totalTidakLaporan').textContent = totalTidak;
        document.getElementById('totalSakitLaporan').textContent = totalSakit;
    }
    window.renderLaporanSummary = renderLaporanSummary;

    function previewLaporanPDF() {
        if (laporanFiltered.length === 0) {
            showToast('Tidak ada data untuk ditampilkan.', 'warning');
            return;
        }
        const tglMulai = document.getElementById('tglMulaiLaporan').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporan').value;
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        const html = `
            <div style="font-family:Arial,sans-serif;padding:20px;">
                <div style="text-align:center;border-bottom:2px solid #0d6efd;padding-bottom:10px;margin-bottom:20px;">
                    <h2 style="margin:0;color:#0d6efd;">SRMA 19 BANTUL</h2>
                    <p style="margin:2px 0;font-size:12px;color:#475569;">Sentra Terpadu Prof. Dr. Soeharso, Sonosewu, Bantul</p>
                    <h4 style="margin:8px 0;">LAPORAN SUMMARY SISWA</h4>
                    <p style="font-size:12px;color:#6c757d;">Periode: ${tglMulai} s.d. ${tglSelesai} | Dicetak: ${tanggalCetak}</p>
                </div>
                <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:10px;">
                    <thead><tr>
                        <th>No</th><th>Kode</th><th>Nama</th><th>Agama</th><th>Rombel</th>
                        <th>Hadir</th><th>Izin</th><th>Tidak</th><th>Sakit</th><th>% Hadir</th>
                        <th>Wali 1</th><th>Wali 2</th>
                    </tr></thead>
                    <tbody>
                        ${laporanFiltered.map((s, i) => `
                            <tr>
                                <td>${i+1}</td>
                                <td>${s.kode.slice(-4)}</td>
                                <td>${s.nama}</td>
                                <td>${s.agama}</td>
                                <td>${s.rombel}</td>
                                <td>${s.hadir}</td>
                                <td>${s.izin}</td>
                                <td>${s.tidakBerangkat}</td>
                                <td>${s.sakit}</td>
                                <td>${s.persenHadir}%</td>
                                <td>${s.waliAsuh1}</td>
                                <td>${s.waliAsuh2}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top:20px;font-size:10px;color:#6c757d;text-align:center;">
                    Total Siswa: ${laporanFiltered.length} | Total Hadir: ${laporanFiltered.reduce((s, x) => s + x.hadir, 0)} | 
                    Total Izin: ${laporanFiltered.reduce((s, x) => s + x.izin, 0)} | 
                    Total Tidak Berangkat: ${laporanFiltered.reduce((s, x) => s + x.tidakBerangkat, 0)} | 
                    Total Sakit: ${laporanFiltered.reduce((s, x) => s + x.sakit, 0)}
                </div>
            </div>
        `;

        const previewHtml = `
            <div class="preview-modal show" id="laporanPreviewModal">
                <div class="preview-content">
                    <div class="preview-header">
                        <h4>👁️ Preview Laporan Summary</h4>
                        <div class="preview-actions">
                            <button class="btn btn-sm btn-success" onclick="downloadLaporanPDF()"><i class="fas fa-download me-1"></i> Download PDF</button>
                            <button class="btn btn-sm btn-secondary" onclick="closePreviewLaporan()"><i class="fas fa-times"></i> Tutup</button>
                        </div>
                    </div>
                    <div id="previewBodyLaporan">${html}</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', previewHtml);
        window.laporanPreviewHtml = html;
    }
    window.previewLaporanPDF = previewLaporanPDF;

    function closePreviewLaporan() {
        const modal = document.getElementById('laporanPreviewModal');
        if (modal) modal.remove();
    }
    window.closePreviewLaporan = closePreviewLaporan;

    async function downloadLaporanPDF() {
        if (!window.laporanPreviewHtml) {
            showToast('Tidak ada data preview.', 'error');
            return;
        }
        const tglMulai = document.getElementById('tglMulaiLaporan').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporan').value;
        const filename = `laporan_summary_${tglMulai}_${tglSelesai}.pdf`;
        const element = document.createElement('div');
        element.innerHTML = window.laporanPreviewHtml;
        document.body.appendChild(element);
        try {
            await html2pdf().set({
                filename: filename,
                margin: 10,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).from(element).save();
            showToast('✅ Laporan berhasil diunduh.', 'success');
            closePreviewLaporan();
        } catch (e) {
            showToast('❌ Gagal mengunduh: ' + e.message, 'error');
        } finally {
            document.body.removeChild(element);
        }
    }
    window.downloadLaporanPDF = downloadLaporanPDF;

    // ============================================================
    //  BAGIAN 11: ABSENSI_QR.JS (Scan QR langsung untuk Admin)
    // ============================================================

    let html5QrCodeAdmin = null;
    let isScanningAdmin = false;
    let scanCooldownAdmin = false;

    function renderAbsensiQR(container) {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0"><i class="fas fa-qrcode me-2" style="color:#0d6efd;"></i>Scan QR Absensi</h4>
                <span class="text-muted small">Arahkan kamera ke QR Code kartu peserta</span>
            </div>
            <div class="card-modern p-3">
                <div id="qrScannerContainer" style="width:100%;max-width:500px;margin:0 auto;">
                    <div id="reader" style="width:100%;border-radius:10px;overflow:hidden;border:2px dashed #d0d0d0;background:#f8f8f8;min-height:220px;"></div>
                    <div class="mt-3 text-center">
                        <button class="btn btn-primary rounded-pill" id="btnStartScanAdmin" onclick="startScanAdmin()">
                            <i class="fas fa-camera me-2"></i>Mulai Scan
                        </button>
                        <button class="btn btn-danger rounded-pill d-none" id="btnStopScanAdmin" onclick="stopScanAdmin()">
                            <i class="fas fa-stop me-2"></i>Hentikan
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-modern p-3 mt-3">
                <h6 class="fw-bold mb-2"><i class="fas fa-info-circle me-2"></i>Hasil Scan</h6>
                <div id="scanResultContainerAdmin" class="text-center text-muted">Belum ada hasil scan</div>
            </div>
        `;

        // Inisialisasi scanner (tampilkan instruksi)
        const reader = document.getElementById('reader');
        if (reader) reader.innerHTML = '<div class="text-center py-4 text-muted">Klik "Mulai Scan" untuk mengaktifkan kamera</div>';
    }
    window.renderAbsensiQR = renderAbsensiQR;

    async function startScanAdmin() {
        if (isScanningAdmin) return;
        const reader = document.getElementById('reader');
        if (!reader) return;
        reader.innerHTML = '';
        document.getElementById('btnStartScanAdmin').classList.add('d-none');
        document.getElementById('btnStopScanAdmin').classList.remove('d-none');
        try {
            html5QrCodeAdmin = new Html5Qrcode('reader');
            const config = { fps: 30, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 };
            await html5QrCodeAdmin.start({ facingMode: 'environment' }, config, onScanSuccessAdmin, () => {});
            isScanningAdmin = true;
            window.showToast('Kamera siap. Arahkan ke QR Code.', 'success');
        } catch (err) {
            window.showToast('Gagal mengakses kamera: ' + err.message, 'error');
            document.getElementById('btnStartScanAdmin').classList.remove('d-none');
            document.getElementById('btnStopScanAdmin').classList.add('d-none');
        }
    }
    window.startScanAdmin = startScanAdmin;

    async function stopScanAdmin() {
        if (!isScanningAdmin || !html5QrCodeAdmin) return;
        await html5QrCodeAdmin.stop();
        isScanningAdmin = false;
        document.getElementById('btnStartScanAdmin').classList.remove('d-none');
        document.getElementById('btnStopScanAdmin').classList.add('d-none');
        html5QrCodeAdmin.clear();
        html5QrCodeAdmin = null;
        document.getElementById('reader').innerHTML = '<div class="text-center py-4 text-muted">Klik "Mulai Scan" untuk mengaktifkan kamera</div>';
    }
    window.stopScanAdmin = stopScanAdmin;

    async function onScanSuccessAdmin(decodedText) {
        if (scanCooldownAdmin) return;
        scanCooldownAdmin = true;
        const code = decodedText.trim();
        try {
            const data = await API.searchPeserta(code);
            const resultContainer = document.getElementById('scanResultContainerAdmin');
            if (data.status === 'success') {
                resultContainer.innerHTML = `
                    <div class="alert alert-success">
                        <strong>${data.nama}</strong><br>
                        Kode: ${data.code}<br>
                        Agama: ${data.agama}<br>
                        Sesi: ${data.sesi_nama} (${data.dalam_sesi ? 'Dalam Sesi' : 'Luar Sesi'})
                    </div>
                    <button class="btn btn-success btn-sm rounded-pill mt-2" onclick="recordAbsensiAdmin('${data.code}', '${data.nama}', '${data.sesi}', '${data.sesi_nama}', '${data.agama}')">
                        <i class="fas fa-check-circle me-1"></i> Konfirmasi Absensi
                    </button>
                `;
            } else {
                resultContainer.innerHTML = `<div class="alert alert-danger">${data.message || 'Peserta tidak ditemukan'}</div>`;
            }
        } catch (e) {
            document.getElementById('scanResultContainerAdmin').innerHTML = '<div class="alert alert-danger">Gagal terhubung ke server</div>';
        } finally {
            setTimeout(() => { scanCooldownAdmin = false; }, 1500);
        }
    }

    async function recordAbsensiAdmin(code, nama, sesi, sesiNama, agama) {
        try {
            const result = await API.recordAbsensi(code, nama, sesi, sesiNama, window.currentUser?.nama || 'Admin', agama);
            const resultContainer = document.getElementById('scanResultContainerAdmin');
            if (result.status === 'recorded') {
                window.showToast('✅ Absensi tercatat', 'success');
                resultContainer.innerHTML = `<div class="alert alert-success">✅ Berhasil mencatat kehadiran <strong>${nama}</strong></div>`;
            } else if (result.status === 'already_recorded') {
                window.showToast('⚠️ Sudah tercatat sebelumnya', 'warning');
                resultContainer.innerHTML = `<div class="alert alert-warning">⚠️ ${nama} sudah tercatat di sesi ini</div>`;
            } else {
                window.showToast('❌ Gagal: ' + result.message, 'error');
                resultContainer.innerHTML = `<div class="alert alert-danger">❌ ${result.message}</div>`;
            }
        } catch (e) {
            window.showToast('❌ Gagal terhubung ke server', 'error');
        }
    }
    window.recordAbsensiAdmin = recordAbsensiAdmin;

    // ============================================================
    //  BAGIAN TERAKHIR: INISIALISASI (INIT)
    // ============================================================

    const user = Auth.getCurrentUser();
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = user.nama || 'Admin';
    if (roleEl) roleEl.textContent = user.role || 'admin';
    if (avatarEl) avatarEl.textContent = (user.nama || 'A').charAt(0).toUpperCase();

    const savedPage = localStorage.getItem(MENU_KEY);
    if (savedPage && savedPage !== 'dashboard') {
        updateMenuUI(savedPage);
        navigate(savedPage);
    } else {
        updateMenuUI('dashboard');
        navigate('dashboard');
    }

    // --- REFRESH PERIODIK ---
    setInterval(() => {
        const current = localStorage.getItem(MENU_KEY);
        if (current === 'dashboard' && typeof window.loadDashboardStats === 'function') {
            window.loadDashboardStats();
        }
    }, 30000);

    console.log('✅ All modules loaded successfully');

})();