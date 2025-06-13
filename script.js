const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxS9glVdvcS0yfMOeEdYxiTgjLbwc2F_TRwoxGG1dYh_3cAPqzFWnHUOOiLSdFgMZR3rA/exec';

let userData = {}, sesiStatus = {};
const filterBulan = document.getElementById('filter-bulan');
const filterTanggal = document.getElementById('filter-tanggal');
const filterSubBidang = document.getElementById('filter-subbid');

// Durasi tiap sesi dalam jam
const durasiSesi = [1,1,1,1.5,1,1,1]; // index 0 = sesi 1

// Hari kerja efektif per bulan (manual)
const hariKerjaEfektif = {
  '2025-05': 17,
  '2025-06': 18,
  // Tambah sesuai kebutuhan
};

// Fungsi load dan hitung capaian kinerja per bulan
async function loadCapaianKinerja(bulanTahun) {
  if (!bulanTahun) return;

  // Ambil data laporan dari GAS
  const res = await fetch(`${WEB_APP_URL}?action=getAllLaporan`);
  const data = await res.json();

  // Filter laporan user dan bulan
  const laporanUserBulan = data.filter(item => {
    if (item.nama !== userData.nama) return false;
    if (!item.timestamp) return false;
    const tgl = new Date(item.timestamp);
    const y = tgl.getFullYear();
    let m = tgl.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    return `${y}-${m}` === bulanTahun;
  });

  // Dapatkan tanggal unik hari laporan (jumlah laporan)
  const tanggalUnikSet = new Set();
  // Hitung total sesi terisi di bulan
  let totalSesiTerisi = 0;
  // Hitung total jam kerja
  let totalJamKerja = 0;

  laporanUserBulan.forEach(laporan => {
    // Ambil tanggal laporan (YYYY-MM-DD)
    const tgl = new Date(laporan.timestamp);
    const y = tgl.getFullYear();
    let m = tgl.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    let d = tgl.getDate();
    d = d < 10 ? '0' + d : d;
    const fullTanggal = `${y}-${m}-${d}`;
    tanggalUnikSet.add(fullTanggal);

    // Hitung sesi terisi untuk hari ini
    let sesiTerisiHariIni = 0;
    for (let i = 1; i <= 7; i++) {
      const sesiKey = `Sesi ${i}`;
      if (laporan[sesiKey] && laporan[sesiKey].trim() !== "") {
        sesiTerisiHariIni++;
        totalJamKerja += durasiSesi[i-1];
      }
    }
    totalSesiTerisi += sesiTerisiHariIni;
  });

  // Target jam kerja = hari kerja efektif * 7.5 jam per hari
  const targetJamKerja = (hariKerjaEfektif[bulanTahun] || 0) * 7.5;

  // Kekurangan jam kerja = target - total jam kerja, minimal 0
  const kekuranganJamKerja = Math.max(0, targetJamKerja - totalJamKerja);

  // Update card statistik
  document.getElementById('stat-laporan').textContent = tanggalUnikSet.size;
  document.getElementById('stat-sesi-terisi').textContent = totalSesiTerisi;
  document.getElementById('stat-jam-kerja').textContent = totalJamKerja.toFixed(2) + ' jam';
  document.getElementById('stat-kekurangan-jam').textContent = kekuranganJamKerja.toFixed(2) + ' jam';

  // Prepare data grafik (jumlah sesi per tanggal)
  const sesiPerTanggal = {};
  tanggalUnikSet.forEach(tgl => sesiPerTanggal[tgl] = 0);
  laporanUserBulan.forEach(laporan => {
    const tgl = new Date(laporan.timestamp);
    const y = tgl.getFullYear();
    let m = tgl.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    let d = tgl.getDate();
    d = d < 10 ? '0' + d : d;
    const fullTanggal = `${y}-${m}-${d}`;

    let sesiTerisiHariIni = 0;
    for (let i = 1; i <= 7; i++) {
      const sesiKey = `Sesi ${i}`;
      if (laporan[sesiKey] && laporan[sesiKey].trim() !== "") {
        sesiTerisiHariIni++;
      }
    }
    sesiPerTanggal[fullTanggal] = sesiTerisiHariIni;
  });

  // Siapkan data chart
  const labels = Array.from(tanggalUnikSet).sort();
  const dataChart = labels.map(tgl => sesiPerTanggal[tgl] || 0);

  renderGrafikCapaian(labels, dataChart);
}

