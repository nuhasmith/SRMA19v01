// ============================================
// GOOGLE APPS SCRIPT - SRMA 19 Bantul
// Versi 16.0 - Lengkap: Peserta, Absensi, Petugas, Jadwal, Izin, Wali Asuh, Alumni, Login Log
// Fitur: Sinkronisasi Jumlah Murid Wali Asuh, Generate Barcode, Kop Surat
// ============================================

const SHEET_PESERTA = 'Peserta';
const SHEET_ABSENSI = 'Absensi';
const SHEET_PETUGAS = 'Petugas';
const SHEET_JADWAL = 'Jadwal';
const SHEET_IZIN = 'Izin';
const SHEET_ALUMNI = 'Alumni';
const SHEET_LOGIN_LOG = 'LoginLog';
const SHEET_WALI_ASUH = 'WaliAsuh';
const TIMEZONE = 'Asia/Jakarta';

// ============================================
// DATA DUMMY & DEFAULT
// ============================================

const DUMMY_PESERTA = [
  ['SRMA19-001', 'Aditya Pratama',  'Laki-laki', 'Islam',    'Bantul',       'Rombel 1', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-002', 'Bunga Lestari',   'Perempuan', 'Kristen',  'Sleman',       'Rombel 1', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-003', 'Cahyo Nugroho',   'Laki-laki', 'Katolik',  'Gunungkidul',  'Rombel 2', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-004', 'Dewi Sartika',    'Perempuan', 'Hindu',    'Kulon Progo',  'Rombel 2', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-005', 'Eko Saputra',     'Laki-laki', 'Islam',    'Bantul',       'Rombel 3', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-006', 'Fitriani',        'Perempuan', 'Islam',    'Sleman',       'Rombel 3', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-007', 'Gilang Ramadhan', 'Laki-laki', 'Islam',    'Gunungkidul',  'Rombel 4', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-008', 'Hana Amalia',     'Perempuan', 'Islam',    'Bantul',       'Rombel 4', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-009', 'Irfan Maulana',   'Laki-laki', 'Islam',    'Kulon Progo',  'Rombel 5', 'Aktif', '2025/2026', '', ''],
  ['SRMA19-010', 'Jasmine Putri',   'Perempuan', 'Kristen',  'Sleman',       'Rombel 5', 'Aktif', '2025/2026', '', ''],
];

const DEFAULT_PETUGAS = [
  ['admin',    '123456', 'Administrator',    'admin', 'Aktif', ''],
  ['petugas1', '654321', 'Petugas Lapangan', 'petugas', 'Aktif', '']
];

