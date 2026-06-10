// ============================================================
//  ALL_MODULES_PETUGAS.JS – Gabungan semua modul Dashboard Petugas
//  SRMA 19 Bantul
//  Versi: 5.3 – Force Render, Robust Init
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  BAGIAN 1: MAIN_PETUGAS.JS (Navigasi, Auth, Cache, Toast, dll.)
    // ============================================================

    // --- AUTH ---
    if (!Auth.requireAuth('login.html')) throw new Error('Silakan login.');
    const currentUser = Auth.getCurrentUser();
    if (currentUser.role !== 'petugas' && currentUser.role !== 'admin') {
        window.location.href = 'dashboard_admin.html';
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
    const MENU_KEY = 'srma19_petugas_active_menu';
    const CACHE_KEY = 'srma19_petugas_data';
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
            case 'dashboard': window.renderDashboardPetugas(container); break;
            case 'absensi': window.renderAbsensiPetugas(container); break;
            case 'izin': window.renderIzinPetugas(container); break;
            case 'jadwal': window.renderJadwalPetugas(container); break;
            case 'wali_asuh': window.renderWaliAsuhPetugas(container); break;
            case 'alumni': window.renderAlumniPetugas(container); break;
            case 'laporan': window.renderLaporanPetugas(container); break;
            case 'scan': window.renderScanQR(container); break;
            default: window.renderDashboardPetugas(container);
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

    // ============================================================
    //  HELPER: FILTER DATA BERDASARKAN MURID DAMPINGAN
    // ============================================================
    function getMuridDampingan(pesertaData, petugasNama) {
        if (!pesertaData || !petugasNama) return [];
        return pesertaData.filter(p =>
            (p.Wali_Asuh_1 && p.Wali_Asuh_1.trim() === petugasNama) ||
            (p.Wali_Asuh_2 && p.Wali_Asuh_2.trim() === petugasNama)
        );
    }

    function filterAbsensiByDampingan(absensiData, pesertaDampingan) {
        if (!absensiData || !pesertaDampingan) return [];
        const kodeSet = new Set(pesertaDampingan.map(p => String(p.Kode).trim()));
        return absensiData.filter(a => kodeSet.has(String(a.Kode).trim()));
    }

    function filterIzinByDampingan(izinData, pesertaDampingan) {
        if (!izinData || !pesertaDampingan) return [];
        const kodeSet = new Set(pesertaDampingan.map(p => String(p.Kode).trim()));
        return izinData.filter(i => kodeSet.has(String(i.Kode_Peserta).trim()));
    }

    // ============================================================
    //  BAGIAN 2: DASHBOARD_PETUGAS.JS (INSTANT LOAD dari Cache)
    // ============================================================

    function renderDashboardPetugas(container) {
        console.log('renderDashboardPetugas dipanggil');
        if (!container) {
            console.error('Container tidak ditemukan');
            return;
        }

        // Hapus konten lama
        container.innerHTML = '';

        const cached = getCachedData();
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';

        console.log('Cache:', cached);
        console.log('Petugas:', petugasNama);

        // Hitung murid dampingan dari cache
        let pesertaDampingan = [];
        let jumlahDampingan = 0;
        if (cached?.peserta) {
            pesertaDampingan = getMuridDampingan(cached.peserta, petugasNama);
            jumlahDampingan = pesertaDampingan.length;
        }

        // Filter absensi untuk murid dampingan
        let absensiDampingan = [];
        if (cached?.absensi) {
            absensiDampingan = filterAbsensiByDampingan(cached.absensi, pesertaDampingan);
        }

        // Filter izin untuk murid dampingan
        let izinDampingan = [];
        if (cached?.izin) {
            izinDampingan = filterIzinByDampingan(cached.izin, pesertaDampingan);
        }

        // Hitung Total Peserta (semua peserta aktif)
        const totalPeserta = cached?.peserta?.length || 0;

        // Hitung Hadir Hari Ini (dari data absensi dampingan)
        const today = new Date().toISOString().split('T')[0];
        const hadirHariIni = absensiDampingan.filter(a => a.Tanggal === today && a.Status === 'Hadir').length || 0;

        // Hitung Izin Hari Ini (dari data izin dampingan)
        const izinHariIni = izinDampingan.filter(i => i.Tanggal === today).length || 0;

        let statHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-tachometer-alt me-2" style="color:#0d6efd;"></i>Dashboard Petugas</h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-primary rounded-pill" onclick="refreshDashboardPetugas()">
                        <i class="fas fa-sync-alt me-1"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="stat-grid" id="statGrid">
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                    <div class="stat-value" id="totalPeserta">${totalPeserta}</div>
                    <div class="stat-label">Total Peserta</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-clipboard-check"></i></div>
                    <div class="stat-value" id="hadirHariIni">${hadirHariIni}</div>
                    <div class="stat-label">Hadir Hari Ini</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-file-medical-alt"></i></div>
                    <div class="stat-value" id="izinHariIni">${izinHariIni}</div>
                    <div class="stat-label">Izin Hari Ini</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange"><i class="fas fa-user-check"></i></div>
                    <div class="stat-value" id="jumlahDampingan">${jumlahDampingan}</div>
                    <div class="stat-label">Murid Dampingan</div>
                </div>
            </div>
            <div class="table-card">
                <div class="card-header">
                    <h6><i class="fas fa-clock me-2" style="color:#0d6efd;"></i>Absensi Hari Ini</h6>
                    <span class="small text-muted">Data real-time</span>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr><th>No</th><th>Jam</th><th>Kode</th><th>Nama</th><th>Sesi</th><th>Status</th></tr>
                        </thead>
                        <tbody id="recentAbsensiPetugas">
                            ${absensiDampingan.length > 0 ? 
                                absensiDampingan.slice(0, 10).map((a, i) => {
                                    const statusClass = a.Status === 'Hadir' ? 'hadir' : a.Status === 'Izin' ? 'izin' : a.Status === 'Sakit' ? 'sakit' : 'tidak';
                                    return `<tr>
                                        <td>${i+1}</td>
                                        <td>${a.Jam || '-'}</td>
                                        <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${(a.Kode||'').slice(-4)}</code></td>
                                        <td><strong>${a.Nama || '-'}</strong></td>
                                        <td class="small">${a.Sesi_Nama || '-'}</td>
                                        <td><span class="badge-status ${statusClass}">${a.Status || 'Hadir'}</span></td>
                                    </tr>`;
                                }).join('') : 
                                '<tr><td colspan="6" class="text-center py-3 text-muted">Belum ada data absensi</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = statHTML;

        // Refresh data dari server di background
        if (!cached) {
            loadDashboardPetugasStats();
        } else {
            setTimeout(() => {
                loadDashboardPetugasStats();
            }, 100);
        }
    }
    window.renderDashboardPetugas = renderDashboardPetugas;

    async function refreshDashboardPetugas() {
        showToast('Memperbarui data...', 'info');
        await loadDashboardPetugasStats(true);
        showToast('Data dashboard diperbarui', 'success');
    }
    window.refreshDashboardPetugas = refreshDashboardPetugas;

    async function loadDashboardPetugasStats(forceRefresh = false) {
        try {
            const [pesertaRes, absensiRes, izinRes] = await Promise.all([
                API.listPeserta(),
                API.listAbsensi('', '', 1, 10),
                API.listIzin()
            ]);
            const data = {
                peserta: pesertaRes.status === 'success' ? pesertaRes.data : [],
                absensi: absensiRes.status === 'success' ? absensiRes.data : [],
                izin: izinRes.status === 'success' ? izinRes.data : [],
                timestamp: Date.now()
            };
            setCachedData(data);
            updateStatsPetugas(data);
            updateTablePetugas(data.absensi || []);
        } catch (e) {
            console.error('Gagal refresh data dashboard petugas:', e);
            if (forceRefresh) {
                showToast('Gagal memperbarui data', 'error');
            }
        }
    }
    window.loadDashboardPetugasStats = loadDashboardPetugasStats;

    function updateStatsPetugas(data) {
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';
        const pesertaDampingan = getMuridDampingan(data.peserta, petugasNama);
        const jumlahDampingan = pesertaDampingan.length;

        const totalPeserta = data.peserta?.length || 0;
        const today = new Date().toISOString().split('T')[0];
        const hadirHariIni = data.absensi?.filter(a => a.Tanggal === today && a.Status === 'Hadir').length || 0;
        const izinHariIni = data.izin?.filter(i => i.Tanggal === today).length || 0;

        const el1 = document.getElementById('totalPeserta');
        const el2 = document.getElementById('hadirHariIni');
        const el3 = document.getElementById('izinHariIni');
        const el4 = document.getElementById('jumlahDampingan');
        if (el1) el1.textContent = totalPeserta;
        if (el2) el2.textContent = hadirHariIni;
        if (el3) el3.textContent = izinHariIni;
        if (el4) el4.textContent = jumlahDampingan;
    }
    window.updateStatsPetugas = updateStatsPetugas;

    function updateTablePetugas(absensi) {
        const tbody = document.getElementById('recentAbsensiPetugas');
        if (!tbody) return;
        if (!absensi || absensi.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Belum ada data absensi</td></tr>';
            return;
        }
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';
        const pesertaRes = getCachedData()?.peserta || [];
        const pesertaDampingan = getMuridDampingan(pesertaRes, petugasNama);
        const filteredAbsensi = filterAbsensiByDampingan(absensi, pesertaDampingan);

        let rows = '';
        filteredAbsensi.slice(0, 10).forEach((a, i) => {
            const statusClass = a.Status === 'Hadir' ? 'hadir' : a.Status === 'Izin' ? 'izin' : a.Status === 'Sakit' ? 'sakit' : 'tidak';
            rows += `<tr>
                <td>${i+1}</td>
                <td>${a.Jam || '-'}</td>
                <td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${(a.Kode||'').slice(-4)}</code></td>
                <td><strong>${a.Nama || '-'}</strong></td>
                <td class="small">${a.Sesi_Nama || '-'}</td>
                <td><span class="badge-status ${statusClass}">${a.Status || 'Hadir'}</span></td>
            </tr>`;
        });
        tbody.innerHTML = rows;
    }
    window.updateTablePetugas = updateTablePetugas;

    // ============================================================
    //  BAGIAN 3: SCANQR_PETUGAS.JS (Lengkap, Tanpa Filter)
    // ============================================================

    let html5QrCode = null;
    let isScanning = false;
    let currentScanData = null;
    let scanCooldown = false;
    let localLog = [];
    let sesiList = [];
    let soundEnabled = true;
    let beepAudio = null;
    let audioReady = false;

    const SOUND_KEY = 'srma19_sound_enabled';

    function initBeepAudio() {
        if (beepAudio) return;
        try {
            beepAudio = new Audio('beep.mp3');
            beepAudio.volume = 0.6;
            beepAudio.load();
            audioReady = true;
        } catch(e) {
            beepAudio = null;
            audioReady = false;
        }
    }

    function unlockAudio() {
        if (beepAudio) {
            try {
                const testAudio = new Audio('beep.mp3');
                testAudio.volume = 0;
                testAudio.play().then(() => {
                    testAudio.pause();
                    testAudio.currentTime = 0;
                    audioReady = true;
                }).catch(() => {});
            } catch(e) {}
        }
    }

    function playBeep() {
        if (!soundEnabled) return;
        initBeepAudio();
        unlockAudio();
        if (beepAudio) {
            try {
                beepAudio.currentTime = 0;
                beepAudio.play();
            } catch(e) {
                fallbackBeep();
            }
        } else {
            fallbackBeep();
        }
    }

    function fallbackBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch(e) {}
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        localStorage.setItem(SOUND_KEY, soundEnabled);
        const icon = document.querySelector('#soundToggleBtn i');
        if (icon) {
            icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }
    window.toggleSound = toggleSound;

    async function fetchJadwalPetugas() {
        try {
            const res = await API.getJadwal();
            if (res.status === 'success' && res.data.length > 0) {
                sesiList = res.data.map(j => ({
                    kode: String(j.id),
                    nama: j.nama,
                    agama: j.agama,
                    mulai: j.mulai,
                    selesai: j.selesai
                }));
            } else {
                sesiList = [
                    { kode: '1', nama: 'Apel Pagi', agama: 'Islam', mulai: '06:00', selesai: '06:30' },
                    { kode: '2', nama: 'Makan Pagi', agama: 'Islam', mulai: '06:30', selesai: '07:15' },
                    { kode: '3', nama: 'Ibadah Sholat Dhuhur', agama: 'Islam', mulai: '12:00', selesai: '12:30' },
                    { kode: '4', nama: 'Apel Makan Siang', agama: 'Islam', mulai: '12:30', selesai: '12:45' },
                    { kode: '5', nama: 'Makan Siang', agama: 'Islam', mulai: '12:45', selesai: '13:30' },
                    { kode: '6', nama: 'Ibadah Sholat Ashar', agama: 'Islam', mulai: '15:00', selesai: '15:30' },
                    { kode: '7', nama: 'Ibadah Sholat Maghrib', agama: 'Islam', mulai: '17:45', selesai: '18:15' },
                    { kode: '8', nama: 'Apel Makan Malam', agama: 'Islam', mulai: '18:15', selesai: '18:30' },
                    { kode: '9', nama: 'Makan Malam', agama: 'Islam', mulai: '18:30', selesai: '19:15' },
                    { kode: '10', nama: 'Apel Malam', agama: 'Islam', mulai: '21:00', selesai: '21:30' }
                ];
            }
        } catch (e) { console.error('Gagal fetch jadwal:', e); }
    }

    function renderScanQR(container) {
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0"><i class="fas fa-qrcode me-2" style="color:#0d6efd;"></i>Scan QR Absensi</h4>
                <div>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" id="soundToggleBtn" onclick="toggleSound()" title="Suara">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            </div>

            <!-- Sesi Info -->
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center p-2">
                    <div>
                        <div class="small text-muted">Sesi Saat Ini</div>
                        <strong id="currentSessionName" class="text-dark">Memuat...</strong>
                    </div>
                    <div class="text-end">
                        <span class="badge-sesi badge-active" id="currentSessionBadge">
                            <i class="fas fa-clock me-1"></i><span id="currentTime">--:--</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Scanner -->
            <div class="card-modern p-3">
                <div id="reader" style="width:100%;border-radius:10px;overflow:hidden;border:2px dashed #d0d0d0;background:#f8f8f8;min-height:220px;"></div>
                <div class="mt-3 text-center">
                    <button class="btn btn-primary rounded-pill" id="btnStartScan" onclick="startScan()">
                        <i class="fas fa-camera me-2"></i>Mulai Scan
                    </button>
                    <button class="btn btn-danger rounded-pill d-none" id="btnStopScan" onclick="stopScan()">
                        <i class="fas fa-stop me-2"></i>Hentikan
                    </button>
                </div>
            </div>

            <!-- Hasil Scan -->
            <div id="resultContainer" class="d-none mt-3">
                <div class="card-modern p-3" id="resultCard">
                    <h6 class="fw-bold mb-2"><i class="fas fa-info-circle me-2"></i>Data Peserta</h6>
                    <div class="text-center">
                        <div id="resultAvatar" style="width:60px;height:60px;border-radius:50%;background:#e0f2fe;display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:var(--primary);">?</div>
                        <div class="mt-2">
                            <div class="fw-bold" id="resultNama">-</div>
                            <div class="text-muted small"><span id="resultKode">-</span> &bull; <span id="resultJK">-</span> &bull; <span id="resultAgama">-</span></div>
                            <div><span class="badge-sesi" id="resultSesi">-</span></div>
                        </div>
                        
                        <!-- Form Tambahan -->
                        <div class="form-section mt-3">
                            <label>Status Kehadiran</label>
                            <select class="form-select form-select-sm" id="statusKehadiranSelect">
                                <option value="Hadir">Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Tidak Berangkat">Tidak Berangkat</option>
                                <option value="Sakit">Sakit</option>
                            </select>
                            
                            <label class="mt-2 small">Puasa (Senin/Kamis)</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="puasa" id="puasaYa" value="Ya" checked>
                                <label class="form-check-label" for="puasaYa">Ya</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="puasa" id="puasaTidak" value="Tidak">
                                <label class="form-check-label" for="puasaTidak">Tidak</label>
                            </div>

                            <label class="mt-2 small">Pelanggaran</label>
                            <select class="form-select form-select-sm" id="pelanggaranSelect">
                                <option value="Tidak Ada">Tidak Ada</option>
                                <option value="Ringan">Ringan</option>
                                <option value="Sedang">Sedang</option>
                                <option value="Berat">Berat</option>
                            </select>
                            <div id="pelanggaranKeteranganContainer" class="mt-1" style="display:none;">
                                <input type="text" class="form-control form-control-sm" id="pelanggaranKeterangan" placeholder="Keterangan pelanggaran...">
                            </div>

                            <label class="mt-2 small">Kondisi Kesehatan</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="kesehatan" id="kesehatanSehat" value="Sehat" checked>
                                <label class="form-check-label" for="kesehatanSehat">Sehat</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="kesehatan" id="kesehatanSakit" value="Sakit">
                                <label class="form-check-label" for="kesehatanSakit">Sakit</label>
                            </div>
                            <div id="kesehatanKeteranganContainer" class="mt-1" style="display:none;">
                                <input type="text" class="form-control form-control-sm" id="kesehatanKeterangan" placeholder="Keterangan sakit...">
                            </div>
                        </div>

                        <button class="btn btn-success btn-sm rounded-pill mt-3 w-100" id="btnConfirm" onclick="confirmAbsensi()">
                            <i class="fas fa-check-circle me-1"></i> Konfirmasi Absensi
                        </button>
                        <button class="btn btn-outline-secondary btn-sm rounded-pill mt-1 w-100" onclick="resetScan()">
                            <i class="fas fa-redo me-1"></i> Scan Ulang
                        </button>
                    </div>
                </div>
            </div>

            <!-- Log Absensi -->
            <div class="card-modern p-3 mt-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0"><i class="fas fa-list-alt me-2" style="color:var(--accent);"></i>Log Absensi</h6>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="clearLocalLog()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="logContainer" style="max-height:200px;overflow-y:auto;">
                    <p class="text-center text-muted py-3 small">Belum ada data absensi.</p>
                </div>
            </div>

            <!-- Status Koneksi -->
            <div class="text-center mt-2 small text-muted" id="connectionStatus">
                <span class="pulse-dot me-1"></span>Memeriksa koneksi...
            </div>
        `;

        // Event listener form tambahan
        document.getElementById('pelanggaranSelect')?.addEventListener('change', function() {
            const container = document.getElementById('pelanggaranKeteranganContainer');
            if (this.value !== 'Tidak Ada') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
                document.getElementById('pelanggaranKeterangan').value = '';
            }
        });

        document.querySelectorAll('input[name="kesehatan"]')?.forEach(radio => {
            radio.addEventListener('change', function() {
                const container = document.getElementById('kesehatanKeteranganContainer');
                if (this.value === 'Sakit') {
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                    document.getElementById('kesehatanKeterangan').value = '';
                }
            });
        });

        // Inisialisasi scanner
        const reader = document.getElementById('reader');
        if (reader) reader.innerHTML = '<div class="text-center py-4 text-muted">Klik "Mulai Scan" untuk mengaktifkan kamera</div>';

        // Load data
        fetchJadwalPetugas();
        loadLocalLog();
        updateSesiDisplay();
        testConnection();
        initBeepAudio();
        setInterval(updateSesiDisplay, 30000);
        setTimeout(() => {
            if (!isScanning) startScan();
        }, 500);
    }
    window.renderScanQR = renderScanQR;

    function updateSesiDisplay() {
        const now = new Date();
        const currentTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
        document.getElementById('currentTime').textContent = currentTime;

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        let found = null;
        for (const s of sesiList) {
            const [h1, m1] = s.mulai.split(':').map(Number);
            const [h2, m2] = s.selesai.split(':').map(Number);
            const start = h1 * 60 + m1;
            const end = h2 * 60 + m2;
            if (currentMinutes >= start && currentMinutes <= end) {
                found = s;
                break;
            }
        }
        if (found) {
            document.getElementById('currentSessionName').textContent = `[${found.agama}] ${found.nama}`;
            document.getElementById('currentSessionBadge').className = 'badge-sesi badge-active';
        } else {
            document.getElementById('currentSessionName').textContent = 'Di luar sesi';
            document.getElementById('currentSessionBadge').className = 'badge-sesi badge-outside';
        }
    }

    async function startScan() {
        if (isScanning) return;
        unlockAudio();
        if (soundEnabled) playBeep();
        const reader = document.getElementById('reader');
        if (reader) reader.classList.add('scanning');
        try {
            html5QrCode = new Html5Qrcode('reader');
            const config = { 
                fps: 60, 
                qrbox: { width: 500, height: 500 }, 
                aspectRatio: 1.0 
            };
            await html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, () => {});
            isScanning = true;
            document.getElementById('btnStartScan').classList.add('d-none');
            document.getElementById('btnStopScan').classList.remove('d-none');
            window.showToast('Kamera siap. Arahkan ke QR Code.', 'success');
        } catch (err) {
            if (reader) reader.classList.remove('scanning');
            window.showToast('Gagal mengakses kamera.', 'error');
        }
    }
    window.startScan = startScan;

    async function stopScan() {
        if (!isScanning || !html5QrCode) return;
        await html5QrCode.stop();
        isScanning = false;
        const reader = document.getElementById('reader');
        if (reader) reader.classList.remove('scanning');
        document.getElementById('btnStartScan').classList.remove('d-none');
        document.getElementById('btnStopScan').classList.add('d-none');
        html5QrCode.clear();
        html5QrCode = null;
    }
    window.stopScan = stopScan;

    function onScanSuccess(decodedText) {
        if (scanCooldown) return;
        scanCooldown = true;
        if (soundEnabled) playBeep();
        const code = decodedText.trim();
        API.searchPeserta(code).then(data => {
            if (data.status === 'success') {
                currentScanData = {
                    code: data.code,
                    nama: data.nama,
                    jk: data.jk,
                    agama: data.agama,
                    sesi: data.sesi,
                    sesi_nama: data.sesi_nama,
                    dalam_sesi: data.dalam_sesi,
                    manual: false,
                    timestamp: new Date().toISOString()
                };
                displayResult();
                setTimeout(() => { scanCooldown = false; }, 800);
            } else {
                window.showToast(data.message || 'Peserta tidak ditemukan.', 'error');
                resetScan();
                setTimeout(() => { scanCooldown = false; }, 800);
            }
        }).catch(() => {
            window.showToast('Gagal menghubungi server.', 'error');
            resetScan();
            setTimeout(() => { scanCooldown = false; }, 800);
        });
    }

    function displayResult() {
        const d = currentScanData;
        document.getElementById('resultNama').textContent = d.nama;
        document.getElementById('resultKode').textContent = d.code;
        document.getElementById('resultJK').textContent = d.jk || '-';
        document.getElementById('resultAgama').textContent = d.agama || '-';
        document.getElementById('resultSesi').textContent = d.sesi_nama;
        document.getElementById('resultAvatar').textContent = d.nama.charAt(0).toUpperCase();
        const badge = document.getElementById('resultSesi');
        badge.className = 'badge-sesi ' + (d.dalam_sesi ? 'badge-active' : 'badge-outside');
        document.getElementById('resultContainer').classList.remove('d-none');
        document.getElementById('resultContainer').scrollIntoView({ behavior:'smooth', block:'center' });
    }

    function resetScan() {
        currentScanData = null;
        document.getElementById('resultContainer').classList.add('d-none');
    }
    window.resetScan = resetScan;

    async function confirmAbsensi() {
        if (!currentScanData) return;
        const btn = document.getElementById('btnConfirm');
        btn.disabled = true;
        btn.innerHTML = 'Mencatat...';

        const statusKehadiran = document.getElementById('statusKehadiranSelect').value;
        const puasa = document.querySelector('input[name="puasa"]:checked')?.value || 'Tidak';
        const pelanggaran = document.getElementById('pelanggaranSelect').value;
        const pelanggaranKeterangan = document.getElementById('pelanggaranKeteranganContainer').style.display === 'block'
            ? document.getElementById('pelanggaranKeterangan').value.trim()
            : '';
        const kondisiKesehatan = document.querySelector('input[name="kesehatan"]:checked')?.value || 'Sehat';
        const keteranganKesehatan = document.getElementById('kesehatanKeteranganContainer').style.display === 'block'
            ? document.getElementById('kesehatanKeterangan').value.trim()
            : '';

        try {
            const hasil = await API.recordAbsensi(
                currentScanData.code,
                currentScanData.nama,
                currentScanData.sesi,
                currentScanData.sesi_nama,
                user?.nama || 'Unknown',
                currentScanData.agama,
                puasa,
                pelanggaran,
                pelanggaranKeterangan,
                kondisiKesehatan,
                keteranganKesehatan,
                statusKehadiran
            );
            if (hasil.status === 'recorded') {
                addLocalLog('recorded');
                resetScan();
                window.showToast('✅ Tercatat', 'success');
            } else if (hasil.status === 'already_recorded') {
                addLocalLog('duplicate');
                resetScan();
                window.showToast('⚠️ Sudah tercatat', 'warning');
            } else {
                window.showToast(hasil.message, 'error');
            }
        } catch(e) {
            window.showToast('Gagal server', 'error');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Konfirmasi Absensi';
    }
    window.confirmAbsensi = confirmAbsensi;

    function addLocalLog(status) {
        localLog.unshift({
            nama: currentScanData.nama,
            kode: currentScanData.code,
            sesi: currentScanData.sesi_nama,
            jam: new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }),
            status
        });
        if (localLog.length > 30) localLog.pop();
        localStorage.setItem('srma19_absensi_log', JSON.stringify(localLog));
        renderLog();
    }

    function loadLocalLog() {
        const saved = localStorage.getItem('srma19_absensi_log');
        if (saved) try { localLog = JSON.parse(saved); } catch(e) {}
        renderLog();
    }

    function clearLocalLog() {
        if (confirm('Hapus log?')) {
            localLog = [];
            localStorage.removeItem('srma19_absensi_log');
            renderLog();
        }
    }
    window.clearLocalLog = clearLocalLog;

    function renderLog() {
        const container = document.getElementById('logContainer');
        if (!container) return;
        if (localLog.length) {
            container.innerHTML = localLog.map(l =>
                `<div class="log-item"><span><i class="fas ${l.status==='duplicate'?'fa-exclamation-triangle text-warning':'fa-check-circle text-success'}"></i> ${l.nama}</span><span class="small text-muted">${l.sesi} | ${l.jam}</span></div>`
            ).join('');
        } else {
            container.innerHTML = '<p class="text-center text-muted py-3 small">Belum ada data</p>';
        }
    }

    async function testConnection() {
        try {
            const r = await API.ping();
            document.getElementById('connectionStatus').innerHTML = r.status === 'ok'
                ? '<span class="pulse-dot me-1"></span><span class="text-success">Terhubung</span>'
                : '<i class="fas fa-exclamation-triangle text-warning me-1"></i>Respons tidak dikenal';
        } catch(e) {
            document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-times-circle text-danger me-1"></i>Gagal';
        }
    }

    // ============================================================
    //  BAGIAN 4: ABSENSI_PETUGAS.JS (Collapsible Filter + Filter Data)
    // ============================================================

    let absensiData = [];
    let absensiFiltered = [];
    let selectedTimestamps = new Set();
    let currentPageAbsensi = 1;
    let totalAbsensiEntries = 0;
    const pageSizeAbsensi = 100;

    function renderAbsensiPetugas(container) {
        const cached = getCachedData();
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';

        if (cached?.peserta && cached?.absensi) {
            const pesertaDampingan = getMuridDampingan(cached.peserta, petugasNama);
            absensiData = filterAbsensiByDampingan(cached.absensi, pesertaDampingan);
            totalAbsensiEntries = absensiData.length;
        } else {
            absensiData = [];
            totalAbsensiEntries = 0;
        }
        absensiFiltered = [...absensiData];

        const sesiList = [...new Set(absensiData.map(a => a.Sesi_Nama).filter(Boolean))];
        const filterId = 'collapseFilterAbsensiPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-clipboard-list me-2" style="color:#0d6efd;"></i>Data Absensi <span class="badge bg-secondary rounded-pill">${totalAbsensiEntries}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-danger rounded-pill" onclick="exportPDFAbsensiPetugas()"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-sm btn-success rounded-pill" onclick="exportCSVAbsensiPetugas()"><i class="fas fa-download"></i> CSV</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshAbsensiPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <input type="text" class="form-control form-control-sm" id="searchAbsensiPetugas" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterAbsensiPetugas()">
                        <input type="date" class="form-control form-control-sm" id="fTglAbsensiPetugas" style="width:140px" onchange="applyFilterAbsensiPetugas()">
                        <select class="form-select form-select-sm" id="fSesiAbsensiPetugas" style="width:150px" onchange="applyFilterAbsensiPetugas()">
                            <option value="">Semua Sesi</option>
                            ${sesiList.map(s => `<option>${s}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterAbsensiPetugas()">Reset</button>
                        <span class="small text-muted ms-2" id="lastUpdateAbsensiPetugas"></span>
                    </div>
                </div>
            </div>
            <div class="card-modern p-0"><div id="absensiTableContainerPetugas"></div></div>
            <div id="paginationContainerAbsensiPetugas"></div>
        `;
        applyFilterAbsensiPetugas();
        document.getElementById('lastUpdateAbsensiPetugas').textContent = `Terakhir: ${new Date().toLocaleTimeString()}`;

        const target = document.querySelector(`#${filterId}`);
        const icon = document.querySelector(`#icon${filterId}`);
        if (target && icon) {
            target.addEventListener('shown.bs.collapse', () => {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            });
            target.addEventListener('hidden.bs.collapse', () => {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            });
        }
    }
    window.renderAbsensiPetugas = renderAbsensiPetugas;

    async function refreshAbsensiPetugas(silent = false) {
        if (!silent) showToast('Memperbarui data absensi...', 'info');
        const tgl = document.getElementById('fTglAbsensiPetugas')?.value || '';
        const sesi = document.getElementById('fSesiAbsensiPetugas')?.value || '';
        try {
            const res = await API.listAbsensi(tgl, sesi, currentPageAbsensi, pageSizeAbsensi);
            if (res.status === 'success') {
                const user = Auth.getCurrentUser();
                const petugasNama = user.nama || '';
                const pesertaRes = await API.listPeserta();
                const pesertaDampingan = getMuridDampingan(pesertaRes.data || [], petugasNama);
                absensiData = filterAbsensiByDampingan(res.data, pesertaDampingan);
                totalAbsensiEntries = absensiData.length;
                const cached = getCachedData() || {};
                cached.absensi = absensiData;
                cached.totalAbsensi = totalAbsensiEntries;
                setCachedData(cached);
                applyFilterAbsensiPetugas();
                if (!silent) showToast(`✅ Data diperbarui (${absensiData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshAbsensiPetugas = refreshAbsensiPetugas;

    function applyFilterAbsensiPetugas(silent = false) {
        const q = (document.getElementById('searchAbsensiPetugas')?.value || '').toLowerCase().trim();
        const t = document.getElementById('fTglAbsensiPetugas')?.value || '';
        const s = document.getElementById('fSesiAbsensiPetugas')?.value || '';
        absensiFiltered = absensiData.filter(a =>
            (!q || (a.Nama||'').toLowerCase().includes(q) || (a.Kode||'').toLowerCase().includes(q) || (a.Petugas||'').toLowerCase().includes(q)) &&
            (!t || a.Tanggal === t) &&
            (!s || a.Sesi_Nama === s)
        );
        for (const ts of selectedTimestamps) {
            if (!absensiFiltered.some(a => a.Timestamp === ts)) selectedTimestamps.delete(ts);
        }
        renderTableAbsensiPetugas();
        renderPaginationAbsensiPetugas();
        if (!silent) {
            const info = document.getElementById('infoCountAbsensiPetugas');
            if (info) info.textContent = `Menampilkan ${absensiFiltered.length} dari ${totalAbsensiEntries} entri`;
        }
    }
    window.applyFilterAbsensiPetugas = applyFilterAbsensiPetugas;

    function resetFilterAbsensiPetugas() {
        document.getElementById('searchAbsensiPetugas').value = '';
        document.getElementById('fTglAbsensiPetugas').value = '';
        document.getElementById('fSesiAbsensiPetugas').value = '';
        currentPageAbsensi = 1;
        applyFilterAbsensiPetugas();
    }
    window.resetFilterAbsensiPetugas = resetFilterAbsensiPetugas;

    async function changePageAbsensiPetugas(page) {
        currentPageAbsensi = page;
        const container = document.getElementById('absensiTableContainerPetugas');
        if (container) container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
        await refreshAbsensiPetugas(true);
    }
    window.changePageAbsensiPetugas = changePageAbsensiPetugas;

    function renderTableAbsensiPetugas() {
        const allChecked = absensiFiltered.length > 0 && absensiFiltered.every(a => selectedTimestamps.has(a.Timestamp));
        let rows = '';
        absensiFiltered.forEach(a => {
            const statusClass = a.Status === 'Hadir' ? 'hadir' : a.Status === 'Izin' ? 'izin' : a.Status === 'Sakit' ? 'sakit' : 'tidak';
            rows += `<tr>
                <td><input type="checkbox" ${selectedTimestamps.has(a.Timestamp) ? 'checked' : ''} onchange="toggleSelectAbsensiPetugas('${a.Timestamp}', this.checked)"></td>
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

        const container = document.getElementById('absensiTableContainerPetugas');
        if (!container) return;
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllAbsensiPetugas(this.checked)"></th>
                            <th>Tgl</th><th>Jam</th><th>Kode</th><th>Nama</th><th>Sesi</th><th>Status</th><th>Petugas</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableAbsensiPetugas = renderTableAbsensiPetugas;

    function renderPaginationAbsensiPetugas() {
        const totalPages = Math.ceil(totalAbsensiEntries / pageSizeAbsensi) || 1;
        const container = document.getElementById('paginationContainerAbsensiPetugas');
        if (!container) return;
        let html = `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <small class="text-muted" id="infoCountAbsensiPetugas">Menampilkan ${absensiFiltered.length} dari ${totalAbsensiEntries} entri</small>
                <div>`;
        if (currentPageAbsensi > 1) html += `<button class="btn btn-sm btn-outline-primary" onclick="changePageAbsensiPetugas(${currentPageAbsensi - 1})">← Sebelumnya</button> `;
        if (currentPageAbsensi < totalPages) html += `<button class="btn btn-sm btn-outline-primary" onclick="changePageAbsensiPetugas(${currentPageAbsensi + 1})">Berikutnya →</button>`;
        html += `</div></div>`;
        container.innerHTML = html;
    }
    window.renderPaginationAbsensiPetugas = renderPaginationAbsensiPetugas;

    function toggleSelectAllAbsensiPetugas(checked) {
        if (checked) absensiFiltered.forEach(a => selectedTimestamps.add(a.Timestamp));
        else selectedTimestamps.clear();
        renderTableAbsensiPetugas();
    }
    window.toggleSelectAllAbsensiPetugas = toggleSelectAllAbsensiPetugas;

    function toggleSelectAbsensiPetugas(ts, checked) {
        if (checked) selectedTimestamps.add(ts);
        else selectedTimestamps.delete(ts);
        renderTableAbsensiPetugas();
    }
    window.toggleSelectAbsensiPetugas = toggleSelectAbsensiPetugas;

    function exportPDFAbsensiPetugas() {
        if (!absensiFiltered.length) {
            showToast('Tidak ada data.', 'warning');
            return;
        }
        const tgl = document.getElementById('fTglAbsensiPetugas')?.value || 'Semua';
        const sesi = document.getElementById('fSesiAbsensiPetugas')?.value || 'Semua';
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
    window.exportPDFAbsensiPetugas = exportPDFAbsensiPetugas;

    function exportCSVAbsensiPetugas() {
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
    window.exportCSVAbsensiPetugas = exportCSVAbsensiPetugas;

    // ============================================================
    //  BAGIAN 5: IZIN_PETUGAS.JS (Collapsible Filter + Filter Data)
    // ============================================================

    let izinData = [];
    let izinFiltered = [];
    let selectedIzinIds = new Set();

    function renderIzinPetugas(container) {
        const cached = getCachedData();
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';

        if (cached?.peserta && cached?.izin) {
            const pesertaDampingan = getMuridDampingan(cached.peserta, petugasNama);
            izinData = filterIzinByDampingan(cached.izin, pesertaDampingan);
        } else {
            izinData = [];
        }
        izinFiltered = [...izinData];

        const filterId = 'collapseFilterIzinPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-file-medical-alt me-2" style="color:#0d6efd;"></i>Data Izin <span class="badge bg-secondary rounded-pill">${izinData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshIzinPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <input type="text" class="form-control form-control-sm" id="searchIzinPetugas" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterIzinPetugas()">
                        <input type="date" class="form-control form-control-sm" id="fTglIzinPetugas" style="width:140px" onchange="applyFilterIzinPetugas()">
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterIzinPetugas()">Reset</button>
                        <span class="small text-muted ms-2" id="infoCountIzinPetugas">Menampilkan ${izinData.length} entri</span>
                    </div>
                </div>
            </div>
            <div class="card-modern p-0"><div id="izinTableContainerPetugas"></div></div>
        `;
        applyFilterIzinPetugas();
    }
    window.renderIzinPetugas = renderIzinPetugas;

    async function refreshIzinPetugas(silent = false) {
        if (!silent) showToast('Memperbarui data izin...', 'info');
        try {
            const res = await API.listIzin();
            if (res.status === 'success') {
                const user = Auth.getCurrentUser();
                const petugasNama = user.nama || '';
                const pesertaRes = await API.listPeserta();
                const pesertaDampingan = getMuridDampingan(pesertaRes.data || [], petugasNama);
                izinData = filterIzinByDampingan(res.data, pesertaDampingan);
                const cached = getCachedData() || {};
                cached.izin = izinData;
                setCachedData(cached);
                applyFilterIzinPetugas();
                if (!silent) showToast(`✅ Data izin diperbarui (${izinData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshIzinPetugas = refreshIzinPetugas;

    function applyFilterIzinPetugas() {
        const q = (document.getElementById('searchIzinPetugas')?.value || '').toLowerCase().trim();
        const tgl = document.getElementById('fTglIzinPetugas')?.value || '';
        izinFiltered = izinData.filter(izin =>
            (!q || (izin.Nama_Peserta || '').toLowerCase().includes(q) || (izin.Kode_Peserta || '').toLowerCase().includes(q)) &&
            (!tgl || izin.Tanggal === tgl)
        );
        for (const id of selectedIzinIds) {
            if (!izinFiltered.some(i => String(i.ID) === id)) selectedIzinIds.delete(id);
        }
        renderTableIzinPetugas();
        const info = document.getElementById('infoCountIzinPetugas');
        if (info) info.textContent = `Menampilkan ${izinFiltered.length} dari ${izinData.length} entri`;
    }
    window.applyFilterIzinPetugas = applyFilterIzinPetugas;

    function resetFilterIzinPetugas() {
        document.getElementById('searchIzinPetugas').value = '';
        document.getElementById('fTglIzinPetugas').value = '';
        applyFilterIzinPetugas();
    }
    window.resetFilterIzinPetugas = resetFilterIzinPetugas;

    function renderTableIzinPetugas() {
        const allChecked = izinFiltered.length > 0 && izinFiltered.every(iz => selectedIzinIds.has(String(iz.ID)));
        let rows = '';
        izinFiltered.forEach((iz, idx) => {
            const realIdx = izinData.indexOf(iz);
            rows += `<tr>
                <td><input type="checkbox" ${selectedIzinIds.has(String(iz.ID))?'checked':''} onchange="toggleSelectIzinPetugas('${String(iz.ID)}', this.checked)"></td>
                <td>${iz.Tanggal || '-'}</td>
                <td><code>${(iz.Kode_Peserta || '').slice(-4)}</code></td>
                <td>${iz.Nama_Peserta || '-'}</td>
                <td>${iz.Keterangan || '-'}</td>
                <td>${iz.Bukti_Surat ? '<a href="#" onclick="lihatBuktiIzinPetugas(' + realIdx + ')"><i class="fas fa-paperclip"></i> Lihat</a>' : '-'}</td>
                <td>${iz.Petugas || '-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary p-1" onclick="showIzinModalPetugas(${realIdx})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1" onclick="hapusIzinPetugas(${realIdx})"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="8" class="text-center py-3 text-muted">Belum ada data izin</td></tr>';

        document.getElementById('izinTableContainerPetugas').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;"><input type="checkbox" ${allChecked?'checked':''} onchange="toggleSelectAllIzinPetugas(this.checked)"></th>
                            <th>Tanggal</th><th>Kode</th><th>Nama</th><th>Keterangan</th><th>Bukti</th><th>Petugas</th><th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableIzinPetugas = renderTableIzinPetugas;

    function toggleSelectAllIzinPetugas(checked) {
        if (checked) izinFiltered.forEach(iz => selectedIzinIds.add(String(iz.ID)));
        else selectedIzinIds.clear();
        renderTableIzinPetugas();
    }
    window.toggleSelectAllIzinPetugas = toggleSelectAllIzinPetugas;

    function toggleSelectIzinPetugas(id, checked) {
        if (checked) selectedIzinIds.add(id);
        else selectedIzinIds.delete(id);
        renderTableIzinPetugas();
    }
    window.toggleSelectIzinPetugas = toggleSelectIzinPetugas;

    function showIzinModalPetugas(index = null) {
        const existing = index !== null && index >= 0 ? izinData[index] : null;
        const title = existing ? '✏️ Edit Izin' : '➕ Tambah Izin';
        const modalHtml = `
            <div class="modal-overlay" id="izinModalPetugas">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="mb-3"><label>Kode Peserta <span class="text-danger">*</span></label><input type="text" class="form-control" id="imKodePetugas" value="${existing?.Kode_Peserta || ''}" placeholder="SRMA19-XXX" required></div>
                    <div class="mb-3"><label>Nama Peserta <span class="text-danger">*</span></label><input type="text" class="form-control" id="imNamaPetugas" value="${existing?.Nama_Peserta || ''}" required></div>
                    <div class="mb-3"><label>Tanggal <span class="text-danger">*</span></label><input type="date" class="form-control" id="imTanggalPetugas" value="${existing?.Tanggal || ''}" required></div>
                    <div class="mb-3"><label>Keterangan <span class="text-danger">*</span></label><input type="text" class="form-control" id="imKeteranganPetugas" value="${existing?.Keterangan || ''}" placeholder="Sakit, izin keluarga, dll." required></div>
                    <div class="mb-3"><label>Bukti Surat (foto/scan, max 49KB)</label><input type="file" accept="image/*" class="form-control" id="imBuktiPetugas">${existing?.Bukti_Surat ? '<small class="text-muted">Sudah ada bukti sebelumnya. Upload baru untuk mengganti.</small>' : ''}</div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary rounded-pill px-4" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary rounded-pill px-4" onclick="saveIzinPetugas(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showIzinModalPetugas = showIzinModalPetugas;

    async function saveIzinPetugas(index) {
        const kode = document.getElementById('imKodePetugas').value.trim().toUpperCase();
        const nama = document.getElementById('imNamaPetugas').value.trim();
        const tgl = document.getElementById('imTanggalPetugas').value;
        const keterangan = document.getElementById('imKeteranganPetugas').value.trim();
        if (!kode || !nama || !tgl || !keterangan) {
            showToast('Semua field wajib diisi.', 'error');
            return;
        }
        let bukti = '';
        const fileInput = document.getElementById('imBuktiPetugas');
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
        if (index !== null) data.id = izinData[index].ID;
        const btn = document.querySelector('#izinModalPetugas .btn-primary');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
        try {
            let res;
            if (index !== null) {
                res = await API.updateIzin(data);
            } else {
                res = await API.addIzin(data);
            }
            if (res.status === 'ok') {
                closeModal();
                await refreshIzinPetugas();
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
    window.saveIzinPetugas = saveIzinPetugas;

    async function hapusIzinPetugas(index) {
        if (!confirm('Hapus izin ini?')) return;
        const res = await API.deleteIzin(izinData[index].ID);
        if (res.status === 'ok') {
            await refreshIzinPetugas();
            showToast('Izin dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.hapusIzinPetugas = hapusIzinPetugas;

    function lihatBuktiIzinPetugas(index) {
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
    window.lihatBuktiIzinPetugas = lihatBuktiIzinPetugas;

    // ============================================================
    //  BAGIAN 6: JADWAL_PETUGAS.JS (Collapsible Filter)
    // ============================================================

    let jadwalData = [];
    let jadwalFiltered = [];

    function renderJadwalPetugas(container) {
        const cached = getCachedData();
        if (cached?.jadwal) {
            jadwalData = cached.jadwal.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
            jadwalFiltered = [...jadwalData];
        }
        const filterId = 'collapseFilterJadwalPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-calendar-alt me-2" style="color:#0d6efd;"></i>Jadwal Kegiatan</h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshJadwalPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter Agama</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <label class="fw-bold me-2">Filter Agama:</label>
                        <select class="form-select form-select-sm" id="filterAgamaJadwalPetugas" onchange="changeFilterAgamaJadwalPetugas(this.value)" style="width:150px;">
                            <option value="">Semua Agama</option>
                            ${[...new Set(jadwalData.map(j => j.agama).filter(Boolean))].sort().map(a => `<option value="${a}">${a}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterJadwalPetugas()">Reset</button>
                    </div>
                </div>
            </div>
            <div id="jadwalListContainerPetugas"></div>
        `;
        renderJadwalContentPetugas();
    }
    window.renderJadwalPetugas = renderJadwalPetugas;

    async function refreshJadwalPetugas(silent = false) {
        if (!silent) showToast('Memperbarui jadwal...', 'info');
        try {
            const res = await API.getJadwal();
            if (res.status === 'success') {
                jadwalData = res.data.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
                jadwalFiltered = [...jadwalData];
                const cached = getCachedData() || {};
                cached.jadwal = jadwalData;
                setCachedData(cached);
                renderJadwalContentPetugas();
                if (!silent) showToast('✅ Jadwal diperbarui.', 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat jadwal.', 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshJadwalPetugas = refreshJadwalPetugas;

    function renderJadwalContentPetugas() {
        const filtered = jadwalFiltered;
        if (!filtered.length) {
            document.getElementById('jadwalListContainerPetugas').innerHTML = '<div class="text-center py-5 text-muted">Belum ada jadwal.</div>';
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
                                    <button class="btn btn-sm btn-outline-warning p-1" onclick="editJadwalPetugas(${realIdx})" title="Edit"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-outline-danger p-1" onclick="deleteJadwalPetugas(${realIdx})" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
            listHtml += `</div></div>`;
        }
        document.getElementById('jadwalListContainerPetugas').innerHTML = listHtml;
    }
    window.renderJadwalContentPetugas = renderJadwalContentPetugas;

    function changeFilterAgamaJadwalPetugas(agama) {
        jadwalFiltered = agama ? jadwalData.filter(j => j.agama === agama) : jadwalData;
        renderJadwalContentPetugas();
    }
    window.changeFilterAgamaJadwalPetugas = changeFilterAgamaJadwalPetugas;

    function resetFilterJadwalPetugas() {
        document.getElementById('filterAgamaJadwalPetugas').value = '';
        jadwalFiltered = jadwalData;
        renderJadwalContentPetugas();
    }
    window.resetFilterJadwalPetugas = resetFilterJadwalPetugas;

    function editJadwalPetugas(index) {
        showToast('Anda tidak memiliki akses untuk mengedit jadwal.', 'warning');
    }
    window.editJadwalPetugas = editJadwalPetugas;

    function deleteJadwalPetugas(index) {
        showToast('Anda tidak memiliki akses untuk menghapus jadwal.', 'warning');
    }
    window.deleteJadwalPetugas = deleteJadwalPetugas;

    // ============================================================
    //  BAGIAN 7: WALI_ASUH_PETUGAS.JS (Collapsible Filter + Filter Data)
    // ============================================================

    let waliData = [];
    let waliFiltered = [];

    function renderWaliAsuhPetugas(container) {
        const cached = getCachedData();
        if (cached?.waliAsuh) {
            waliData = cached.waliAsuh;
            waliFiltered = [...waliData];
        }
        const filterId = 'collapseFilterWaliPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-users-cog me-2" style="color:#0d6efd;"></i>Wali Asuh <span class="badge bg-secondary rounded-pill">${waliData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshWaliAsuhPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <input type="text" class="form-control form-control-sm" id="searchWaliPetugas" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterWaliPetugas()">
                        <select class="form-select form-select-sm" id="filterStatusWaliPetugas" style="width:120px" onchange="applyFilterWaliPetugas()">
                            <option value="">Semua Status</option>
                            <option>Aktif</option>
                            <option>Nonaktif</option>
                        </select>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterWaliPetugas()">Reset</button>
                        <span class="small text-muted ms-2" id="infoCountWaliPetugas">Menampilkan ${waliData.length} entri</span>
                    </div>
                </div>
            </div>
            <div class="card-modern p-0"><div id="waliTableContainerPetugas"></div></div>
        `;
        applyFilterWaliPetugas();
    }
    window.renderWaliAsuhPetugas = renderWaliAsuhPetugas;

    async function refreshWaliAsuhPetugas(silent = false) {
        if (!silent) showToast('Memperbarui data wali asuh...', 'info');
        try {
            const res = await API.listWaliAsuh();
            if (res.status === 'success') {
                waliData = res.data;
                const cached = getCachedData() || {};
                cached.waliAsuh = waliData;
                setCachedData(cached);
                applyFilterWaliPetugas();
                if (!silent) showToast(`✅ Data wali asuh diperbarui (${waliData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshWaliAsuhPetugas = refreshWaliAsuhPetugas;

    function applyFilterWaliPetugas() {
        const q = (document.getElementById('searchWaliPetugas')?.value || '').toLowerCase().trim();
        const status = document.getElementById('filterStatusWaliPetugas')?.value || '';
        waliFiltered = waliData.filter(w =>
            (!q || (w.Nama||'').toLowerCase().includes(q) || (w.Nomor_HP||'').toLowerCase().includes(q) || (w.Alamat||'').toLowerCase().includes(q)) &&
            (!status || (w.Status||'Aktif') === status)
        );
        renderTableWaliPetugas();
        const info = document.getElementById('infoCountWaliPetugas');
        if (info) info.textContent = `Menampilkan ${waliFiltered.length} dari ${waliData.length} entri`;
    }
    window.applyFilterWaliPetugas = applyFilterWaliPetugas;

    function resetFilterWaliPetugas() {
        document.getElementById('searchWaliPetugas').value = '';
        document.getElementById('filterStatusWaliPetugas').value = '';
        applyFilterWaliPetugas();
    }
    window.resetFilterWaliPetugas = resetFilterWaliPetugas;

    function renderTableWaliPetugas() {
        let rows = '';
        waliFiltered.forEach((w, i) => {
            const realIdx = waliData.indexOf(w);
            const statusBadge = (w.Status||'Aktif') === 'Aktif' ? 'bg-success' : 'bg-secondary';
            rows += `<tr>
                <td>${i+1}</td>
                <td><strong>${w.Nama||'-'}</strong></td>
                <td>${w.Nomor_HP||'-'}</td>
                <td>${w.Alamat||'-'}</td>
                <td><span class="badge badge-count" style="background:#8b5cf6;color:#fff;border-radius:50px;padding:2px 10px;font-size:0.75rem;">${w.Jumlah_Murid_Asuh||0}</span></td>
                <td><span class="badge ${statusBadge}">${w.Status||'Aktif'}</span></td>
                <td>${w.Keterangan||'-'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary p-1" onclick="showWaliModalPetugas(${realIdx})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger p-1" onclick="deleteWaliSinglePetugas(${realIdx})"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
        });
        if (!rows) rows = '<tr><td colspan="9" class="text-center py-3 text-muted">Tidak ada data wali asuh</td></tr>';

        document.getElementById('waliTableContainerPetugas').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th style="width:30px;">No</th>
                            <th>Nama</th><th>Nomor HP</th><th>Alamat</th><th>Jumlah Murid</th><th>Status</th><th>Keterangan</th><th class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableWaliPetugas = renderTableWaliPetugas;

    function showWaliModalPetugas(index = null) {
        const existing = index !== null && index >= 0 ? waliData[index] : null;
        const title = existing ? '✏️ Edit Wali Asuh' : '➕ Tambah Wali Asuh';
        const modalHtml = `
            <div class="modal-overlay" id="waliModalPetugas">
                <div class="modal-box">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold mb-0">${title}</h5>
                        <button class="btn-close" onclick="closeModal()"></button>
                    </div>
                    <div class="mb-3"><label>Nama Wali Asuh <span class="text-danger">*</span></label><input class="form-control" id="wmNamaPetugas" value="${existing?.Nama||''}" placeholder="Nama lengkap"></div>
                    <div class="mb-3"><label>Nomor HP</label><input class="form-control" id="wmNomorHPPetugas" value="${existing?.Nomor_HP||''}" placeholder="08xxxx"></div>
                    <div class="mb-3"><label>Alamat</label><input class="form-control" id="wmAlamatPetugas" value="${existing?.Alamat||''}" placeholder="Alamat lengkap"></div>
                    <div class="mb-3"><label>Jumlah Murid Asuh (Otomatis)</label><input type="number" class="form-control" id="wmJumlahPetugas" value="${existing?.Jumlah_Murid_Asuh||0}" readonly disabled style="background:#f8f9fa;"><small class="text-muted">Terhitung otomatis dari data peserta.</small></div>
                    <div class="mb-3"><label>Status</label><select class="form-select" id="wmStatusPetugas"><option value="Aktif" ${(existing?.Status||'Aktif')==='Aktif'?'selected':''}>Aktif</option><option value="Nonaktif" ${existing?.Status==='Nonaktif'?'selected':''}>Nonaktif</option></select></div>
                    <div class="mb-3"><label>Keterangan</label><textarea class="form-control" id="wmKeteranganPetugas" rows="2" placeholder="Catatan tambahan">${existing?.Keterangan||''}</textarea></div>
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
                        <button class="btn btn-primary" onclick="saveWaliPetugas(${index})"><i class="fas fa-save me-1"></i> Simpan</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    window.showWaliModalPetugas = showWaliModalPetugas;

    async function saveWaliPetugas(index) {
        const nama = document.getElementById('wmNamaPetugas').value.trim();
        if (!nama) { showToast('Nama wali asuh wajib diisi.', 'error'); return; }
        const data = {
            nama: nama,
            nomor_hp: document.getElementById('wmNomorHPPetugas').value.trim(),
            alamat: document.getElementById('wmAlamatPetugas').value.trim(),
            jumlah_murid: parseInt(document.getElementById('wmJumlahPetugas').value) || 0,
            status: document.getElementById('wmStatusPetugas').value,
            keterangan: document.getElementById('wmKeteranganPetugas').value.trim()
        };
        if (index !== null && index >= 0) data.id = waliData[index].ID;
        const btn = document.querySelector('#waliModalPetugas .btn-primary');
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
                await refreshWaliAsuhPetugas(true);
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
    window.saveWaliPetugas = saveWaliPetugas;

    async function deleteWaliSinglePetugas(index) {
        const w = waliData[index];
        if (!w) return;
        if (!confirm(`Hapus wali asuh ${w.Nama}?`)) return;
        const res = await API.deleteWaliAsuh(w.ID);
        if (res.status === 'ok') {
            await refreshWaliAsuhPetugas(true);
            showToast('✅ Wali asuh dihapus.', 'success');
        } else {
            showToast(res.message, 'error');
        }
    }
    window.deleteWaliSinglePetugas = deleteWaliSinglePetugas;

    // ============================================================
    //  BAGIAN 8: ALUMNI_PETUGAS.JS (Collapsible Filter)
    // ============================================================

    let alumniData = [];
    let alumniFiltered = [];

    function renderAlumniPetugas(container) {
        const cached = getCachedData();
        if (cached?.alumni) {
            alumniData = cached.alumni;
            alumniFiltered = [...alumniData];
        }
        const filterId = 'collapseFilterAlumniPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-graduation-cap me-2" style="color:#0d6efd;"></i>Data Alumni <span class="badge bg-secondary rounded-pill">${alumniData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshAlumniPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <input type="text" class="form-control form-control-sm" id="searchAlumniPetugas" placeholder="🔍 Cari..." style="width:150px" oninput="applyFilterAlumniPetugas()">
                        <select class="form-select form-select-sm" id="filterAngkatanAlumniPetugas" style="width:130px" onchange="applyFilterAlumniPetugas()">
                            <option value="">Semua Angkatan</option>
                            ${[...new Set(alumniData.map(a => a.Angkatan).filter(Boolean))].map(a => `<option>${a}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterAlumniPetugas()">Reset</button>
                        <span class="small text-muted ms-2" id="infoCountAlumniPetugas">Menampilkan ${alumniData.length} entri</span>
                    </div>
                </div>
            </div>
            <div class="card-modern p-0"><div id="alumniTableContainerPetugas"></div></div>
        `;
        applyFilterAlumniPetugas();
    }
    window.renderAlumniPetugas = renderAlumniPetugas;

    async function refreshAlumniPetugas(silent = false) {
        if (!silent) showToast('Memperbarui data alumni...', 'info');
        try {
            const res = await API.listAlumni();
            if (res.status === 'success') {
                alumniData = res.data;
                const cached = getCachedData() || {};
                cached.alumni = alumniData;
                setCachedData(cached);
                applyFilterAlumniPetugas();
                if (!silent) showToast(`✅ Data alumni diperbarui (${alumniData.length} entri)`, 'success');
            } else {
                if (!silent) showToast('❌ Gagal memuat data: ' + (res.message || 'Unknown error'), 'error');
            }
        } catch (e) {
            if (!silent) showToast('❌ Gagal terhubung ke server.', 'error');
        }
    }
    window.refreshAlumniPetugas = refreshAlumniPetugas;

    function applyFilterAlumniPetugas() {
        const q = (document.getElementById('searchAlumniPetugas')?.value || '').toLowerCase().trim();
        const angkatan = document.getElementById('filterAngkatanAlumniPetugas')?.value || '';
        alumniFiltered = alumniData.filter(a =>
            (!q || (a.Nama||'').toLowerCase().includes(q) || (a.Kode||'').toLowerCase().includes(q)) &&
            (!angkatan || (a.Angkatan||'') === angkatan)
        );
        renderTableAlumniPetugas();
        const info = document.getElementById('infoCountAlumniPetugas');
        if (info) info.textContent = `Menampilkan ${alumniFiltered.length} dari ${alumniData.length} entri`;
    }
    window.applyFilterAlumniPetugas = applyFilterAlumniPetugas;

    function resetFilterAlumniPetugas() {
        document.getElementById('searchAlumniPetugas').value = '';
        document.getElementById('filterAngkatanAlumniPetugas').value = '';
        applyFilterAlumniPetugas();
    }
    window.resetFilterAlumniPetugas = resetFilterAlumniPetugas;

    function renderTableAlumniPetugas() {
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

        document.getElementById('alumniTableContainerPetugas').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr><th style="width:30px;">No</th><th>Kode</th><th>Nama</th><th>JK</th><th>Agama</th><th>Asal</th><th>Rombel</th><th>Angkatan</th><th>Tanggal Lulus</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }
    window.renderTableAlumniPetugas = renderTableAlumniPetugas;

    // ============================================================
    //  BAGIAN 9: LAPORAN_PETUGAS.JS (Collapsible Filter + Filter Data)
    // ============================================================

    let laporanPesertaData = [];
    let laporanAbsensiData = [];
    let laporanIzinData = [];
    let laporanJadwalData = [];
    let laporanSummaryData = [];
    let laporanFiltered = [];

    function renderLaporanPetugas(container) {
        const cached = getCachedData();
        const user = Auth.getCurrentUser();
        const petugasNama = user.nama || '';

        if (cached?.peserta) {
            const pesertaDampingan = getMuridDampingan(cached.peserta, petugasNama);
            laporanPesertaData = pesertaDampingan.map(p => ({ ...p, Kode: String(p.Kode || '') }));
        } else {
            laporanPesertaData = [];
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
        const filterId = 'collapseFilterLaporanPetugas';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-chart-pie me-2" style="color:#0d6efd;"></i>Laporan Summary Siswa</h4>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary rounded-pill" onclick="loadLaporanDataPetugas(); applyFilterLaporanPetugas();"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>
            <div class="card-modern mb-3">
                <div class="d-flex justify-content-between align-items-center" style="cursor:pointer;" data-bs-toggle="collapse" data-bs-target="#${filterId}" aria-expanded="true">
                    <span class="fw-bold"><i class="fas fa-filter me-2"></i>Filter</span>
                    <i class="fas fa-chevron-down collapse-toggle" id="icon${filterId}"></i>
                </div>
                <div class="collapse show" id="${filterId}">
                    <div class="filter-group pt-2">
                        <label>Tanggal Mulai:</label>
                        <input type="date" class="form-control form-control-sm" id="tglMulaiLaporanPetugas" style="width:140px">
                        <label>Tanggal Selesai:</label>
                        <input type="date" class="form-control form-control-sm" id="tglSelesaiLaporanPetugas" style="width:140px">
                        <select class="form-select form-select-sm" id="filterStatusLaporanPetugas" style="width:120px">
                            <option value="">Semua Status</option>
                            <option>Hadir</option>
                            <option>Izin</option>
                            <option>Tidak Berangkat</option>
                        </select>
                        <select class="form-select form-select-sm" id="filterRombelLaporanPetugas" style="width:130px">
                            <option value="">Semua Rombel</option>
                            ${rombelList.map(r => `<option>${r}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-primary rounded-pill" onclick="applyFilterLaporanPetugas()"><i class="fas fa-search"></i> Tampilkan</button>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="resetFilterLaporanPetugas()">Reset</button>
                        <button class="btn btn-sm btn-info rounded-pill" onclick="previewLaporanPDFPetugas()"><i class="fas fa-eye"></i> Preview & Cetak PDF</button>
                    </div>
                </div>
            </div>
            <div class="summary-card" style="background:#fff;border-radius:12px;padding:16px;margin-bottom:15px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;gap:20px;flex-wrap:wrap;">
                <div><strong>Total Siswa:</strong> <span id="totalSiswaLaporanPetugas">0</span></div>
                <div><strong>Total Hadir:</strong> <span id="totalHadirLaporanPetugas">0</span></div>
                <div><strong>Total Izin:</strong> <span id="totalIzinLaporanPetugas">0</span></div>
                <div><strong>Total Tidak Berangkat:</strong> <span id="totalTidakLaporanPetugas">0</span></div>
                <div><strong>Total Sakit:</strong> <span id="totalSakitLaporanPetugas">0</span></div>
            </div>
            <div class="card-modern p-0"><div id="laporanTableContainerPetugas"></div></div>
        `;
    }
    window.renderLaporanPetugas = renderLaporanPetugas;

    async function loadLaporanDataPetugas() {
        try {
            const [p, a, i, j] = await Promise.all([
                API.listPeserta(),
                API.listAbsensi('', '', 1, 1000),
                API.listIzin(),
                API.getJadwal()
            ]);
            const user = Auth.getCurrentUser();
            const petugasNama = user.nama || '';

            if (p.status === 'success') {
                const pesertaDampingan = getMuridDampingan(p.data, petugasNama);
                laporanPesertaData = pesertaDampingan.map(ps => ({ ...ps, Kode: String(ps.Kode || '') }));
            } else {
                laporanPesertaData = [];
            }
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
    window.loadLaporanDataPetugas = loadLaporanDataPetugas;

    function applyFilterLaporanPetugas() {
        const tglMulai = document.getElementById('tglMulaiLaporanPetugas').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporanPetugas').value;
        const status = document.getElementById('filterStatusLaporanPetugas')?.value || '';
        const rombel = document.getElementById('filterRombelLaporanPetugas')?.value || '';

        if (!tglMulai || !tglSelesai) {
            showToast('Pilih rentang tanggal terlebih dahulu.', 'warning');
            return;
        }

        // Build summary hanya untuk peserta dampingan
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
        // Filter absensi hanya untuk peserta dampingan
        const kodeDampingan = new Set(activePeserta.map(p => String(p.Kode).trim()));
        filteredAbsensi = filteredAbsensi.filter(a => kodeDampingan.has(String(a.Kode).trim()));

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
        laporanFiltered = laporanSummaryData.filter(s =>
            (!status || s.status === status) &&
            (!rombel || s.rombel === rombel)
        );
        renderLaporanSummaryPetugas();
    }
    window.applyFilterLaporanPetugas = applyFilterLaporanPetugas;

    function resetFilterLaporanPetugas() {
        document.getElementById('tglMulaiLaporanPetugas').value = '';
        document.getElementById('tglSelesaiLaporanPetugas').value = '';
        document.getElementById('filterStatusLaporanPetugas').value = '';
        document.getElementById('filterRombelLaporanPetugas').value = '';
        laporanFiltered = [];
        renderLaporanSummaryPetugas();
    }
    window.resetFilterLaporanPetugas = resetFilterLaporanPetugas;

    function renderLaporanSummaryPetugas() {
        const totalHadir = laporanFiltered.reduce((sum, s) => sum + s.hadir, 0);
        const totalTidak = laporanFiltered.reduce((sum, s) => sum + s.tidakBerangkat, 0);
        const totalIzin = laporanFiltered.reduce((sum, s) => sum + s.izin, 0);
        const totalSakit = laporanFiltered.reduce((sum, s) => sum + s.sakit, 0);

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

        document.getElementById('laporanTableContainerPetugas').innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>No</th><th>Kode</th><th>Nama</th><th>Agama</th><th>Rombel</th>
                            <th>Hadir</th><th>Izin</th><th>Tidak Berangkat</th><th>Sakit</th><th>% Hadir</th>
                            <th>Wali Asuh 1</th><th>Wali Asrama</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;

        document.getElementById('totalSiswaLaporanPetugas').textContent = laporanFiltered.length;
        document.getElementById('totalHadirLaporanPetugas').textContent = totalHadir;
        document.getElementById('totalIzinLaporanPetugas').textContent = totalIzin;
        document.getElementById('totalTidakLaporanPetugas').textContent = totalTidak;
        document.getElementById('totalSakitLaporanPetugas').textContent = totalSakit;
    }
    window.renderLaporanSummaryPetugas = renderLaporanSummaryPetugas;

    function previewLaporanPDFPetugas() {
        if (laporanFiltered.length === 0) {
            showToast('Tidak ada data untuk ditampilkan.', 'warning');
            return;
        }
        const tglMulai = document.getElementById('tglMulaiLaporanPetugas').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporanPetugas').value;
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
                        <th>Wali 1</th><th>Wali Asrama</th>
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
            <div class="preview-modal show" id="laporanPreviewModalPetugas">
                <div class="preview-content">
                    <div class="preview-header">
                        <h4>👁️ Preview Laporan Summary</h4>
                        <div class="preview-actions">
                            <button class="btn btn-sm btn-success" onclick="downloadLaporanPDFPetugas()"><i class="fas fa-download me-1"></i> Download PDF</button>
                            <button class="btn btn-sm btn-secondary" onclick="closePreviewLaporanPetugas()"><i class="fas fa-times"></i> Tutup</button>
                        </div>
                    </div>
                    <div id="previewBodyLaporanPetugas">${html}</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', previewHtml);
        window.laporanPreviewHtmlPetugas = html;
    }
    window.previewLaporanPDFPetugas = previewLaporanPDFPetugas;

    function closePreviewLaporanPetugas() {
        const modal = document.getElementById('laporanPreviewModalPetugas');
        if (modal) modal.remove();
    }
    window.closePreviewLaporanPetugas = closePreviewLaporanPetugas;

    async function downloadLaporanPDFPetugas() {
        if (!window.laporanPreviewHtmlPetugas) {
            showToast('Tidak ada data preview.', 'error');
            return;
        }
        const tglMulai = document.getElementById('tglMulaiLaporanPetugas').value;
        const tglSelesai = document.getElementById('tglSelesaiLaporanPetugas').value;
        const filename = `laporan_summary_${tglMulai}_${tglSelesai}.pdf`;
        const element = document.createElement('div');
        element.innerHTML = window.laporanPreviewHtmlPetugas;
        document.body.appendChild(element);
        try {
            await html2pdf().set({
                filename: filename,
                margin: 10,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).from(element).save();
            showToast('✅ Laporan berhasil diunduh.', 'success');
            closePreviewLaporanPetugas();
        } catch (e) {
            showToast('❌ Gagal mengunduh: ' + e.message, 'error');
        } finally {
            document.body.removeChild(element);
        }
    }
    window.downloadLaporanPDFPetugas = downloadLaporanPDFPetugas;

    // ============================================================
    //  BAGIAN 10: EKSPOR FUNGSI KE GLOBAL SCOPE
    // ============================================================

    // Ekspor semua fungsi render ke window agar bisa dipanggil oleh navigate()
    window.renderDashboardPetugas = renderDashboardPetugas;
    window.renderAbsensiPetugas = renderAbsensiPetugas;
    window.renderIzinPetugas = renderIzinPetugas;
    window.renderJadwalPetugas = renderJadwalPetugas;
    window.renderWaliAsuhPetugas = renderWaliAsuhPetugas;
    window.renderAlumniPetugas = renderAlumniPetugas;
    window.renderLaporanPetugas = renderLaporanPetugas;
    window.renderScanQR = renderScanQR;

    // Ekspor fungsi lain
    window.startScan = startScan;
    window.stopScan = stopScan;
    window.toggleSound = toggleSound;
    window.confirmAbsensi = confirmAbsensi;
    window.resetScan = resetScan;
    window.clearLocalLog = clearLocalLog;

    // Ekspor fungsi tambahan
    window.refreshDashboardPetugas = refreshDashboardPetugas;
    window.loadDashboardPetugasStats = loadDashboardPetugasStats;
    window.updateStatsPetugas = updateStatsPetugas;
    window.updateTablePetugas = updateTablePetugas;

    window.refreshAbsensiPetugas = refreshAbsensiPetugas;
    window.exportPDFAbsensiPetugas = exportPDFAbsensiPetugas;
    window.exportCSVAbsensiPetugas = exportCSVAbsensiPetugas;
    window.applyFilterAbsensiPetugas = applyFilterAbsensiPetugas;
    window.resetFilterAbsensiPetugas = resetFilterAbsensiPetugas;
    window.changePageAbsensiPetugas = changePageAbsensiPetugas;

    window.refreshIzinPetugas = refreshIzinPetugas;
    window.applyFilterIzinPetugas = applyFilterIzinPetugas;
    window.resetFilterIzinPetugas = resetFilterIzinPetugas;
    window.showIzinModalPetugas = showIzinModalPetugas;
    window.saveIzinPetugas = saveIzinPetugas;
    window.hapusIzinPetugas = hapusIzinPetugas;
    window.lihatBuktiIzinPetugas = lihatBuktiIzinPetugas;

    window.refreshJadwalPetugas = refreshJadwalPetugas;
    window.changeFilterAgamaJadwalPetugas = changeFilterAgamaJadwalPetugas;
    window.resetFilterJadwalPetugas = resetFilterJadwalPetugas;

    window.refreshWaliAsuhPetugas = refreshWaliAsuhPetugas;
    window.applyFilterWaliPetugas = applyFilterWaliPetugas;
    window.resetFilterWaliPetugas = resetFilterWaliPetugas;
    window.showWaliModalPetugas = showWaliModalPetugas;
    window.saveWaliPetugas = saveWaliPetugas;
    window.deleteWaliSinglePetugas = deleteWaliSinglePetugas;

    window.refreshAlumniPetugas = refreshAlumniPetugas;
    window.applyFilterAlumniPetugas = applyFilterAlumniPetugas;
    window.resetFilterAlumniPetugas = resetFilterAlumniPetugas;

    window.loadLaporanDataPetugas = loadLaporanDataPetugas;
    window.applyFilterLaporanPetugas = applyFilterLaporanPetugas;
    window.resetFilterLaporanPetugas = resetFilterLaporanPetugas;
    window.previewLaporanPDFPetugas = previewLaporanPDFPetugas;
    window.downloadLaporanPDFPetugas = downloadLaporanPDFPetugas;
    window.closePreviewLaporanPetugas = closePreviewLaporanPetugas;

    console.log('✅ All Petugas modules loaded successfully (v5.3 – Robust Init)');

})();