let chartCapaian = null;
function renderGrafikCapaian(labels, data) {
  const ctx = document.getElementById('grafik-capaian-kinerja').getContext('2d');
  if (chartCapaian) chartCapaian.destroy();

  chartCapaian = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Jumlah Sesi Terisi Per Hari',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 7 }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });
}

// Inisialisasi filter bulan di halaman Capaian Kinerja
document.getElementById('filter-bulan-capaian').addEventListener('change', (e) => {
  const bulan = e.target.value;
  loadCapaianKinerja(bulan);
});

// Saat halaman Capaian Kinerja tampil, load data bulan default
function initCapaianKinerjaPage() {
  const now = new Date();
  let month = now.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  const year = now.getFullYear();
  const defaultMonthYear = `${year}-${month}`;

  const filterBulanElem = document.getElementById('filter-bulan-capaian');
  filterBulanElem.value = defaultMonthYear;

  loadCapaianKinerja(defaultMonthYear);
}

// Data master pilihan kategori untuk Profil Saya
const masterSubBidang = [
  "Sekretariat",
  "Bagian Umum & Kepegawaian",
  "Bidang Pemasaran Pariwisata & Ekraf",
  "Bidang Pengembangan Destinasi Pariwisata",
  "Bidang Pemuda & Olahraga",
];

const masterStatusKepegawaian = [
  "PNS",
  "PPPK",
  "PHL",
];

const masterGolongan = [
  "II/a", "II/b", "II/c", "II/d", "III/a", "III/b", "III/c", "III/d",
  "IV/a", "IV/b", "IX", "VII", "VI", "V"
];

const masterJabatan = [
  "Staff",
  "Kepala Subbagian",
  "Kepala Bidang",
  "Sekretaris",
  "Kepala Dinas",
];

window.onload = () => {
  // Initial page load logic
  renderSesiForm();  // Renders form on initial load
  loadSesiStatus();  // Load status of sesi for the selected date
  // Cek login user dari localStorage
  const savedUser = localStorage.getItem('userData');
  const loginTimeStr = localStorage.getItem('loginTime');
  const now = new Date();

  if (!savedUser || !loginTimeStr) {
    window.location.href = 'login.html';
    return;
  }

  const loginTime = new Date(loginTimeStr);
  const diffMinutes = (now - loginTime) / 1000 / 60;
  if (diffMinutes > 60) {
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
    return;
  }

  userData = JSON.parse(savedUser);

  setupNavigation();

  showPage('beranda');
  displayUserInfo();
  renderSimpleCalendar();
  loadSesiStatus();
  setLogoutButton();

  setupFilters();

  // Load default riwayat laporan bulan ini tanpa filter tanggal
  let month = now.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  const year = now.getFullYear();
  const defaultMonthYear = `${year}-${month}`;
  filterBulan.value = defaultMonthYear;
  filterTanggal.value = "";
  loadRiwayatLaporan(defaultMonthYear, "");

  // Load data profil saat buka halaman profil
  // Kalau halaman profil aktif langsung load user profile
  if (document.getElementById('page-profil').style.display !== 'none') {
    loadUserProfile();
  }

  // Pemanggilan fungsi untuk halaman Monitor Laporan
  initMonitorLaporanPage();  // Pastikan fungsi ini dipanggil untuk inisialisasi filter dan laporan

  // Logout button event listeners
  document.getElementById('logout-button').addEventListener('click', logout);
  document.getElementById('logout-button-mobile').addEventListener('click', logout);

  // Event delegation untuk tombol kirim sesi
  document.getElementById('sesi-form').addEventListener('click', function (event) {
    const target = event.target;
    if (target && target.tagName === 'BUTTON' && target.id.startsWith('btn-kirim-sesi')) {
      const sesiNum = parseInt(target.id.replace('btn-kirim-sesi', ''));
      if (!isNaN(sesiNum)) {
        submitSesi(sesiNum);
      }
    }
  });
};

