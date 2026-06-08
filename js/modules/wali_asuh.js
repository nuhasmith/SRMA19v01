// ============================================================
//  WALI_ASUH.JS – Wali Asuh
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderWaliAsuh };

// ============================================================
//  2. STATE
// ============================================================
let waliData = [];
let waliFiltered = [];
let selectedWaliIds = new Set();

// ============================================================
//  3. HELPERS & CACHE
// ============================================================
const { getCachedData, setCachedData, showToast } = window;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  4. RENDER WALI ASUH
// ============================================================
function renderWaliAsuh(container) {
    // Ambil data dari cache jika belum ada
    if (waliData.length === 0) {
        const cached = getCachedData();
        if (cached?.waliAsuh) {
            waliData = cached.waliAsuh;
            waliFiltered = [...waliData];
        }
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

// ============================================================
//  5. REFRESH DATA
// ============================================================
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

// ============================================================
//  6. FILTER
// ============================================================
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

function resetFilterWali() {
    document.getElementById('searchWali').value = '';
    document.getElementById('filterStatusWali').value = '';
    applyFilterWali();
}

// ============================================================
//  7. RENDER TABLE
// ============================================================
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

// ============================================================
//  8. SELECTION
// ============================================================
function toggleSelectAllWali(checked) {
    if (checked) waliFiltered.forEach(w => selectedWaliIds.add(String(w.ID)));
    else selectedWaliIds.clear();
    renderTableWali();
    updateDeleteButtonWali();
}

function toggleSelectWali(id, checked) {
    if (checked) selectedWaliIds.add(id);
    else selectedWaliIds.delete(id);
    updateDeleteButtonWali();
}

function updateDeleteButtonWali() {
    const btn = document.getElementById('btnDeleteSelectedWali');
    const cnt = document.getElementById('selectedCountWali');
    if (btn) btn.disabled = selectedWaliIds.size === 0;
    if (cnt) cnt.textContent = selectedWaliIds.size;
}

// ============================================================
//  9. CRUD MODAL
// ============================================================
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

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

async function saveWali(index) {
    const nama = document.getElementById('wmNama').value.trim();
    if (!nama) { showToast('Nama wali asuh wajib diisi.', 'error'); return; }
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
        if (index !== null && index >= 0) res = await API.updateWaliAsuh(data);
        else res = await API.addWaliAsuh(data);
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

// ============================================================
//  10. DELETE
// ============================================================
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

// ============================================================
//  11. SYNC COUNT
// ============================================================
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

// ============================================================
//  12. EXPORT PDF
// ============================================================
function exportPDFWali() {
    if (!waliFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
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

// ============================================================
//  13. EXPORT CSV
// ============================================================
function exportCSVWali() {
    if (!waliFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
    const rows = [['Nama','Nomor HP','Alamat','Jumlah Murid','Status','Keterangan']];
    waliFiltered.forEach(w => rows.push([w.Nama||'', w.Nomor_HP||'', w.Alamat||'', w.Jumlah_Murid_Asuh||0, w.Status||'Aktif', w.Keterangan||'']));
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `wali_asuh_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    showToast('✅ CSV berhasil diunduh.', 'success');
}

// ============================================================
//  14. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.renderWaliAsuh = renderWaliAsuh;
window.refreshWali = refreshWali;
window.showWaliModal = showWaliModal;
window.saveWali = saveWali;
window.deleteWaliSingle = deleteWaliSingle;
window.deleteSelectedWali = deleteSelectedWali;
window.toggleSelectAllWali = toggleSelectAllWali;
window.toggleSelectWali = toggleSelectWali;
window.resetFilterWali = resetFilterWali;
window.applyFilterWali = applyFilterWali;
window.syncWaliCount = syncWaliCount;
window.exportPDFWali = exportPDFWali;
window.exportCSVWali = exportCSVWali;
window.closeModal = closeModal;

console.log('✅ Wali Asuh module loaded');