const DEFAULT_JADWAL = [
  ['1',  'Hindu',      'Puja & Meditasi Pagi',      '04:00', '05:00', 'fa-om', '#8b5cf6', 'rgba(139,92,246,0.1)'],
  ['2',  'Hindu',      'Puja & Meditasi Siang',     '11:30', '12:30', 'fa-om', '#8b5cf6', 'rgba(139,92,246,0.1)'],
  ['3',  'Hindu',      'Puja & Meditasi Petang',    '18:00', '19:00', 'fa-om', '#8b5cf6', 'rgba(139,92,246,0.1)'],
  ['4',  'Islam',      'Ibadah Sholat Shubuh',      '04:15', '04:45', 'fa-mosque', '#10b981', 'rgba(16,185,129,0.1)'],
  ['5',  'Islam',      'Ibadah Sholat Dhuhur',      '12:00', '12:30', 'fa-mosque', '#10b981', 'rgba(16,185,129,0.1)'],
  ['6',  'Islam',      'Ibadah Sholat Ashar',       '15:30', '16:00', 'fa-mosque', '#10b981', 'rgba(16,185,129,0.1)'],
  ['7',  'Islam',      'Ibadah Sholat Maghrib',     '17:45', '18:15', 'fa-mosque', '#10b981', 'rgba(16,185,129,0.1)'],
  ['8',  'Islam',      'Ibadah Sholat Isya',        '19:00', '19:30', 'fa-mosque', '#10b981', 'rgba(16,185,129,0.1)'],
  ['9',  'Katolik',    'Doa Pagi & Renungan',       '05:00', '05:30', 'fa-church', '#3b82f6', 'rgba(59,130,246,0.1)'],
  ['10', 'Katolik',    'Doa Angelus',               '12:00', '12:30', 'fa-church', '#3b82f6', 'rgba(59,130,246,0.1)'],
  ['11', 'Katolik',    'Doa Rosario/Pendalaman Iman','18:00', '18:30', 'fa-church', '#3b82f6', 'rgba(59,130,246,0.1)'],
  ['12', 'Katolik',    'Doa Malam & Refleksi',      '20:00', '20:30', 'fa-church', '#3b82f6', 'rgba(59,130,246,0.1)'],
  ['13', 'Kristen',    'Doa Pagi & Renungan Firman','05:00', '05:30', 'fa-cross', '#06b6d4', 'rgba(6,182,212,0.1)'],
  ['14', 'Kristen',    'Doa Siang / Saat Teduh',    '12:00', '12:30', 'fa-cross', '#06b6d4', 'rgba(6,182,212,0.1)'],
  ['15', 'Kristen',    'Ibadah Pujian & Pendalaman','18:00', '18:30', 'fa-cross', '#06b6d4', 'rgba(6,182,212,0.1)'],
  ['16', 'Kristen',    'Doa Malam & Refleksi',      '20:00', '20:30', 'fa-cross', '#06b6d4', 'rgba(6,182,212,0.1)'],
  ['17', 'Buddha',     'Puja Bakti Pagi & Meditasi','05:00', '05:20', 'fa-dharmachakra', '#f59e0b', 'rgba(245,158,11,0.1)'],
  ['18', 'Buddha',     'Refleksi Dhamma Siang',     '12:00', '12:30', 'fa-dharmachakra', '#f59e0b', 'rgba(245,158,11,0.1)'],
  ['19', 'Buddha',     'Puja Bakti Sore & Paritta', '18:00', '18:30', 'fa-dharmachakra', '#f59e0b', 'rgba(245,158,11,0.1)'],
  ['20', 'Buddha',     'Meditasi Malam & Refleksi', '20:00', '20:30', 'fa-dharmachakra', '#f59e0b', 'rgba(245,158,11,0.1)'],
  ['21', 'Penghayat',  'Doa Pagi & Hening Cipta',   '05:00', '05:30', 'fa-spa', '#22c55e', 'rgba(34,197,94,0.1)'],
  ['22', 'Penghayat',  'Refleksi Nilai Luhur',      '12:00', '12:30', 'fa-spa', '#22c55e', 'rgba(34,197,94,0.1)'],
  ['23', 'Penghayat',  'Pendalaman Budi Pekerti',   '18:00', '18:30', 'fa-spa', '#22c55e', 'rgba(34,197,94,0.1)'],
  ['24', 'Penghayat',  'Introspeksi & Doa Malam',   '20:00', '20:30', 'fa-spa', '#22c55e', 'rgba(34,197,94,0.1)'],
  ['25', 'Hindu',      'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['26', 'Islam',      'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['27', 'Katolik',    'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['28', 'Kristen',    'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['29', 'Buddha',     'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['30', 'Penghayat',  'Apel & Makan Pagi',         '06:00', '06:30', 'fa-users', '#0d6efd', 'rgba(13,110,253,0.1)'],
  ['31', 'Hindu',      'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['32', 'Islam',      'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['33', 'Katolik',    'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['34', 'Kristen',    'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['35', 'Buddha',     'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['36', 'Penghayat',  'Apel & Makan Siang',        '12:30', '13:00', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['37', 'Hindu',      'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['38', 'Islam',      'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['39', 'Katolik',    'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['40', 'Kristen',    'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['41', 'Buddha',     'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['42', 'Penghayat',  'Apel & Makan Malam',        '18:15', '18:45', 'fa-utensil-spoon', '#ef4444', 'rgba(239,68,68,0.1)'],
  ['43', 'Hindu',      'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)'],
  ['44', 'Islam',      'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)'],
  ['45', 'Katolik',    'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)'],
  ['46', 'Kristen',    'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)'],
  ['47', 'Buddha',     'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)'],
  ['48', 'Penghayat',  'Apel Malam',                '21:00', '21:30', 'fa-moon', '#6366f1', 'rgba(99,102,241,0.1)']
];

const SRMA_COORDINATES = { lat: -7.80694, lng: 110.34333 };

// ============================================
// 1. RESPONSE HELPER
// ============================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 2. ENTRY POINTS
// ============================================
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  ensureSheetsReady();
  let params = e.parameter || {};
  if (e.postData && e.postData.contents) {
    try {
      const bodyParams = JSON.parse(e.postData.contents);
      Object.assign(params, bodyParams);
    } catch (_) {
      const pairs = e.postData.contents.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
  }

  const action = params.action || '';
  switch (action) {
    case 'ping':            return jsonResponse({ status: 'ok', time: getCurrentTime() });
    case 'auth':            return jsonResponse(authenticate(params.username, params.pin, params.device, params.ip));
    case 'reset_pin':       return jsonResponse(resetPin(params.username));
    case 'search':          return jsonResponse(searchPeserta(params.code));
    case 'record':          return jsonResponse(recordAbsensi(params));
    case 'list_peserta':    return jsonResponse(listPeserta());
    case 'list_absensi':    return jsonResponse(listAbsensi(params.tanggal, params.sesi, params.page, params.limit));
    case 'delete_absensi':  return jsonResponse(deleteAbsensi(params.timestamps));
    case 'get_jadwal':      return jsonResponse(getJadwal());
    case 'save_jadwal':     return jsonResponse(saveJadwal(params));
    case 'add_peserta':     return jsonResponse(addPeserta(params));
    case 'update_peserta':  return jsonResponse(updatePeserta(params));
    case 'delete_peserta':  return jsonResponse(deletePeserta(params));
    case 'import_peserta':  return jsonResponse(importPeserta(params));
    case 'list_petugas':    return jsonResponse(listPetugas());
    case 'add_petugas':     return jsonResponse(addPetugas(params));
    case 'update_petugas':  return jsonResponse(updatePetugas(params));
    case 'delete_petugas':  return jsonResponse(deletePetugas(params));
    case 'get_profile':     return jsonResponse(getProfile(params.username));
    case 'update_profile':  return jsonResponse(updateProfile(params));
    case 'add_izin':        return jsonResponse(addIzin(params));
    case 'update_izin':     return jsonResponse(updateIzin(params));
    case 'delete_izin':     return jsonResponse(deleteIzin(params));
    case 'list_izin':       return jsonResponse(listIzin(params));
    case 'generate_absence':return jsonResponse(generateAbsence(params));
    case 'arsip_lulus':     return jsonResponse(arsipLulus());
    case 'list_alumni':     return jsonResponse(listAlumni());
    case 'list_login_log':  return jsonResponse(listLoginLog(params));
    case 'update_prayer_times': return jsonResponse(updateIslamicPrayerTimes(params));
    case 'list_wali_asuh':  return jsonResponse(listWaliAsuh());
    case 'add_wali_asuh':   return jsonResponse(addWaliAsuh(params));
    case 'update_wali_asuh':return jsonResponse(updateWaliAsuh(params));
    case 'delete_wali_asuh':return jsonResponse(deleteWaliAsuh(params));
    case 'sync_wali_count': return jsonResponse(syncWaliAsuhCount());
    case 'setup':           return jsonResponse(manualSetup());
    default:
      return jsonResponse({ status: 'error', message: 'Action tidak dikenal.' });
  }
}

// ============================================
// 3. SETUP SHEET
// ============================================
function ensureSheetsReady() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheet(ss, SHEET_PESERTA, [
    'Kode', 'Nama', 'Jenis_Kelamin', 'Agama', 'Asal',
    'Rombel', 'Keterangan', 'Angkatan', 'Wali_Asuh_1', 'Wali_Asuh_2'
  ], '#0d6efd', DUMMY_PESERTA);
  initSheet(ss, SHEET_ABSENSI, [
    'Timestamp', 'Tanggal', 'Jam', 'Kode', 'Nama', 'Sesi', 'Sesi_Nama', 'Status', 'Petugas',
    'Puasa', 'Pelanggaran', 'Pelanggaran_Keterangan', 'Kondisi_Kesehatan', 'Keterangan_Kesehatan'
  ], '#10b981', []);
  initSheet(ss, SHEET_PETUGAS, ['Username', 'PIN', 'Nama', 'Role', 'Status', 'Foto'], '#6366f1', DEFAULT_PETUGAS);
  initSheet(ss, SHEET_JADWAL, ['ID', 'Agama', 'Nama', 'Mulai', 'Selesai', 'Icon', 'Color', 'BgColor'], '#f59e0b', DEFAULT_JADWAL);
  initSheet(ss, SHEET_IZIN, ['ID', 'Kode_Peserta', 'Nama_Peserta', 'Tanggal', 'Keterangan', 'Bukti_Surat', 'Petugas'], '#f43f5e', []);
  initSheet(ss, SHEET_ALUMNI, ['Kode', 'Nama', 'Jenis_Kelamin', 'Agama', 'Asal', 'Rombel', 'Angkatan', 'Tanggal_Lulus'], '#6c757d', []);
  initSheet(ss, SHEET_LOGIN_LOG, ['Timestamp', 'Username', 'Nama', 'Role', 'Device', 'IP'], '#adb5bd', []);
  initSheet(ss, SHEET_WALI_ASUH, ['ID', 'Nama', 'Nomor_HP', 'Alamat', 'Jumlah_Murid_Asuh', 'Status', 'Foto', 'Keterangan'], '#8b5cf6', []);
}

function initSheet(ss, name, headers, color, data) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    try { sheet = ss.insertSheet(name); } catch (e) { sheet = ss.getSheetByName(name); }
  }
  if (!sheet) return;
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(color).setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  if (data.length > 0 && sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
}

function manualSetup() { ensureSheetsReady(); return { status: 'ok', message: 'Sheet siap.' }; }

// ============================================
// 4. AUTH & RESET PIN
// ============================================
function authenticate(username, pin, device, ip) {
  if (!username || !pin) return { status: 'error', message: 'Username dan PIN wajib diisi.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username.trim() && String(data[i][1]).trim() === pin.trim()) {
      const status = String(data[i][4] || '').trim() || 'Aktif';
      if (status !== 'Aktif') return { status: 'error', message: 'Akun dinonaktifkan.' };
      const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGIN_LOG);
      if (logSheet) {
        logSheet.appendRow([new Date(), username.trim(), String(data[i][2]).trim(), String(data[i][3]).trim(), device || 'Unknown', ip || 'Unknown']);
      }
      return { status: 'success', nama: String(data[i][2]).trim(), role: String(data[i][3]).trim(), token: Utilities.getUuid() };
    }
  }
  return { status: 'error', message: 'Username atau PIN salah.' };
}

function resetPin(username) {
  if (!username || username.trim() === '') return { status: 'error', message: 'Username wajib diisi.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const defaultPin = '123456';
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username.trim()) {
      sheet.getRange(i + 1, 2).setValue(defaultPin);
      return { status: 'ok', message: `PIN untuk ${username} telah direset ke ${defaultPin}.` };
    }
  }
  return { status: 'error', message: 'Username tidak ditemukan.' };
}

// ============================================
// 5. LIST & CRUD PESERTA
// ============================================
function getCachedPeserta() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('all_peserta');
  if (cached) return JSON.parse(cached);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PESERTA);
  if (!sheet) return [];
  const raw = sheet.getDataRange().getValues();
  const headers = raw[0].map(h => String(h).trim());
  const peserta = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = raw[i][idx] !== undefined ? raw[i][idx] : ''; });
    peserta.push(row);
  }
  cache.put('all_peserta', JSON.stringify(peserta), 300);
  return peserta;
}

