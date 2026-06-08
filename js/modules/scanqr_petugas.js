// ============================================================
//  SCANQR_PETUGAS.JS – Versi Final Lengkap (Petugas)
//  SRMA 19 Bantul
//  Fitur: Info Sesi (Otomatis), Scanner, Form Tambahan, Log, Suara
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. STATE
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
    const user = window.currentUser || Auth.getCurrentUser();

    // ============================================================
    //  2. SOUND (BEEP)
    // ============================================================
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

    // ============================================================
    //  3. FETCH JADWAL
    // ============================================================
    async function fetchJadwal() {
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
                // Fallback dummy data
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

    // ============================================================
    //  4. RENDER UI (LENGKAP – Tanpa Mode Manual)
    // ============================================================
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

            <!-- ===== Sesi Info (Otomatis) ===== -->
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

            <!-- ===== Scanner ===== -->
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

            <!-- ===== Hasil Scan & Form ===== -->
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
                        
                        <!-- ===== Form Tambahan ===== -->
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

            <!-- ===== Log Absensi ===== -->
            <div class="card-modern p-3 mt-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0"><i class="fas fa-list-alt me-2" style="color:var(--accent);"></i>Log Absensi</h6>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="clearLocalLog()"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div id="logContainer" style="max-height:200px;overflow-y:auto;">
                    <p class="text-center text-muted py-3 small">Belum ada data absensi.</p>
                </div>
            </div>

            <!-- ===== Status Koneksi ===== -->
            <div class="text-center mt-2 small text-muted" id="connectionStatus">
                <span class="pulse-dot me-1"></span>Memeriksa koneksi...
            </div>
        `;

        // ===== Event Listener untuk Form =====
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
        fetchJadwal();
        loadLocalLog();
        updateSesiDisplay();
        testConnection();
        initBeepAudio();
        setInterval(updateSesiDisplay, 30000);
        setTimeout(() => {
            if (!isScanning) startScan();
        }, 500);
    }

    // ============================================================
    //  5. UPDATE SESI DISPLAY (Otomatis)
    // ============================================================
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

    // ============================================================
    //  6. SCAN QR
    // ============================================================
    async function startScan() {
        if (isScanning) return;
        unlockAudio();
        if (soundEnabled) playBeep();
        const reader = document.getElementById('reader');
        if (reader) reader.classList.add('scanning');
        try {
            html5QrCode = new Html5Qrcode('reader');
            const config = { fps: 30, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 };
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
                setTimeout(() => { scanCooldown = false; }, 1500);
            } else {
                window.showToast(data.message || 'Peserta tidak ditemukan.', 'error');
                resetScan();
                setTimeout(() => { scanCooldown = false; }, 1500);
            }
        }).catch(() => {
            window.showToast('Gagal menghubungi server.', 'error');
            resetScan();
            setTimeout(() => { scanCooldown = false; }, 1500);
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
        document.getElementById('resultCard').scrollIntoView({ behavior:'smooth', block:'center' });
    }

    function resetScan() {
        currentScanData = null;
        document.getElementById('resultContainer').classList.add('d-none');
    }

    // ============================================================
    //  7. KONFIRMASI ABSENSI
    // ============================================================
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

    // ============================================================
    //  8. LOG ABSENSI
    // ============================================================
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

    // ============================================================
    //  9. TEST KONEKSI
    // ============================================================
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
    //  10. EXPOSE FUNCTIONS
    // ============================================================
    window.renderScanQR = renderScanQR;
    window.startScan = startScan;
    window.stopScan = stopScan;
    window.toggleSound = toggleSound;
    window.confirmAbsensi = confirmAbsensi;
    window.resetScan = resetScan;
    window.clearLocalLog = clearLocalLog;

    console.log('✅ ScanQR Petugas module loaded');
})();