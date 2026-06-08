// ============================================================
//  PESERTA.JS – CRUD Peserta (Lengkap)
//  SRMA 19 Bantul - Admin Dashboard SPA
//  Versi: 2.0 (Terintegrasi penuh, tanpa duplikasi)
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. STATE
    // ============================================================
    let pesertaData = [];
    let pesertaFiltered = [];
    let selectedKode = new Set();
    let waliAsuhList = [];
    let qrImagesCache = {};
    let previewData = null;
    let isGenerating = false;

    // ============================================================
    //  2. HELPERS & CACHE
    // ============================================================
    const { getCachedData, setCachedData, showToast, closeModal } = window;
    const CACHE_KEY = 'srma19_admin_data';

    // ============================================================
    //  3. RENDER PESERTA
    // ============================================================
    function renderPeserta(container) {
        // Ambil data dari cache jika belum ada
        if (pesertaData.length === 0) {
            const cached = getCachedData();
            if (cached?.peserta) {
                pesertaData = cached.peserta.map(p => ({ ...p, Kode: String(p.Kode || '') }));
                pesertaFiltered = [...pesertaData];
            }
            if (cached?.waliAsuh) {
                waliAsuhList = cached.waliAsuh.filter(w => w.Status === 'Aktif');
            }
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

    // ============================================================
    //  4. FILTER
    // ============================================================
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

    // ============================================================
    //  5. RENDER TABLE
    // ============================================================
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

    // ============================================================
    //  6. SELECTION
    // ============================================================
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

    // ============================================================
    //  7. CRUD MODAL
    // ============================================================
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

    // ============================================================
    //  8. SAVE (ADD / UPDATE)
    // ============================================================
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

    // ============================================================
    //  9. STATUS & DELETE
    // ============================================================
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

    // ============================================================
    //  10. REFRESH DATA
    // ============================================================
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

    // ============================================================
    //  11. EKSPOR CSV
    // ============================================================
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

    // ============================================================
    //  12. EKSPOR PDF
    // ============================================================
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

    // ============================================================
    //  13. IMPOR CSV
    // ============================================================
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

    // ============================================================
    //  14. ARSIP LULUS
    // ============================================================
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

    // ============================================================
    //  15. QR CODE GENERATOR
    // ============================================================
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

    // ============================================================
    //  16. BARCODE PREVIEW & DOWNLOAD
    // ============================================================
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
    //  17. EKSPOR FUNGSI KE GLOBAL SCOPE
    // ============================================================
    // Semua fungsi sudah diekspor dengan window.fungsi = fungsi di atas
    // Tidak perlu export/import

    console.log('✅ Peserta module loaded (lengkap)');

})();