// ==================== Setup Navigation ====================
function setupNavigation() {
  const menuLinks = document.querySelectorAll('#sidebar-menu a');
  const pages = document.querySelectorAll('.page-content');
  const sidebar = document.getElementById('sidebar');
  const hamburgerBtn = document.getElementById('hamburger-btn');

  function showPage(pageId) {
    pages.forEach(p => p.style.display = 'none');
    document.getElementById(`page-${pageId}`).style.display = 'block';

    menuLinks.forEach(link => {
      if (link.dataset.page === pageId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showPage(link.dataset.page);

      if(link.dataset.page === 'profil') {
        loadUserProfile();
      }

      // Jika di mobile, sembunyikan sidebar setelah klik menu
      if(window.innerWidth <= 768){
        sidebar.classList.remove('show');
        hamburgerBtn.setAttribute('aria-expanded', false);
      }
    });
  });

  hamburgerBtn.addEventListener('click', () => {
    const isShown = sidebar.classList.toggle('show');
    hamburgerBtn.setAttribute('aria-expanded', isShown);
  });

  // Tampilkan halaman Beranda default
  showPage('beranda');

  window.showPage = showPage; // expose untuk akses global
}

function displayUserInfo() {
  document.getElementById("info-pegawai").innerHTML = `
    <div class="row mb-1"><div class="col-4 fw-bold">Nama Pegawai:</div><div class="col-8">${userData.nama}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">NIP:</div><div class="col-8">${userData.nip}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Sub Bidang:</div><div class="col-8">${userData.subbid}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Status Kepegawaian:</div><div class="col-8">${userData.status}</div></div>
    <div class="row mb-1"><div class="col-4 fw-bold">Golongan:</div><div class="col-8">${userData.golongan}</div></div>
    <div class="row mb-0"><div class="col-4 fw-bold">Jabatan:</div><div class="col-8">${userData.jabatan}</div></div>
  `;
}

// ==================== Filter Laporan ====================
function setupFilters() {
  filterBulan.addEventListener('change', (e) => {
    const bulan = e.target.value;
    filterTanggal.value = "";
    loadRiwayatLaporan(bulan, "");
  });

  filterTanggal.addEventListener('change', (e) => {
    const tanggal = e.target.value;
    const bulan = filterBulan.value;
    loadRiwayatLaporan(bulan, tanggal);
  });
}

// Saat halaman Monitor Laporan tampil, load data bulan default dan subbidang
function initMonitorLaporanPage() {
  const now = new Date();
  let month = now.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  const year = now.getFullYear();
  const defaultMonthYear = `${year}-${month}`;

  const filterBulanElem = document.getElementById('filter-bulan-monitor');
  filterBulanElem.value = defaultMonthYear;

  loadMonitorLaporan(defaultMonthYear);

  // Memanggil populateSubBidangFilter untuk mengisi filter subbidang
  populateSubBidangFilter();
}

// Fungsi untuk mengisi dropdown Sub Bidang berdasarkan jabatan pengguna
function populateSubBidangFilter() {
  const filterSubBidangElem = document.getElementById('filter-subbid-monitor');
  filterSubBidangElem.innerHTML = "<option value=''>-- Pilih Sub Bidang --</option>"; // Reset pilihan

  if (userData.jabatan === 'Admin' || userData.jabatan === 'Kepala Dinas' || userData.jabatan === 'Sekretaris') {
    // Admin, Kepala Dinas, Sekretaris dapat memilih semua Sub Bidang
    masterSubBidang.forEach(subbid => {
      const option = document.createElement('option');
      option.value = subbid;
      option.textContent = subbid;
      filterSubBidangElem.appendChild(option);
    });
  } else {
    // Kepala Bidang dan Kepala Sub Bagian hanya bisa melihat subbidang mereka
    const option = document.createElement('option');
    option.value = userData.subbid;
    option.textContent = userData.subbid;
    filterSubBidangElem.appendChild(option);
    filterSubBidangElem.disabled = true; // Disable untuk subbidang selain milik user
  }
}

