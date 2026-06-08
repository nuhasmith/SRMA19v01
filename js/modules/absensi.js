// ============================================================
//  ABSENSI.JS – Data Absensi
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderAbsensi };

// ============================================================
//  2. STATE
// ============================================================
let absensiData = [];
let absensiFiltered = [];
let selectedTimestamps = new Set();
let currentPageAbsensi = 1;
let totalAbsensiEntries = 0;
const pageSizeAbsensi = 100;

// ============================================================
//  3. HELPERS & CACHE
// ============================================================
const { getCachedData, setCachedData, showToast } = window;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  4. RENDER ABSENSI
// ============================================================
function renderAbsensi(container) {
    // Ambil data dari cache jika belum ada
    if (absensiData.length === 0) {
        const cached = getCachedData();
        if (cached?.absensi) {
            absensiData = cached.absensi;
            absensiFiltered = [...absensiData];
            totalAbsensiEntries = cached.totalAbsensi || absensiData.length;
        }
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

// ============================================================
//  5. REFRESH DATA
// ============================================================
async function refreshAbsensi(silent = false) {
    if (!silent) showToast('Memperbarui data absensi...', 'info');
    const tgl = document.getElementById('fTglAbsensi')?.value || '';
    const sesi = document.getElementById('fSesiAbsensi')?.value || '';
    const q = document.getElementById('searchAbsensi')?.value || '';
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

// ============================================================
//  6. FILTER
// ============================================================
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

function resetFilterAbsensi() {
    document.getElementById('searchAbsensi').value = '';
    document.getElementById('fTglAbsensi').value = '';
    document.getElementById('fSesiAbsensi').value = '';
    currentPageAbsensi = 1;
    applyFilterAbsensi();
}

// ============================================================
//  7. PAGINATION
// ============================================================
async function changePageAbsensi(page) {
    currentPageAbsensi = page;
    const container = document.getElementById('absensiTableContainer');
    if (container) container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    await refreshAbsensi(true);
}

// ============================================================
//  8. RENDER TABLE
// ============================================================
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

// ============================================================
//  9. PAGINATION UI
// ============================================================
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

// ============================================================
//  10. SELECTION
// ============================================================
function toggleSelectAllAbsensi(checked) {
    if (checked) absensiFiltered.forEach(a => selectedTimestamps.add(a.Timestamp));
    else selectedTimestamps.clear();
    renderTableAbsensi();
    updateDeleteButtonAbsensi();
}

function toggleSelectAbsensi(ts, checked) {
    if (checked) selectedTimestamps.add(ts);
    else selectedTimestamps.delete(ts);
    updateDeleteButtonAbsensi();
}

function updateDeleteButtonAbsensi() {
    const btn = document.getElementById('btnDeleteAbsensi');
    const cnt = document.getElementById('absensiSelectedCount');
    if (btn) btn.disabled = selectedTimestamps.size === 0;
    if (cnt) cnt.textContent = selectedTimestamps.size;
}

// ============================================================
//  11. DELETE SELECTED
// ============================================================
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

// ============================================================
//  12. GENERATE ABSENCE
// ============================================================
async function generateAbsence() {
    const tgl = document.getElementById('fTglAbsensi')?.value;
    if (!tgl) { showToast('Pilih tanggal terlebih dahulu.', 'warning'); return; }
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

// ============================================================
//  13. EXPORT PDF
// ============================================================
function exportPDFAbsensi() {
    if (!absensiFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
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

// ============================================================
//  14. EXPORT CSV
// ============================================================
function exportCSVAbsensi() {
    if (!absensiFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
    const rows = [['"Tanggal"','"Jam"','"Kode"','"Nama"','"Sesi"','"Status"','"Petugas"']];
    absensiFiltered.forEach(a => rows.push([`"${a.Tanggal}"`,`"${a.Jam}"`,`"${a.Kode}"`,`"${a.Nama}"`,`"${a.Sesi_Nama}"`,`"${a.Status||'Hadir'}"`,`"${a.Petugas}"`]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `absensi_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    showToast('✅ CSV berhasil diunduh.', 'success');
}

// ============================================================
//  15. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.renderAbsensi = renderAbsensi;
window.refreshAbsensi = refreshAbsensi;
window.applyFilterAbsensi = applyFilterAbsensi;
window.resetFilterAbsensi = resetFilterAbsensi;
window.changePageAbsensi = changePageAbsensi;
window.toggleSelectAllAbsensi = toggleSelectAllAbsensi;
window.toggleSelectAbsensi = toggleSelectAbsensi;
window.deleteSelectedAbsensi = deleteSelectedAbsensi;
window.generateAbsence = generateAbsence;
window.exportPDFAbsensi = exportPDFAbsensi;
window.exportCSVAbsensi = exportCSVAbsensi;

console.log('✅ Absensi module loaded');