function invalidatePesertaCache() { CacheService.getScriptCache().remove('all_peserta'); }

function listPeserta() {
  const peserta = getCachedPeserta();
  return { status: 'success', data: peserta, total: peserta.length };
}

function addPeserta(params) {
  const kode = (params.kode || '').trim().toUpperCase();
  const nama = (params.nama || '').trim();
  if (!kode || !nama) return { status: 'error', message: 'Kode dan Nama wajib.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PESERTA);
  if (!sheet) return { status: 'error', message: 'Sheet Peserta tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === kode) return { status: 'error', message: 'Kode sudah ada.' };
  }
  sheet.appendRow([
    kode, nama,
    params.jk || '', params.agama || '', params.asal || '',
    params.rombel || '', params.keterangan || 'Aktif', params.angkatan || '',
    params.wali_asuh_1 || '', params.wali_asuh_2 || ''
  ]);
  invalidatePesertaCache();
  syncWaliAsuhCount();
  return { status: 'ok', message: 'Peserta ditambahkan.' };
}

function updatePeserta(params) {
  const kode = (params.kode || '').trim().toUpperCase();
  if (!kode) return { status: 'error', message: 'Kode diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PESERTA);
  if (!sheet) return { status: 'error', message: 'Sheet Peserta tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const kodeIdx = headers.indexOf('kode');
  if (kodeIdx === -1) return { status: 'error', message: 'Kolom Kode tidak ditemukan.' };
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][kodeIdx]).trim().toUpperCase() === kode) { rowIdx = i; break; }
  }
  if (rowIdx === -1) return { status: 'error', message: 'Peserta tidak ditemukan.' };
  if (params.nama)       sheet.getRange(rowIdx + 1, headers.indexOf('nama') + 1).setValue(params.nama);
  if (params.jk) {
    const i = headers.findIndex(h => h === 'jenis_kelamin' || h === 'jk');
    if (i >= 0) sheet.getRange(rowIdx + 1, i + 1).setValue(params.jk);
  }
  if (params.agama)      { const i = headers.indexOf('agama'); if (i >= 0) sheet.getRange(rowIdx + 1, i + 1).setValue(params.agama); }
  if (params.asal)       sheet.getRange(rowIdx + 1, headers.indexOf('asal') + 1).setValue(params.asal);
  if (params.rombel)     sheet.getRange(rowIdx + 1, headers.indexOf('rombel') + 1).setValue(params.rombel);
  if (params.keterangan) sheet.getRange(rowIdx + 1, headers.indexOf('keterangan') + 1).setValue(params.keterangan);
  if (params.angkatan)   sheet.getRange(rowIdx + 1, headers.indexOf('angkatan') + 1).setValue(params.angkatan);
  if (params.wali_asuh_1 !== undefined) {
    const i = headers.indexOf('wali_asuh_1');
    if (i >= 0) sheet.getRange(rowIdx + 1, i + 1).setValue(params.wali_asuh_1);
  }
  if (params.wali_asuh_2 !== undefined) {
    const i = headers.indexOf('wali_asuh_2');
    if (i >= 0) sheet.getRange(rowIdx + 1, i + 1).setValue(params.wali_asuh_2);
  }
  invalidatePesertaCache();
  syncWaliAsuhCount();
  return { status: 'ok', message: 'Peserta diperbarui.' };
}

function deletePeserta(params) {
  const kode = (params.kode || '').trim().toUpperCase();
  if (!kode) return { status: 'error', message: 'Kode diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PESERTA);
  if (!sheet) return { status: 'error', message: 'Sheet Peserta tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const kodeIdx = headers.indexOf('kode');
  if (kodeIdx === -1) return { status: 'error', message: 'Kolom Kode tidak ditemukan.' };
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][kodeIdx]).trim().toUpperCase() === kode) {
      sheet.deleteRow(i + 1);
      invalidatePesertaCache();
      syncWaliAsuhCount();
      return { status: 'ok', message: 'Peserta dihapus.' };
    }
  }
  return { status: 'error', message: 'Peserta tidak ditemukan.' };
}

