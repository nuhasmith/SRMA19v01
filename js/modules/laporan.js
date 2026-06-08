// ============================================================
//  LAPORAN.JS – Laporan Summary Siswa
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderLaporan };

// ============================================================
//  2. STATE
// ============================================================
let laporanPesertaData = [];
let laporanAbsensiData = [];
let laporanIzinData = [];
let laporanJadwalData = [];
let laporanSummaryData = [];
let laporanFiltered = [];

// ============================================================
//  3. HELPERS & CACHE
// ============================================================
const { getCachedData, setCachedData, showToast } = window;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  4. RENDER LAPORAN
// ============================================================
function renderLaporan(container) {
    // Ambil data dari cache jika belum ada
    if (laporanPesertaData.length === 0) {
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

// ============================================================
//  5. LOAD DATA
// ============================================================
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

// ============================================================
//  6. BUILD SUMMARY
// ============================================================
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

// ============================================================
//  7. FILTER
// ============================================================
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

function resetFilterLaporan() {
    document.getElementById('tglMulaiLaporan').value = '';
    document.getElementById('tglSelesaiLaporan').value = '';
    document.getElementById('filterStatusLaporan').value = '';
    document.getElementById('filterRombelLaporan').value = '';
    laporanFiltered = [];
    renderLaporanSummary();
}

// ============================================================
//  8. RENDER SUMMARY
// ============================================================
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

// ============================================================
//  9. PREVIEW & DOWNLOAD PDF
// ============================================================
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

function closePreviewLaporan() {
    const modal = document.getElementById('laporanPreviewModal');
    if (modal) modal.remove();
}

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

// ============================================================
//  10. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.renderLaporan = renderLaporan;
window.loadLaporanData = loadLaporanData;
window.applyFilterLaporan = applyFilterLaporan;
window.resetFilterLaporan = resetFilterLaporan;
window.previewLaporanPDF = previewLaporanPDF;
window.downloadLaporanPDF = downloadLaporanPDF;
window.closePreviewLaporan = closePreviewLaporan;

console.log('✅ Laporan module loaded');