// Fungsi untuk mengisi dropdown Tanggal berdasarkan laporan yang tersedia
function populateTanggalOptions(laporanUser, bulanTahun, selectedTanggal = "") {
  const tanggalSet = new Set();

  laporanUser.forEach(item => {
    const tanggal = new Date(item.timestamp);
    const y = tanggal.getFullYear();
    let m = tanggal.getMonth() + 1;
    let d = tanggal.getDate();
    m = m < 10 ? '0' + m : m;
    d = d < 10 ? '0' + d : d;
    const itemBulanTahun = `${y}-${m}`;
    if(itemBulanTahun === bulanTahun){
      tanggalSet.add(`${y}-${m}-${d}`);
    }
  });

  filterTanggal.innerHTML = "<option value=''>-- Pilih Tanggal --</option>";
  if(tanggalSet.size === 0){
    filterTanggal.disabled = true;
  } else {
    filterTanggal.disabled = false;
    Array.from(tanggalSet).sort().forEach(tgl => {
      const opt = document.createElement('option');
      opt.value = tgl;
      opt.textContent = tgl;
      if(tgl === selectedTanggal) opt.selected = true;  // <-- Tetap pilih tanggal yang dipilih
      filterTanggal.appendChild(opt);
    });
  }
}

// Fungsi untuk memuat laporan berdasarkan bulan, tanggal, dan subbidang
async function loadMonitorLaporan(bulanTahun, tanggalFilter = "", subbidFilter = "") {
  if (!bulanTahun) return;

  // Ambil data laporan dari GAS
  const res = await fetch(`${WEB_APP_URL}?action=getAllLaporan`);
  const data = await res.json();

  // Filter laporan berdasarkan bulan dan tanggal
  const laporanUserBulan = data.filter(item => {
    if (item.nama !== userData.nama) return false; // Hanya laporan pegawai yang sesuai dengan user
    if (!item.timestamp) return false;
    const tgl = new Date(item.timestamp);
    const y = tgl.getFullYear();
    let m = tgl.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    let d = tgl.getDate();
    d = d < 10 ? '0' + d : d;
    const itemBulanTahun = `${y}-${m}`;
    const itemTanggal = `${y}-${m}-${d}`;
    return itemBulanTahun === bulanTahun && (!tanggalFilter || itemTanggal === tanggalFilter);
  });

  // Filter berdasarkan Sub Bidang jika ada
  const filteredLaporan = laporanUserBulan.filter(laporan => {
    if (subbidFilter && laporan.subbid !== subbidFilter) {
      return false;
    }
    return true;
  });

  // Menampilkan laporan yang sudah atau belum terisi
  const pegawaiLaporan = filteredLaporan.map(laporan => {
    const sesiTerisi = Object.keys(laporan).filter(key => key.includes("Sesi") && laporan[key].trim() !== "").length;
    const status = sesiTerisi === 7 ? 'Lengkap' : 'Belum Lengkap';

    return {
      nama: laporan.nama,
      tanggal: new Date(laporan.timestamp).toLocaleDateString(),
      sesiTerisi: sesiTerisi,
      status: status
    };
  });

  // Render tabel
  const tbody = document.querySelector("#tabel-monitor-laporan tbody");
  tbody.innerHTML = "";

  if (pegawaiLaporan.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Belum ada laporan di periode ini.</td></tr>`;
    return;
  }

  pegawaiLaporan.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.nama}</td>
      <td>${item.tanggal}</td>
      <td>${item.sesiTerisi} / 7</td>
      <td>${item.status}</td>
    `;
    tbody.appendChild(row);
  });
}

// Event listener untuk filter bulan, tanggal, dan sub-bidang
document.getElementById('filter-bulan-monitor').addEventListener('change', (e) => {
  const bulan = e.target.value;
  const tanggal = filterTanggal.value;
  const subbid = filterSubBidang.value;
  loadMonitorLaporan(bulan, tanggal, subbid);
});

document.getElementById('filter-tanggal').addEventListener('change', (e) => {
  const tanggal = e.target.value;
  const bulan = filterBulan.value;
  const subbid = filterSubBidang.value;
  loadMonitorLaporan(bulan, tanggal, subbid);
});

document.getElementById('filter-subbid-monitor').addEventListener('change', (e) => {
  const subbid = e.target.value;
  const bulan = filterBulan.value;
  const tanggal = filterTanggal.value;
  loadMonitorLaporan(bulan, tanggal, subbid);
});