function importPeserta(params) {
  const csvData = params.data;
  if (!csvData) return { status: 'error', message: 'Data kosong.' };
  let rows;
  try { rows = JSON.parse(csvData); } catch (e) { return { status: 'error', message: 'Format salah.' }; }
  if (!Array.isArray(rows) || rows.length === 0) return { status: 'error', message: 'Array tidak valid.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PESERTA);
  if (!sheet) return { status: 'error', message: 'Sheet Peserta tidak ditemukan.' };
  let added = 0, updated = 0;
  rows.forEach(row => {
    if (!row[0] || !row[1]) return;
    const kode = String(row[0]).trim().toUpperCase();
    const existing = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < existing.length; i++) {
      if (String(existing[i][0]).trim().toUpperCase() === kode) {
        sheet.getRange(i + 1, 1, 1, 10).setValues([
          row[0], row[1], row[2] || '', row[3] || '', row[4] || '',
          row[5] || '', row[6] || 'Aktif', row[7] || '', row[8] || '', row[9] || ''
        ]);
        found = true; updated++; break;
      }
    }
    if (!found) {
      sheet.appendRow([
        row[0], row[1], row[2] || '', row[3] || '', row[4] || '',
        row[5] || '', row[6] || 'Aktif', row[7] || '', row[8] || '', row[9] || ''
      ]);
      added++;
    }
  });
  invalidatePesertaCache();
  syncWaliAsuhCount();
  return { status: 'ok', message: 'Impor selesai.', added, updated };
}

// ============================================
// 6. SEARCH & RECORD ABSENSI
// ============================================
function searchPeserta(code) {
  if (!code || code.trim() === '') return { status: 'error', message: 'Kode peserta kosong.' };
  const peserta = getCachedPeserta();
  for (const p of peserta) {
    if ((p.Kode || '').toUpperCase() === code.trim().toUpperCase()) {
      const status = (p.Keterangan || 'Aktif').trim();
      if (status !== 'Aktif') return { status: 'error', message: `Peserta ${code} sudah tidak aktif (${status}).` };
      const agama = p.Agama || 'Islam';
      const currentTime = getCurrentTime();
      const sesiInfo = determineSesi(currentTime, agama);
      return {
        status: 'success',
        code: p.Kode,
        nama: p.Nama || '-',
        jk: p.Jenis_Kelamin || p.jk || '-',
        agama: agama,
        sesi: sesiInfo.sesi,
        sesi_nama: sesiInfo.nama,
        dalam_sesi: sesiInfo.dalam_sesi,
        waktu_server: currentTime,
        wali_asuh_1: p.Wali_Asuh_1 || '',
        wali_asuh_2: p.Wali_Asuh_2 || ''
      };
    }
  }
  return { status: 'not_found', message: 'Peserta tidak ditemukan.' };
}

function recordAbsensi(params) {
  const code = (params.code || '').trim().toUpperCase();
  const nama = (params.nama || '').trim();
  const sesi = (params.sesi || '').trim();
  const sesiNama = (params.sesi_nama || '').trim();
  const petugas = (params.petugas || '').trim();
  const status = (params.status || 'Hadir').trim();
  const puasa = (params.puasa || 'Tidak').trim();
  const pelanggaran = (params.pelanggaran || 'Tidak Ada').trim();
  const pelanggaranKeterangan = (params.pelanggaran_keterangan || '').trim();
  const kondisiKesehatan = (params.kondisi_kesehatan || 'Sehat').trim();
  const keteranganKesehatan = (params.keterangan_kesehatan || '').trim();

  if (!code || !nama) return { status: 'error', message: 'Kode dan nama wajib.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSENSI);
  if (!sheet) return { status: 'error', message: 'Sheet Absensi tidak ditemukan.' };
  const now = new Date();
  const currentTime = Utilities.formatDate(now, TIMEZONE, 'HH:mm');
  const currentDate = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd');
  const timestamp = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  let finalSesi = sesi, finalSesiNama = sesiNama;
  if (!finalSesiNama) {
    const info = determineSesi(currentTime, params.agama || '');
    finalSesi = info.sesi; finalSesiNama = info.nama;
  }
  const existing = sheet.getDataRange().getValues();
  if (existing.length > 1) {
    const hdrs = existing[0].map(h => String(h).trim());
    const kodeIdx = hdrs.indexOf('Kode'), sesiIdx = hdrs.indexOf('Sesi'), tglIdx = hdrs.indexOf('Tanggal');
    if (kodeIdx >= 0 && sesiIdx >= 0 && tglIdx >= 0) {
      for (let i = 1; i < existing.length; i++) {
        if (String(existing[i][kodeIdx]).trim().toUpperCase() === code &&
            String(existing[i][sesiIdx]).trim() === finalSesi &&
            String(existing[i][tglIdx]).trim() === currentDate) {
          return { status: 'already_recorded', message: 'Peserta sudah tercatat di sesi ini.' };
        }
      }
    }
  }
  sheet.appendRow([
    timestamp, currentDate, currentTime, code, nama,
    finalSesi, finalSesiNama, status, petugas,
    puasa, pelanggaran, pelanggaranKeterangan, kondisiKesehatan, keteranganKesehatan
  ]);
  return { status: 'recorded', message: 'Kehadiran dicatat.', code, nama, sesi: finalSesi, sesi_nama: finalSesiNama, tanggal: currentDate, jam: currentTime, timestamp, petugas };
}

// ============================================
// 7. LIST & DELETE ABSENSI
// ============================================
function listAbsensi(tanggal, sesi, page, limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSENSI);
  if (!sheet) return { status: 'error', message: 'Sheet Absensi tidak ditemukan.' };
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return { status: 'success', data: [], total: 0 };
  const headers = raw[0].map(h => String(h).trim());
  const result = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      let value = raw[i][idx];
      if (h === 'Tanggal' && value instanceof Date) value = Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd');
      if (h === 'Jam' && value instanceof Date) value = Utilities.formatDate(value, TIMEZONE, 'HH:mm');
      if (h === 'Timestamp' && value instanceof Date) value = Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      row[h] = value !== undefined ? value : '';
    });
    if (tanggal && row['Tanggal'] && String(row['Tanggal']).trim() !== tanggal.trim()) continue;
    if (sesi && row['Sesi_Nama'] && String(row['Sesi_Nama']).trim() !== sesi.trim()) continue;
    result.push(row);
  }
  const total = result.length;
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 100;
  const start = (pageNum - 1) * pageSize;
  const paginated = result.slice(start, start + pageSize);
  return { status: 'success', data: paginated, total, page: pageNum, limit: pageSize };
}

