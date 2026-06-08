// ============================================================
//  JADWAL.JS – Jadwal Kegiatan
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderJadwal };

// ============================================================
//  2. STATE
// ============================================================
let jadwalData = [];
let filterAgamaJadwal = '';

// ============================================================
//  3. HELPERS & CACHE
// ============================================================
const { getCachedData, setCachedData, showToast } = window;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  4. RENDER JADWAL
// ============================================================
function renderJadwal(container) {
    // Ambil data dari cache jika belum ada
    if (jadwalData.length === 0) {
        const cached = getCachedData();
        if (cached?.jadwal) {
            jadwalData = cached.jadwal.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
        }
    }
    
    // Simpan filter dari sessionStorage
    const savedFilter = sessionStorage.getItem('srma19_jadwal_filter');
    if (savedFilter) filterAgamaJadwal = savedFilter;

    container.innerHTML = `
        <div id="jadwalContent"></div>
    `;
    renderJadwalContent();
}

// ============================================================
//  5. RENDER JADWAL CONTENT
// ============================================================
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

// ============================================================
//  6. REFRESH DATA
// ============================================================
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

// ============================================================
//  7. FILTER
// ============================================================
function changeFilterAgamaJadwal(agama) {
    filterAgamaJadwal = agama;
    renderJadwalContent();
    sessionStorage.setItem('srma19_jadwal_filter', agama);
}

function resetFilterJadwal() {
    filterAgamaJadwal = '';
    sessionStorage.removeItem('srma19_jadwal_filter');
    renderJadwalContent();
    const select = document.getElementById('filterAgamaJadwal');
    if (select) select.value = '';
}

// ============================================================
//  8. UPDATE PRAYER TIMES (ALADHAN API)
// ============================================================
async function updatePrayerTimes() {
    const date = document.getElementById('prayerDate').value;
    if (!date) { showToast('Pilih tanggal terlebih dahulu.', 'warning'); return; }
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

// ============================================================
//  9. CRUD MODAL
// ============================================================
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

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
}

async function saveJadwal(index) {
    const agama = document.getElementById('jmAgama').value;
    const nama = document.getElementById('jmNama').value.trim();
    const mulai = document.getElementById('jmMulai').value;
    const selesai = document.getElementById('jmSelesai').value;
    const icon = document.getElementById('jmIcon').value;
    const color = document.getElementById('jmColor').value;
    if (!nama || !mulai || !selesai) { showToast('Nama, Mulai, Selesai wajib diisi.', 'error'); return; }
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

function editJadwal(index) { showJadwalModal(index); }

// ============================================================
//  10. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.renderJadwal = renderJadwal;
window.refreshJadwal = refreshJadwal;
window.showJadwalModal = showJadwalModal;
window.saveJadwal = saveJadwal;
window.deleteJadwal = deleteJadwal;
window.editJadwal = editJadwal;
window.updatePrayerTimes = updatePrayerTimes;
window.changeFilterAgamaJadwal = changeFilterAgamaJadwal;
window.resetFilterJadwal = resetFilterJadwal;
window.closeModal = closeModal;

console.log('✅ Jadwal module loaded');