// ==================== Simple Calendar ====================
function renderSimpleCalendar() {
  const calendarEl = document.getElementById("simple-calendar");
  const calendarTitle = document.getElementById("calendar-title");
  if (!calendarEl || !calendarTitle) return;

  const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  calendarTitle.textContent = `Kalender Laporan ${bulanNames[month]} ${year}`;

  fetch(`${WEB_APP_URL}?action=getAllLaporan`)
    .then(res => res.json())
    .then(data => {
      const laporanUser = data.filter(item => item.nama === userData.nama);

      // Mengonversi timestamp menjadi tanggal tanpa zona waktu yang salah
      const laporanDates = new Set(
        laporanUser.map(item => {
          const d = new Date(item.timestamp);

          // Mendapatkan tahun, bulan, dan tanggal dalam UTC untuk menghindari pergeseran zona waktu
          const year = d.getUTCFullYear();
          const month = d.getUTCMonth(); // Bulan UTC dimulai dari 0 (Januari = 0)
          const date = d.getUTCDate();  // Mengambil tanggal UTC yang sebenarnya

          // Mengonversi ke format YYYY-MM-DD
          const formattedDate = `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-${date < 10 ? '0' + date : date}`;
          return formattedDate;
        })
      );

      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      calendarEl.innerHTML = "";

      const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      daysOfWeek.forEach(day => {
        const headerCell = document.createElement("div");
        headerCell.className = "day-cell day-header";
        headerCell.textContent = day;
        calendarEl.appendChild(headerCell);
      });

      // Menambahkan sel kosong sebelum tanggal pertama bulan ini
      for (let i = 0; i < firstWeekday; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell";
        calendarEl.appendChild(emptyCell);
      }

      // Loop untuk menampilkan setiap hari dalam bulan
      for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "day-cell";

        // Membuat objek Date untuk setiap hari dan mengonversinya ke string format YYYY-MM-DD
        const dateStr = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];  // UTC untuk mencegah pergeseran

        cell.textContent = day;

        // Menandai hari yang sama dengan hari ini
        const today = new Date();
        if (
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear()
        ) {
          cell.classList.add("day-today");
        }

        // Memeriksa apakah tanggal hari tersebut sudah ada laporan
        if (laporanDates.has(dateStr)) {
          cell.classList.add("day-reported");
          cell.title = "Sudah melapor pada tanggal ini";
        }

        calendarEl.appendChild(cell);
      }
    })
    .catch(err => {
      console.error("Gagal load data laporan untuk kalender:", err);
    });
}

// ==================== Filter Tanggal ====================
async function renderTanggalFilter() {
  const tanggalFilterContainer = document.getElementById("tanggal-filter-container");
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Ambil tanggal yang sudah diisi laporannya
  const laporanDates = new Set();
  const res = await fetch(`${WEB_APP_URL}?action=getAllLaporan`);
  const data = await res.json();
  
  data.forEach(item => {
    const laporanDate = new Date(item.timestamp).toISOString().split('T')[0];
    laporanDates.add(laporanDate);
  });

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // Mengambil jumlah hari dalam bulan ini
  
  tanggalFilterContainer.innerHTML = ''; // Kosongkan tanggal filter sebelumnya

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Cek jika tanggal tersebut adalah hari Sabtu atau Minggu
    const isWeekend = date.getDay() === 6 || date.getDay() === 0;

    // Tentukan kelas tanggal berdasarkan kondisi
    let cellClass = 'tanggal-cell';
    
    if (isWeekend) {
      cellClass += ' saturday';
    } else if (dateStr === todayStr) {
      cellClass += ' today';
    } else if (laporanDates.has(dateStr)) {
      cellClass += ' reported';
    } else if (dateStr < todayStr) {
      cellClass += ' not-reported';
    } else {
      cellClass += ' disabled';
    }

    const dateCell = document.createElement('div');
    dateCell.className = cellClass;
    dateCell.textContent = i;
    dateCell.addEventListener('click', () => onTanggalClick(dateStr));  // Event untuk klik tanggal

    tanggalFilterContainer.appendChild(dateCell);
  }
}