function deleteAbsensi(timestamps) {
  if (!timestamps) return { status: 'error', message: 'Parameter timestamps diperlukan.' };
  let tsArray;
  try { tsArray = JSON.parse(timestamps); } catch (e) { return { status: 'error', message: 'Format timestamps tidak valid.' }; }
  if (!Array.isArray(tsArray) || tsArray.length === 0) return { status: 'error', message: 'Array timestamps kosong.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSENSI);
  if (!sheet) return { status: 'error', message: 'Sheet Absensi tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const tsIdx = headers.indexOf('Timestamp');
  if (tsIdx === -1) return { status: 'error', message: 'Kolom Timestamp tidak ditemukan.' };
  const rowsToDelete = [];
  for (let i = 1; i < data.length; i++) {
    const rowTs = String(data[i][tsIdx]).trim();
    if (tsArray.includes(rowTs)) rowsToDelete.push(i + 1);
  }
  if (rowsToDelete.length === 0) return { status: 'error', message: 'Tidak ada data yang cocok.' };
  rowsToDelete.sort((a, b) => b - a).forEach(row => sheet.deleteRow(row));
  return { status: 'ok', message: `${rowsToDelete.length} entri absensi dihapus.` };
}

// ============================================
// 8. JADWAL - CRUD KHUSUS ADMIN
// ============================================
function getCachedJadwal() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('all_jadwal');
  if (cached) return JSON.parse(cached);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JADWAL);
  if (!sheet || sheet.getLastRow() <= 1) {
    const data = DEFAULT_JADWAL.map(r => ({ id: parseInt(r[0]), agama: r[1], nama: r[2], mulai: r[3], selesai: r[4], icon: r[5], color: r[6], bg: r[7] }));
    cache.put('all_jadwal', JSON.stringify(data), 300);
    return data;
  }
  const raw = sheet.getDataRange().getValues();
  const jadwal = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    jadwal.push({
      id: parseInt(raw[i][0]) || i,
      agama: raw[i][1] || 'Islam',
      nama: raw[i][2],
      mulai: formatTimeValue(raw[i][3]),
      selesai: formatTimeValue(raw[i][4]),
      icon: raw[i][5] || 'fa-circle',
      color: raw[i][6] || '#0d6efd',
      bg: raw[i][7] || 'rgba(13,110,253,0.1)'
    });
  }
  cache.put('all_jadwal', JSON.stringify(jadwal), 300);
  return jadwal;
}

function invalidateJadwalCache() { CacheService.getScriptCache().remove('all_jadwal'); }

function getJadwal() { return { status: 'success', data: getCachedJadwal() }; }

function saveJadwal(params) {
  const jadwalData = params.data;
  if (!jadwalData) return { status: 'error', message: 'Data kosong.' };
  let jadwal; try { jadwal = JSON.parse(jadwalData); } catch(e) { return { status: 'error', message: 'Format salah.' }; }
  if (!Array.isArray(jadwal) || jadwal.length === 0) return { status: 'error', message: 'Array tidak valid.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JADWAL);
  if (!sheet) return { status: 'error', message: 'Sheet Jadwal tidak ditemukan.' };
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).clearContent();
  const rows = jadwal.map(j => [
    j.id, j.agama || 'Islam', j.nama, j.mulai, j.selesai,
    j.icon || 'fa-circle', j.color || '#0d6efd', j.bg || 'rgba(13,110,253,0.1)'
  ]);
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  invalidateJadwalCache();
  return { status: 'ok', message: 'Jadwal disimpan.', count: jadwal.length };
}

function getSesiByAgama(agama) {
  const jadwal = getCachedJadwal();
  return jadwal.filter(j => j.agama === agama).map(j => ({ id: j.id, agama: j.agama, nama: j.nama, mulai: j.mulai, selesai: j.selesai }));
}

function determineSesi(currentTime, agama) {
  const sesi = getSesiByAgama(agama);
  for (let i = 0; i < sesi.length; i++) {
    if (currentTime >= sesi[i].mulai && currentTime <= sesi[i].selesai) {
      return { sesi: String(sesi[i].id), nama: sesi[i].nama, dalam_sesi: true };
    }
  }
  return { sesi: 'di_luar_sesi', nama: 'Di Luar Sesi (' + currentTime + ')', dalam_sesi: false };
}

function formatTimeValue(value) {
  if (value == null || value === '') return '00:00';
  if (value instanceof Date) {
    const hours = value.getHours(); const minutes = value.getMinutes();
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed.padStart(5, '0');
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(':'); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    const num = parseFloat(trimmed); if (!isNaN(num)) return convertExcelTimeToHHmm(num);
    return trimmed;
  }
  if (typeof value === 'number') return convertExcelTimeToHHmm(value);
  return String(value);
}

function convertExcelTimeToHHmm(decimal) {
  const totalMinutes = Math.round(decimal * 24 * 60);
  const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

// ============================================
// 9. PETUGAS (CRUD + Profil)
// ============================================
function getCachedPetugas() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('all_petugas');
  if (cached) return JSON.parse(cached);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return [];
  const raw = sheet.getDataRange().getValues();
  const headers = raw[0].map(h => String(h).trim());
  const petugas = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {}; headers.forEach((h, idx) => { row[h] = raw[i][idx] !== undefined ? raw[i][idx] : ''; });
    if (!row['Status']) row['Status'] = 'Aktif';
    petugas.push(row);
  }
  cache.put('all_petugas', JSON.stringify(petugas), 300);
  return petugas;
}

function invalidatePetugasCache() { CacheService.getScriptCache().remove('all_petugas'); }

function listPetugas() { const petugas = getCachedPetugas(); return { status: 'success', data: petugas, total: petugas.length }; }

function addPetugas(params) {
  const username = (params.username || '').trim(), pin = (params.pin || '').trim(), nama = (params.nama || '').trim();
  const role = (params.role || 'petugas').trim(), status = (params.status || 'Aktif').trim(), foto = (params.foto || '').trim();
  if (!username || !pin || !nama) return { status: 'error', message: 'Username, PIN, Nama wajib.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === username) return { status: 'error', message: 'Username sudah ada.' }; }
  sheet.appendRow([username, pin, nama, role, status, foto]);
  invalidatePetugasCache();
  return { status: 'ok', message: 'Petugas ditambahkan.' };
}

function updatePetugas(params) {
  const username = (params.username || '').trim();
  if (!username) return { status: 'error', message: 'Username diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) {
      const row = i + 1;
      if (params.pin)    sheet.getRange(row, 2).setValue(params.pin.trim());
      if (params.nama)   sheet.getRange(row, 3).setValue(params.nama.trim());
      if (params.role)   sheet.getRange(row, 4).setValue(params.role.trim());
      if (params.status) sheet.getRange(row, 5).setValue(params.status.trim());
      if (params.foto)   sheet.getRange(row, 6).setValue(params.foto.trim());
      invalidatePetugasCache();
      return { status: 'ok', message: 'Data petugas diperbarui.' };
    }
  }
  return { status: 'error', message: 'Petugas tidak ditemukan.' };
}

function deletePetugas(params) {
  const username = (params.username || '').trim();
  if (!username) return { status: 'error', message: 'Username diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) { sheet.deleteRow(i + 1); invalidatePetugasCache(); return { status: 'ok', message: 'Petugas dihapus.' }; }
  }
  return { status: 'error', message: 'Petugas tidak ditemukan.' };
}

function getProfile(username) {
  const petugas = getCachedPetugas();
  const user = petugas.find(p => p.Username === username);
  if (user) return { status: 'success', data: { Username: user.Username, Nama: user.Nama, Role: user.Role, Status: user.Status || 'Aktif', Foto: user.Foto || '' } };
  return { status: 'error', message: 'Profil tidak ditemukan.' };
}

