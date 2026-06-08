// ============================================================
//  PETUGAS.JS – CRUD Petugas
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. STATE
    // ============================================================
    let petugasData = [];
    let petugasFiltered = [];
    let selectedPetugasUsernames = new Set();

    // ============================================================
    //  2. HELPERS & CACHE
    // ============================================================
    const { getCachedData, setCachedData, showToast } = window;
    const CACHE_KEY = 'srma19_admin_data';

    // ============================================================
    //  3. RENDER PETUGAS
    // ============================================================
    function renderPetugas(container) {
        // Ambil data dari cache jika belum ada
        if (petugasData.length === 0) {
            const cached = getCachedData();
            if (cached?.petugas) {
                petugasData = cached.petugas;
                petugasFiltered = [...petugasData];
            }
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="fw-bold mb-0"><i class="fas fa-user-shield me-2" style="color:#0d6efd;"></i>Data Petugas <span class="badge bg-secondary rounded-pill">${petugasData.length}</span></h4>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success rounded-pill" onclick="showPetugasModal(null)"><i class="fas fa-plus me-1"></i> Tambah</button>
                    <button class="btn btn-sm btn-refresh rounded-pill" onclick="refreshPetugas(false)"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
                </div>
            </div>

            <div class="card-modern p-0">
                <div id="petugasTableContainer"></div>
            </div>
        `;

        renderTablePetugas();
    }

    // ============================================================
    //  4. RENDER TABLE
    // ============================================================
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

    // ============================================================
    //  5. SELECTION
    // ============================================================
    function toggleSelectAllPetugas(checked) {
        if (checked) petugasFiltered.forEach(p => selectedPetugasUsernames.add(p.Username));
        else selectedPetugasUsernames.clear();
        renderTablePetugas();
    }

    function toggleSelectPetugas(username, checked) {
        if (checked) selectedPetugasUsernames.add(username);
        else selectedPetugasUsernames.delete(username);
        renderTablePetugas();
    }

    // ============================================================
    //  6. REFRESH DATA
    // ============================================================
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

    // ============================================================
    //  7. CRUD MODAL
    // ============================================================
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

    // ============================================================
    //  8. SAVE (ADD / UPDATE)
    // ============================================================
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

    // ============================================================
    //  9. DELETE
    // ============================================================
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

    // ============================================================
    //  10. TOGGLE STATUS
    // ============================================================
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

    // ============================================================
    //  11. EKSPOR (CSV / PDF) – OPSIONAL
    // ============================================================
    function exportCSVPetugas() {
        const data = petugasFiltered.length ? petugasFiltered : petugasData;
        if (!data.length) { showToast('Tidak ada data.', 'warning'); return; }
        const rows = [['Username','Nama','Role','Status']];
        data.forEach(p => rows.push([p.Username || '', p.Nama || '', p.Role || '', p.Status || 'Aktif']));
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `petugas_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        showToast('✅ CSV berhasil diunduh.', 'success');
    }

    function exportPDFPetugas() {
        const data = petugasFiltered.length ? petugasFiltered : petugasData;
        if (!data.length) { showToast('Tidak ada data.', 'warning'); return; }
        const now = new Date();
        const tanggalCetak = now.toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' });
        const html = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3>SEKOLAH RAKYAT MENENGAH ATAS 19 BANTUL</h3>
                <p>Sentra Terpadu Prof. Dr. Soeharso, Sonosewu</p>
                <hr><h4>DAFTAR PETUGAS</h4>
                <p>Dicetak: ${tanggalCetak}</p>
            </div>
            <table border="1" cellpadding="5" style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead><tr><th>No</th><th>Username</th><th>Nama</th><th>Role</th><th>Status</th></tr></thead>
                <tbody>${data.map((p, i) => `<tr><td>${i+1}</td><td>${p.Username||''}</td><td>${p.Nama||''}</td><td>${p.Role||''}</td><td>${p.Status||'Aktif'}</td></tr>`).join('')}</tbody>
            </table>`;
        html2pdf().set({
            filename: `petugas_${now.toISOString().slice(0,10)}.pdf`,
            margin: 10,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(html).save();
    }

    // ============================================================
    //  12. EXPOSE FUNCTIONS TO GLOBAL SCOPE
    // ============================================================
    window.renderPetugas = renderPetugas;
    window.refreshPetugas = refreshPetugas;
    window.showPetugasModal = showPetugasModal;
    window.savePetugas = savePetugas;
    window.deletePetugas = deletePetugas;
    window.toggleStatusPetugas = toggleStatusPetugas;
    window.toggleSelectAllPetugas = toggleSelectAllPetugas;
    window.toggleSelectPetugas = toggleSelectPetugas;
    window.exportCSVPetugas = exportCSVPetugas;
    window.exportPDFPetugas = exportPDFPetugas;
    // closeModal sudah disediakan oleh main.js

    console.log('✅ Petugas module loaded');
})();