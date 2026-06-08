// ============================================================
//  IZIN.JS – Data Izin (CRUD Lengkap)
//  SRMA 19 Bantul - Admin Dashboard SPA
//  Versi: 2.0 (Terintegrasi penuh, tanpa duplikasi)
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. STATE
    // ============================================================
    let izinData = [];
    let izinFiltered = [];
    let selectedIzinIds = new Set();

    // ============================================================
    //  2. HELPERS & CACHE
    // ============================================================
    const { getCachedData, setCachedData, showToast, closeModal } = window;
    const CACHE_KEY = 'srma19_admin_data';

    // ============================================================
    //  3. RENDER IZIN
    // ============================================================
    function renderIzin(container) {
        // Ambil data dari cache jika belum ada
        if (izinData.length === 0) {
            const cached = getCachedData();
            if (cached?.izin) {
                izinData = cached.izin;
                izinFiltered = [...izinData];
            }
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

    // ============================================================
    //  4. REFRESH DATA
    // ============================================================
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

    // ============================================================
    //  5. FILTER
    // ============================================================
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

    // ============================================================
    //  6. RENDER TABLE
    // ============================================================
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

    // ============================================================
    //  7. SELECTION
    // ============================================================
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

    // ============================================================
    //  8. CRUD MODAL
    // ============================================================
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

    // ============================================================
    //  9. SAVE (ADD / UPDATE)
    // ============================================================
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

    // ============================================================
    //  10. DELETE
    // ============================================================
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

    // ============================================================
    //  11. LIHAT BUKTI
    // ============================================================
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
    //  12. EKSPOR FUNGSI KE GLOBAL SCOPE
    // ============================================================
    // Semua fungsi sudah diekspor dengan window.fungsi = fungsi di atas
    // Tidak perlu export/import

    console.log('✅ Izin module loaded (lengkap)');

})();