function updateProfile(params) {
  const username = (params.username || '').trim();
  if (!username) return { status: 'error', message: 'Username diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PETUGAS);
  if (!sheet) return { status: 'error', message: 'Sheet Petugas tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === username) {
      const row = i + 1;
      if (params.nama) sheet.getRange(row, 3).setValue(params.nama);
      if (params.pin)  sheet.getRange(row, 2).setValue(params.pin);
      if (params.foto) { const fotoValue = String(params.foto).substring(0, 49000); sheet.getRange(row, 6).setValue(fotoValue); }
      invalidatePetugasCache();
      return { status: 'ok', message: 'Profil diperbarui.' };
    }
  }
  return { status: 'error', message: 'Petugas tidak ditemukan.' };
}

// ============================================
// 10. IZIN - CRUD
// ============================================
function addIzin(params) {
  const kode = (params.kode_peserta || '').trim().toUpperCase();
  const nama = (params.nama_peserta || '').trim();
  const tgl = (params.tanggal || '').trim();
  const keterangan = (params.keterangan || '').trim();
  const petugas = (params.petugas || '').trim();
  if (!kode || !nama || !tgl || !keterangan) return { status: 'error', message: 'Kode, nama, tanggal, dan keterangan wajib.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IZIN);
  if (!sheet) return { status: 'error', message: 'Sheet Izin tidak ditemukan.' };
  const id = new Date().getTime();
  let bukti = (params.bukti_surat || '').substring(0, 49000);
  sheet.appendRow([id, kode, nama, tgl, keterangan, bukti, petugas]);
  return { status: 'ok', message: 'Izin berhasil ditambahkan.', id };
}

function updateIzin(params) {
  const id = parseInt(params.id);
  if (!id) return { status: 'error', message: 'ID izin diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IZIN);
  if (!sheet) return { status: 'error', message: 'Sheet Izin tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { status: 'error', message: 'Kolom ID tidak ditemukan.' };
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][idIdx]) === id) {
      const row = i + 1;
      if (params.keterangan) sheet.getRange(row, headers.indexOf('keterangan') + 1).setValue(params.keterangan);
      if (params.bukti_surat !== undefined) { const bukti = String(params.bukti_surat).substring(0, 49000); sheet.getRange(row, headers.indexOf('bukti_surat') + 1).setValue(bukti); }
      return { status: 'ok', message: 'Izin diperbarui.' };
    }
  }
  return { status: 'error', message: 'Izin tidak ditemukan.' };
}

function deleteIzin(params) {
  const id = parseInt(params.id);
  if (!id) return { status: 'error', message: 'ID izin diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IZIN);
  if (!sheet) return { status: 'error', message: 'Sheet Izin tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { status: 'error', message: 'Kolom ID tidak ditemukan.' };
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][idIdx]) === id) { sheet.deleteRow(i + 1); return { status: 'ok', message: 'Izin dihapus.' }; }
  }
  return { status: 'error', message: 'Izin tidak ditemukan.' };
}

function listIzin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IZIN);
  if (!sheet) return { status: 'error', message: 'Sheet Izin tidak ditemukan.' };
  const raw = sheet.getDataRange().getValues();
  const headers = raw[0].map(h => String(h).trim());
  const result = [];
  const kodeFilter = (params.kode_peserta || '').trim().toUpperCase();
  const tglFilter = (params.tanggal || '').trim();
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {}; headers.forEach((h, idx) => { row[h] = raw[i][idx] !== undefined ? raw[i][idx] : ''; });
    if (kodeFilter && String(row['Kode_Peserta']).toUpperCase() !== kodeFilter) continue;
    if (tglFilter && String(row['Tanggal']) !== tglFilter) continue;
    result.push(row);
  }
  return { status: 'success', data: result, total: result.length };
}

