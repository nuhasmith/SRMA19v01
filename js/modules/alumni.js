// ============================================================
//  ALUMNI.JS – Data Alumni
//  SRMA 19 Bantul - Admin Dashboard SPA
// ============================================================

// ============================================================
//  1. EXPORTS
// ============================================================
export { renderAlumni };

// ============================================================
//  2. STATE
// ============================================================
let alumniData = [];
let alumniFiltered = [];

// ============================================================
//  3. HELPERS & CACHE
// ============================================================
const { getCachedData, setCachedData, showToast } = window;
const CACHE_KEY = 'srma19_admin_data';

// ============================================================
//  4. RENDER ALUMNI
// ============================================================
function renderAlumni(container) {
    // Ambil data dari cache jika belum ada
    if (alumniData.length === 0) {
        const cached = getCachedData();
        if (cached?.alumni) {
            alumniData = cached.alumni;
            alumniFiltered = [...alumniData];
        }
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

// ============================================================
//  5. REFRESH DATA
// ============================================================
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

// ============================================================
//  6. FILTER
// ============================================================
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

function resetFilterAlumni() {
    document.getElementById('searchAlumni').value = '';
    document.getElementById('filterAngkatanAlumni').value = '';
    applyFilterAlumni();
}

// ============================================================
//  7. RENDER TABLE
// ============================================================
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

// ============================================================
//  8. EXPORT PDF
// ============================================================
function exportPDFAlumni() {
    if (!alumniFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
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

// ============================================================
//  9. EXPORT CSV
// ============================================================
function exportCSVAlumni() {
    if (!alumniFiltered.length) { showToast('Tidak ada data.', 'warning'); return; }
    const rows = [['Kode','Nama','JK','Agama','Asal','Rombel','Angkatan','Tanggal Lulus']];
    alumniFiltered.forEach(a => rows.push([String(a.Kode||''), a.Nama||'', a.Jenis_Kelamin||a.jk||'', a.Agama||'', a.Asal||'', a.Rombel||'', a.Angkatan||'', a.Tanggal_Lulus||'']));
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `alumni_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    showToast('✅ CSV berhasil diunduh.', 'success');
}

// ============================================================
//  10. EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================================
window.renderAlumni = renderAlumni;
window.refreshAlumni = refreshAlumni;
window.applyFilterAlumni = applyFilterAlumni;
window.resetFilterAlumni = resetFilterAlumni;
window.exportPDFAlumni = exportPDFAlumni;
window.exportCSVAlumni = exportCSVAlumni;

console.log('✅ Alumni module loaded');