// Fungsi ketika tanggal dipilih
function onTanggalClick(dateStr) {
  const selectedDate = new Date(dateStr);
  const today = new Date();

  // Cek apakah tanggal dapat dipilih
  if (selectedDate > today) {
    Swal.fire('Tanggal tidak valid', 'Tanggal yang dipilih tidak boleh lebih dari hari ini.', 'error');
    return;
  }

  const sesiFormContainer = document.getElementById("sesi-form");
  sesiFormContainer.innerHTML = ''; // Kosongkan form sesi

  // Jika tanggal sudah ada laporannya, tampilkan isian laporan
  fetch(`${WEB_APP_URL}?action=getLaporan&tanggal=${dateStr}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        // Jika laporan sudah ada, render laporan
        renderSesiForm(data[0], dateStr);
      } else {
        // Jika laporan belum ada, kosongkan form
        renderSesiForm(null, dateStr);
      }
    })
    .catch(err => {
      console.error("Error fetching laporan:", err);
    });
}

// Global variables
let sesiStatus = {};
let selectedDate = new Date().toISOString().split('T')[0];  // Default to today

// Render Sesi Form based on selected date
function renderSesiForm() {
  const wrapper = document.getElementById("sesi-form");
  const selectedDateFormatted = selectedDate;

  wrapper.innerHTML = ""; // Clear previous content

  // Example: Add logic to load data for the selected date
  fetch(`${WEB_APP_URL}?action=getLaporanByDate&nama=${userData.nama}&date=${selectedDateFormatted}`)
    .then(res => res.json())
    .then(data => {
      if (data) {
        // If there's a report for the selected date, show it in the form
        for (let i = 1; i <= 7; i++) {
          const sesiKey = `Sesi ${i}`;
          const buktiKey = `Bukti ${i}`;
          const div = document.createElement("div");
          div.className = "card card-sesi mb-3";

          div.innerHTML = `
            <div class="card-body">
              <h5 class="card-title">Sesi ${i} ${getJamSesi(i)}</h5>
              ${data[sesiKey] ? `
                <div class="alert alert-success p-2">
                  ✅ Sudah dikirim: ${data[sesiKey]}
                  ${data[buktiKey] ? `<br><a href="${data[buktiKey]}" target="_blank">📎 Lihat Bukti</a>` : ""}
                  <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
                </div>
              ` : `
                <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
                <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf" />
                <button class="btn btn-success" id="btn-kirim-sesi${i}">Kirim Sesi ${i}</button>
              `}
            </div>
          `;
          wrapper.appendChild(div);
        }
      } else {
        // If no report for the selected date, show empty form
        for (let i = 1; i <= 7; i++) {
          const div = document.createElement("div");
          div.className = "card card-sesi mb-3";
          div.innerHTML = `
            <div class="card-body">
              <h5 class="card-title">Sesi ${i} ${getJamSesi(i)}</h5>
              <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
              <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf" />
              <button class="btn btn-success" id="btn-kirim-sesi${i}">Kirim Sesi ${i}</button>
            </div>
          `;
          wrapper.appendChild(div);
        }
      }
    })
    .catch(err => {
      console.error('Error loading data for selected date:', err);
    });
}

// Event Listener for Tanggal Pilihan
document.getElementById('pilih-tanggal-laporan').addEventListener('change', (e) => {
  selectedDate = e.target.value;
  renderSesiForm();  // Re-render sesi form when date changes
});

// Example function for session time
function getJamSesi(i) {
  const jam = [
    "(07.30–08.30)", "(08.30–09.30)", "(09.30–10.30)", "(10.30–12.00)",
    "(13.00–14.00)", "(14.00–15.00)", "(15.00–16.00)"
  ];
  return jam[i - 1] || "";
}

// Load Sesi Status for the selected date
function loadSesiStatus() {
  fetch(`${WEB_APP_URL}?action=getLaporanByDate&nama=${userData.nama}&date=${selectedDate}`)
    .then(res => res.json())
    .then(data => {
      const statusEl = document.getElementById('sesi-status');
      statusEl.innerHTML = `
        <div class="alert alert-info text-center">
          ${data ? `Laporan sudah terisi untuk tanggal ${selectedDate}.` : `Laporan belum terisi untuk tanggal ${selectedDate}.`}
        </div>
      `;
    })
    .catch(err => {
      console.error('Error loading sesi status:', err);
    });
}

// Fungsi submit sesi dengan upload file dan data form
async function submitSesi(i) {
  const pekerjaan = document.getElementById(`sesi${i}`).value.trim();
  const file = document.getElementById(`file${i}`).files[0];

  if (!pekerjaan || !file) {
    Swal.fire("Isi uraian & pilih file", "", "warning");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire("File terlalu besar", "Maksimal ukuran file 2MB", "warning");
    return;
  }

  const allowedExt = ['pdf', 'jpg', 'jpeg', 'png'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExt.includes(ext)) {
    Swal.fire("File tidak diizinkan", "Hanya PDF, JPG, JPEG, PNG", "warning");
    return;
  }

  Swal.fire({ title: "Mengirim...", didOpen: () => Swal.showLoading() });

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;
    const filename = `${userData.nama}_Sesi${i}_${new Date().toISOString().split("T")[0]}.${ext}`;

    const formDataUpload = new FormData();
    formDataUpload.append('action', 'uploadFile');
    formDataUpload.append('filename', filename);
    formDataUpload.append('base64', base64);

    try {
      const uploadRes = await fetch(WEB_APP_URL, { method: 'POST', body: formDataUpload });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        Swal.fire("Gagal", "Upload file gagal: " + uploadData.message, "error");
        return;
      }

      const formDataSubmit = new FormData();
      formDataSubmit.append('action', 'submitForm');
      formDataSubmit.append('nama', userData.nama);
      formDataSubmit.append('nip', userData.nip);
      formDataSubmit.append('subbid', userData.subbid);
      formDataSubmit.append('status', userData.status);
      formDataSubmit.append('golongan', userData.golongan);
      formDataSubmit.append('jabatan', userData.jabatan);
      formDataSubmit.append('sesiKey', `sesi${i}`);
      formDataSubmit.append('buktiKey', `bukti${i}`);
      formDataSubmit.append('sesiVal', pekerjaan);
      formDataSubmit.append('buktiVal', uploadData.url);

      const submitRes = await fetch(WEB_APP_URL, { method: 'POST', body: formDataSubmit });
      const result = await submitRes.json();

      if (result.success) {
        Swal.fire("Berhasil", "Sesi berhasil dikirim", "success");
        loadSesiStatus();
      } else {
        Swal.fire("Gagal", "Terjadi kesalahan: " + (result.message || ""), "error");
      }
    } catch (error) {
      Swal.fire("Gagal", "Terjadi kesalahan jaringan.", "error");
    }
  };
  reader.readAsDataURL(file);
}

// =========== Filter Laporan Saya ==========
function setupFilters() {
  filterBulan.addEventListener('change', (e) => {
    const bulan = e.target.value;
    filterTanggal.value = "";
    loadRiwayatLaporan(bulan, "");
  });

  filterTanggal.addEventListener('change', (e) => {
    const tanggal = e.target.value;
    const bulan = filterBulan.value;
    loadRiwayatLaporan(bulan, tanggal);
  });
}

function loadRiwayatLaporan(bulanTahun, tanggalFilter = "") {
  fetch(`${WEB_APP_URL}?action=getAllLaporan`)
    .then(res => res.json())
    .then(data => {
      const laporanUser = data.filter(item => {
        if(item.nama !== userData.nama) return false;
        if(!bulanTahun) return true;

        const tanggal = new Date(item.timestamp);
        const y = tanggal.getFullYear();
        let m = tanggal.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        const itemBulanTahun = `${y}-${m}`;
        if(itemBulanTahun !== bulanTahun) return false;

        if(tanggalFilter){
          let d = tanggal.getDate();
          d = d < 10 ? '0' + d : d;
          const fullTanggal = `${y}-${m}-${d}`;
          return fullTanggal === tanggalFilter;
        }
        return true;
      });

      // Kirim tanggalFilter agar tanggal tetap terpilih di dropdown
      populateTanggalOptions(data.filter(item => item.nama === userData.nama), bulanTahun, tanggalFilter);

      const tbody = document.querySelector("#tabel-riwayat tbody");
      tbody.innerHTML = "";

      if (laporanUser.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">Belum ada laporan di periode ini.</td></tr>`;
        return;
      }

      laporanUser.forEach(laporan => {
        for(let i=1; i<=7; i++){
          const sesiKey = `Sesi ${i}`;
          const buktiKey = `Bukti ${i}`;
          if(laporan[sesiKey]){
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${sesiKey}</td>
              <td>${laporan[sesiKey]}</td>
              <td>${laporan[buktiKey] ? `<a href="${laporan[buktiKey]}" target="_blank">Lihat Bukti</a>` : '-'}</td>
            `;
            tbody.appendChild(row);
          }
        }
      });
    })
    .catch(err => {
      console.error("Gagal load riwayat laporan:", err);
    });
}

// Mengisi dropdown Tanggal berdasarkan laporan yang tersedia
function populateTanggalOptions(laporanUser, bulanTahun, selectedTanggal = "") {
  const tanggalSet = new Set();

  laporanUser.forEach(item => {
    const tanggal = new Date(item.timestamp);
    const y = tanggal.getFullYear();
    let m = tanggal.getMonth() + 1;
    let d = tanggal.getDate();
    m = m < 10 ? '0' + m : m;
    d = d < 10 ? '0' + d : d;
    const itemBulanTahun = `${y}-${m}`;
    if(itemBulanTahun === bulanTahun){
      tanggalSet.add(`${y}-${m}-${d}`);
    }
  });

  filterTanggal.innerHTML = "<option value=''>-- Pilih Tanggal --</option>";
  if(tanggalSet.size === 0){
    filterTanggal.disabled = true;
  } else {
    filterTanggal.disabled = false;
    Array.from(tanggalSet).sort().forEach(tgl => {
      const opt = document.createElement('option');
      opt.value = tgl;
      opt.textContent = tgl;
      if(tgl === selectedTanggal) opt.selected = true;  // <-- Tetap pilih tanggal yang dipilih
      filterTanggal.appendChild(opt);
    });
  }
}

// ==================== User Profile ====================
function loadUserProfile() {
  if (!userData || !userData.nama) return;

  document.getElementById('profil-nama').value = userData.nama || "";
  document.getElementById('profil-nip').value = userData.nip || "";
  document.getElementById('profil-email').value = userData.email || "";

  populateSelect('profil-subbid', masterSubBidang, userData.subbid);
  populateSelect('profil-status', masterStatusKepegawaian, userData.status);
  populateSelect('profil-golongan', masterGolongan, userData.golongan);
  populateSelect('profil-jabatan', masterJabatan, userData.jabatan);
}

function populateSelect(id, options, selectedValue) {
  const select = document.getElementById(id);
  select.innerHTML = "";

  options.forEach(opt => {
    const optionEl = document.createElement('option');
    optionEl.value = opt;
    optionEl.textContent = opt;
    if(opt === selectedValue) optionEl.selected = true;
    select.appendChild(optionEl);
  });
}

// Submit profil form
document.getElementById('profil-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const updatedData = {
    nama: document.getElementById('profil-nama').value,
    email: document.getElementById('profil-email').value.trim(),
    nip: document.getElementById('profil-nip').value,
    subbid: document.getElementById('profil-subbid').value,
    status: document.getElementById('profil-status').value,
    golongan: document.getElementById('profil-golongan').value,
    jabatan: document.getElementById('profil-jabatan').value
  };

  if(!updatedData.email){
    Swal.fire('Error', 'Email tidak boleh kosong.', 'error');
    return;
  }

  Swal.fire({
    title: 'Menyimpan data...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false
  });

  try {
    const formData = new FormData();
    formData.append('action', 'updatePegawai');
    formData.append('nama', updatedData.nama);
    formData.append('email', updatedData.email);
    formData.append('nip', updatedData.nip);
    formData.append('subbid', updatedData.subbid);
    formData.append('status', updatedData.status);
    formData.append('golongan', updatedData.golongan);
    formData.append('jabatan', updatedData.jabatan);

    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if(result.success){
      Swal.close();
      Swal.fire('Berhasil', 'Data profil berhasil diperbarui.', 'success');

      // Update localStorage & userData
      userData.email = updatedData.email;
      userData.subbid = updatedData.subbid;
      userData.status = updatedData.status;
      userData.golongan = updatedData.golongan;
      userData.jabatan = updatedData.jabatan;
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      Swal.fire('Gagal', result.message || 'Gagal memperbarui data.', 'error');
    }
  } catch (err) {
    Swal.fire('Error', 'Terjadi kesalahan jaringan.', 'error');
  }
});

// ==================== Logout ====================
function logout() {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Anda akan logout dari sistem.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, Logout!',
    cancelButtonText: 'Tidak, Tetap di sini!'
  }).then((result) => {
    if (result.isConfirmed) {
      // Hapus data login dan user dari localStorage
      localStorage.removeItem('userData');
      localStorage.removeItem('loginTime');
      // Redirect ke halaman login
      window.location.href = 'login.html';
    }
  });
}

function setLogoutButton() {
  const btn1 = document.getElementById('logout-button');
  if(btn1) btn1.onclick = logout;
  const btn2 = document.getElementById('logout-button-mobile');
  if(btn2) btn2.onclick = logout;
}