// ============================================
// 11. GENERATE TIDAK BERANGKAT + IZIN
// ============================================
function generateAbsence(params) {
  const tanggal = (params.tanggal || '').trim();
  if (!tanggal) return { status: 'error', message: 'Tanggal diperlukan (yyyy-MM-dd).' };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pesertaSheet = ss.getSheetByName(SHEET_PESERTA);
  const absensiSheet = ss.getSheetByName(SHEET_ABSENSI);
  const izinSheet = ss.getSheetByName(SHEET_IZIN);
  const jadwalSheet = ss.getSheetByName(SHEET_JADWAL);
  if (!pesertaSheet || !absensiSheet || !izinSheet || !jadwalSheet) return { status: 'error', message: 'Sheet tidak lengkap.' };

  const pesertaData = pesertaSheet.getDataRange().getValues();
  const headersP = pesertaData[0].map(h => String(h).trim().toLowerCase());
  const kodeIdx = headersP.indexOf('kode'), namaIdx = headersP.indexOf('nama'), ketIdx = headersP.indexOf('keterangan'), agamaIdx = headersP.indexOf('agama');
  const students = [];
  for (let i = 1; i < pesertaData.length; i++) {
    if (String(pesertaData[i][ketIdx] || '').trim() === 'Aktif') {
      students.push({ kode: String(pesertaData[i][kodeIdx]).trim().toUpperCase(), nama: String(pesertaData[i][namaIdx]).trim(), agama: String(pesertaData[i][agamaIdx] || 'Islam').trim() });
    }
  }

  const jadwalData = jadwalSheet.getDataRange().getValues();
  const sesiByAgama = {};
  for (let i = 1; i < jadwalData.length; i++) {
    if (jadwalData[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const agama = String(jadwalData[i][1]).trim();
    if (!sesiByAgama[agama]) sesiByAgama[agama] = [];
    sesiByAgama[agama].push({ id: String(jadwalData[i][0]).trim(), nama: jadwalData[i][2], mulai: formatTimeValue(jadwalData[i][3]), selesai: formatTimeValue(jadwalData[i][4]) });
  }

  const izinData = izinSheet.getDataRange().getValues();
  const izinHeaders = izinData[0].map(h => String(h).trim());
  const izinKodeIdx = izinHeaders.indexOf('Kode_Peserta'), izinTglIdx = izinHeaders.indexOf('Tanggal');
  const izinSet = new Set();
  for (let i = 1; i < izinData.length; i++) {
    if (String(izinData[i][izinTglIdx]).trim() === tanggal) izinSet.add(String(izinData[i][izinKodeIdx]).trim().toUpperCase());
  }

  const absensiData = absensiSheet.getDataRange().getValues();
  const absHeaders = absensiData[0].map(h => String(h).trim());
  const absKodeIdx = absHeaders.indexOf('Kode'), absSesiIdx = absHeaders.indexOf('Sesi'), absTglIdx = absHeaders.indexOf('Tanggal');
  const existingMap = new Map();
  for (let i = 1; i < absensiData.length; i++) {
    if (String(absensiData[i][absTglIdx]).trim() === tanggal) {
      existingMap.set(String(absensiData[i][absKodeIdx]).trim().toUpperCase() + '|' + String(absensiData[i][absSesiIdx]).trim(), true);
    }
  }

  const now = new Date();
  const currentTimeStr = Utilities.formatDate(now, TIMEZONE, 'HH:mm');
  const tanggalHariIni = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd');
  let processedIzin = 0, processedTidak = 0;

  for (const student of students) {
    const sesiList = sesiByAgama[student.agama] || [];
    if (sesiList.length === 0) continue;
    for (const sesi of sesiList) {
      if (tanggal === tanggalHariIni && currentTimeStr <= sesi.selesai) continue;
      const key = student.kode + '|' + sesi.id;
      if (!existingMap.has(key)) {
        const timestamp = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
        const jam = getCurrentTime();
        if (izinSet.has(student.kode)) {
          absensiSheet.appendRow([timestamp, tanggal, jam, student.kode, student.nama, sesi.id, sesi.nama, 'Izin', 'Sistem', 'Tidak', 'Tidak Ada', '', 'Sehat', '']);
          processedIzin++;
        } else {
          absensiSheet.appendRow([timestamp, tanggal, jam, student.kode, student.nama, sesi.id, sesi.nama, 'Tidak Berangkat', 'Sistem', 'Tidak', 'Tidak Ada', '', 'Sehat', '']);
          processedTidak++;
        }
        existingMap.set(key, true);
      }
    }
  }
  return { status: 'ok', message: `Proses selesai. ${processedIzin} izin, ${processedTidak} tidak berangkat ditambahkan.` };
}

// ============================================
// 12. ARSIP LULUS & ALUMNI
// ============================================
function arsipLulus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pesertaSheet = ss.getSheetByName(SHEET_PESERTA);
  const alumniSheet = ss.getSheetByName(SHEET_ALUMNI);
  if (!pesertaSheet || !alumniSheet) return { status: 'error', message: 'Sheet tidak lengkap.' };
  const data = pesertaSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const kodeIdx = headers.indexOf('kode'), namaIdx = headers.indexOf('nama');
  const jkIdx = headers.findIndex(h => h === 'jenis_kelamin' || h === 'jk');
  const agamaIdx = headers.indexOf('agama'), asalIdx = headers.indexOf('asal');
  const rombelIdx = headers.indexOf('rombel'), ketIdx = headers.indexOf('keterangan'), angkatanIdx = headers.indexOf('angkatan');
  const rowsToArchive = [], rowsToDelete = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][ketIdx] || '').trim() === 'Lulus') {
      rowsToArchive.push([data[i][kodeIdx], data[i][namaIdx], jkIdx >= 0 ? data[i][jkIdx] : '', agamaIdx >= 0 ? data[i][agamaIdx] : '', asalIdx >= 0 ? data[i][asalIdx] : '', rombelIdx >= 0 ? data[i][rombelIdx] : '', angkatanIdx >= 0 ? data[i][angkatanIdx] : '', new Date().toISOString().split('T')[0]]);
      rowsToDelete.push(i + 1);
    }
  }
  if (rowsToArchive.length === 0) return { status: 'ok', message: 'Tidak ada peserta yang perlu diarsipkan.' };
  alumniSheet.getRange(alumniSheet.getLastRow() + 1, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
  rowsToDelete.sort((a, b) => b - a).forEach(row => pesertaSheet.deleteRow(row));
  invalidatePesertaCache();
  syncWaliAsuhCount();
  return { status: 'ok', message: `${rowsToArchive.length} peserta lulus diarsipkan.` };
}

function listAlumni() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ALUMNI);
  if (!sheet) return { status: 'error', message: 'Sheet Alumni tidak ditemukan.' };
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return { status: 'success', data: [], total: 0 };
  const headers = raw[0].map(h => String(h).trim());
  const alumni = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(c => c === '' || c === null)) continue;
    const row = {}; headers.forEach((h, idx) => { row[h] = raw[i][idx]; });
    alumni.push(row);
  }
  return { status: 'success', data: alumni, total: alumni.length };
}

// ============================================
// 13. LOGIN LOG
// ============================================
function listLoginLog(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGIN_LOG);
  if (!sheet) return { status: 'error', message: 'Sheet Log tidak ditemukan.' };
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return { status: 'success', data: [], total: 0 };
  const headers = raw[0].map(h => String(h).trim());
  const logs = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      let val = raw[i][idx];
      if (val instanceof Date) val = Utilities.formatDate(val, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      row[h] = val !== undefined ? val : '';
    });
    logs.push(row);
  }
  logs.reverse();
  const limit = parseInt(params.limit) || 500;
  return { status: 'success', data: logs.slice(0, limit), total: logs.length };
}

// ============================================
// 14. JADWAL SHOLAT OTOMATIS (Aladhan API)
// ============================================
function getPrayerTimesForLocation(date) {
  if (!date) date = new Date();
  const dateStr = Utilities.formatDate(date, TIMEZONE, 'dd-MM-yyyy');
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${SRMA_COORDINATES.lat}&longitude=${SRMA_COORDINATES.lng}&method=2&school=1`;
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const data = JSON.parse(response.getContentText());
    if (data.code !== 200) throw new Error('Gagal mengambil jadwal sholat');
    return data.data.timings;
  } catch (e) {
    console.error('Error fetching prayer times:', e);
    return null;
  }
}

function updateIslamicPrayerTimes(params) {
  const dateParam = params.date || new Date();
  const date = typeof dateParam === 'string' ? new Date(dateParam + 'T00:00:00') : dateParam;
  const timings = getPrayerTimesForLocation(date);
  if (!timings) return { status: 'error', message: 'Gagal mengambil jadwal sholat dari API.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JADWAL);
  if (!sheet) return { status: 'error', message: 'Sheet Jadwal tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id'), agamaIdx = headers.indexOf('agama');
  const namaIdx = headers.indexOf('nama'), mulaiIdx = headers.indexOf('mulai'), selesaiIdx = headers.indexOf('selesai');
  if (idIdx === -1) return { status: 'error', message: 'Kolom ID tidak ditemukan.' };
  const prayerMap = {
    'Ibadah Sholat Dhuhur': { key: 'Dhuhr', durasi: 30 },
    'Ibadah Sholat Ashar': { key: 'Asr', durasi: 30 },
    'Ibadah Sholat Maghrib': { key: 'Maghrib', durasi: 30 },
    'Ibadah Sholat Isya': { key: 'Isha', durasi: 30 },
    'Ibadah Sholat Subuh': { key: 'Fajr', durasi: 30 }
  };
  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    const jadwalId = String(data[i][idIdx]);
    const namaKegiatan = String(data[i][namaIdx]).trim();
    const agama = String(data[i][agamaIdx]).trim();
    if (agama === 'Islam' && (namaKegiatan.includes('Sholat') || namaKegiatan.includes('Ibadah'))) {
      const prayerInfo = prayerMap[namaKegiatan];
      if (prayerInfo && timings[prayerInfo.key]) {
        const startTime = timings[prayerInfo.key];
        const startParts = startTime.split(':');
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = startMinutes + prayerInfo.durasi;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = String(endHours).padStart(2, '0') + ':' + String(endMins).padStart(2, '0');
        sheet.getRange(i + 1, mulaiIdx + 1).setValue(startTime);
        sheet.getRange(i + 1, selesaiIdx + 1).setValue(endTime);
        updated++;
      }
    }
  }
  invalidateJadwalCache();
  return { status: 'ok', message: `${updated} jadwal sholat diperbarui otomatis untuk tanggal ${Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd')}.` };
}

// ============================================
// 15. WALI ASUH - CRUD + Sinkronisasi
// ============================================
function listWaliAsuh() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_WALI_ASUH);
  if (!sheet) return { status: 'error', message: 'Sheet WaliAsuh tidak ditemukan.' };
  const raw = sheet.getDataRange().getValues();
  if (raw.length <= 1) return { status: 'success', data: [], total: 0 };
  const headers = raw[0].map(h => String(h).trim());
  const result = [];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].every(cell => cell === '' || cell === null || cell === undefined)) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = raw[i][idx] !== undefined ? raw[i][idx] : ''; });
    result.push(row);
  }
  return { status: 'success', data: result, total: result.length };
}

function syncWaliAsuhCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pesertaSheet = ss.getSheetByName(SHEET_PESERTA);
  const waliSheet = ss.getSheetByName(SHEET_WALI_ASUH);
  if (!pesertaSheet || !waliSheet) return { status: 'error', message: 'Sheet tidak ditemukan.' };
  const pesertaData = pesertaSheet.getDataRange().getValues();
  const pesertaHeaders = pesertaData[0].map(h => String(h).trim().toLowerCase());
  const wali1Idx = pesertaHeaders.indexOf('wali_asuh_1');
  const wali2Idx = pesertaHeaders.indexOf('wali_asuh_2');
  if (wali1Idx === -1 || wali2Idx === -1) return { status: 'error', message: 'Kolom Wali_Asuh_1 atau Wali_Asuh_2 tidak ditemukan.' };
  const countMap = {};
  for (let i = 1; i < pesertaData.length; i++) {
    const wali1 = String(pesertaData[i][wali1Idx] || '').trim();
    const wali2 = String(pesertaData[i][wali2Idx] || '').trim();
    const status = String(pesertaData[i][pesertaHeaders.indexOf('keterangan')] || 'Aktif').trim();
    if (status !== 'Aktif') continue;
    if (wali1) countMap[wali1] = (countMap[wali1] || 0) + 1;
    if (wali2) countMap[wali2] = (countMap[wali2] || 0) + 1;
  }
  const waliData = waliSheet.getDataRange().getValues();
  const waliHeaders = waliData[0].map(h => String(h).trim().toLowerCase());
  const namaIdx = waliHeaders.indexOf('nama');
  const jumlahIdx = waliHeaders.indexOf('jumlah_murid_asuh');
  if (namaIdx === -1 || jumlahIdx === -1) return { status: 'error', message: 'Kolom Nama atau Jumlah_Murid_Asuh tidak ditemukan.' };
  let updated = 0;
  for (let i = 1; i < waliData.length; i++) {
    const nama = String(waliData[i][namaIdx] || '').trim();
    if (nama) {
      const count = countMap[nama] || 0;
      const currentCount = parseInt(waliData[i][jumlahIdx]) || 0;
      if (count !== currentCount) {
        waliSheet.getRange(i + 1, jumlahIdx + 1).setValue(count);
        updated++;
      }
    }
  }
  return { status: 'ok', message: `${updated} wali asuh diperbarui.` };
}

function addWaliAsuh(params) {
  const nama = (params.nama || '').trim();
  const nomorHp = (params.nomor_hp || '').trim();
  const alamat = (params.alamat || '').trim();
  const jumlahMurid = parseInt(params.jumlah_murid) || 0;
  const status = (params.status || 'Aktif').trim();
  const foto = (params.foto || '').substring(0, 49000);
  const keterangan = (params.keterangan || '').trim();
  if (!nama) return { status: 'error', message: 'Nama wali asuh wajib diisi.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_WALI_ASUH);
  if (!sheet) return { status: 'error', message: 'Sheet WaliAsuh tidak ditemukan.' };
  const id = Date.now();
  sheet.appendRow([id, nama, nomorHp, alamat, jumlahMurid, status, foto, keterangan]);
  syncWaliAsuhCount();
  return { status: 'ok', message: 'Wali asuh berhasil ditambahkan.', id };
}

function updateWaliAsuh(params) {
  const id = parseInt(params.id);
  if (!id) return { status: 'error', message: 'ID wali asuh diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_WALI_ASUH);
  if (!sheet) return { status: 'error', message: 'Sheet WaliAsuh tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { status: 'error', message: 'Kolom ID tidak ditemukan.' };
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][idIdx]) === id) {
      const row = i + 1;
      if (params.nama) sheet.getRange(row, headers.indexOf('nama') + 1).setValue(params.nama.trim());
      if (params.nomor_hp) sheet.getRange(row, headers.indexOf('nomor_hp') + 1).setValue(params.nomor_hp.trim());
      if (params.alamat) sheet.getRange(row, headers.indexOf('alamat') + 1).setValue(params.alamat.trim());
      if (params.jumlah_murid !== undefined) sheet.getRange(row, headers.indexOf('jumlah_murid') + 1).setValue(parseInt(params.jumlah_murid) || 0);
      if (params.status) sheet.getRange(row, headers.indexOf('status') + 1).setValue(params.status.trim());
      if (params.foto !== undefined) sheet.getRange(row, headers.indexOf('foto') + 1).setValue(String(params.foto).substring(0, 49000));
      if (params.keterangan) sheet.getRange(row, headers.indexOf('keterangan') + 1).setValue(params.keterangan.trim());
      syncWaliAsuhCount();
      return { status: 'ok', message: 'Wali asuh berhasil diperbarui.' };
    }
  }
  return { status: 'error', message: 'Wali asuh tidak ditemukan.' };
}

function deleteWaliAsuh(params) {
  const id = parseInt(params.id);
  if (!id) return { status: 'error', message: 'ID wali asuh diperlukan.' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_WALI_ASUH);
  if (!sheet) return { status: 'error', message: 'Sheet WaliAsuh tidak ditemukan.' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { status: 'error', message: 'Kolom ID tidak ditemukan.' };
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][idIdx]) === id) {
      sheet.deleteRow(i + 1);
      syncWaliAsuhCount();
      return { status: 'ok', message: 'Wali asuh berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Wali asuh tidak ditemukan.' };
}

function getCurrentTime() { return Utilities.formatDate(new Date(), TIMEZONE, 'HH:mm'); }