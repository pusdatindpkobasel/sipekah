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

// Mengisi dropdown Sub Bidang berdasarkan jabatan pengguna
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

// Saat halaman Monitor Laporan tampil, load data bulan default dan subbidang
function initMonitorLaporanPage() {
  const now = new Date();
  let month = now.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  const year = now.getFullYear();
  const defaultMonthYear = `${year}-${month}`;

  const filterBulanElem = document.getElementById('filter-bulan-monitor');
  filterBulanElem.value = defaultMonthYear;

  // Pastikan fungsi ini dipanggil untuk memuat laporan
  loadMonitorLaporan(defaultMonthYear);

  // Memanggil populateSubBidangFilter untuk mengisi filter subbidang
  populateSubBidangFilter();  // Pastikan filter subbidang diatur dengan benar
}

// Event listener untuk filter Sub Bidang
document.getElementById('filter-subbid-monitor').addEventListener('change', (e) => {
  const subbid = e.target.value;
  loadMonitorLaporan(filterBulan.value, subbid);  // Memuat laporan dengan subbid yang dipilih
});

// Filter Sub Bidang
function filterBySubBidang(subbid) {
  const rows = document.querySelectorAll("#tabel-monitor-laporan tbody tr");
  rows.forEach(row => {
    const subBidangCell = row.cells[0].textContent;
    if (subbid && subBidangCell !== subbid) {
      row.style.display = "none";
    } else {
      row.style.display = "";
    }
  });
}

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

      // Mengubah timestamp ke waktu lokal dan menyimpan dalam Set untuk laporan tanggal
      const laporanDates = new Set(
        laporanUser.map(item => {
          // Menyesuaikan dengan GMT+7, waktu yang diterima dari GAS
          const d = new Date(item.timestamp); // timestamp dari GAS
          
          // Pastikan kita menggunakan waktu lokal berdasarkan zona waktu Indonesia (GMT+7)
          const localDate = new Date(d.getTime() + (d.getTimezoneOffset() * 60000)); // Adjust UTC to local

          // Konversi tanggal menjadi format YYYY-MM-DD
          const formattedDate = localDate.toISOString().split('T')[0]; 
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

        // Mengonversi tanggal hari ke format YYYY-MM-DD
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];

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

function loadSesiStatus() {
  fetch(`${WEB_APP_URL}?action=getLaporan&nama=${userData.nama}`)
    .then(res => res.json())
    .then(data => {
      sesiStatus = data || {};
      renderSesiForm();
    });
}

function getJamSesi(i) {
  const jam = [
    "(07.30–08.30)", "(08.30–09.30)", "(09.30–10.30)", "(10.30–12.00)",
    "(13.00–14.00)", "(14.00–15.00)", "(15.00–16.00)"
  ];
  return jam[i - 1] || "";
}

function renderSesiForm() {
  const wrapper = document.getElementById("sesi-form");
  wrapper.innerHTML = "";

  let totalIsi = 0;

  for (let i = 1; i <= 7; i++) {
    const sudah = sesiStatus[`sesi${i}`];
    const bukti = sesiStatus[`bukti${i}`];
    const div = document.createElement("div");
    div.className = "card card-sesi mb-3";
    div.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Sesi ${i} ${getJamSesi(i)}</h5>
        ${sudah ? `
          <div class="alert alert-success p-2">
            ✅ Sudah dikirim: ${sudah}
            ${bukti ? `<br><a href="${bukti}" target="_blank">📎 Lihat Bukti</a>` : ""}
            <br><small class="text-muted">Isian sesi tidak bisa diedit ulang.</small>
          </div>
        ` : `
          <textarea id="sesi${i}" class="form-control mb-2" placeholder="Uraian pekerjaan sesi ${i}"></textarea>
          <input type="file" id="file${i}" class="form-control mb-2" accept=".jpg,.jpeg,.png,.pdf" />
          <button class="btn btn-success" id="btn-kirim-sesi${i}">Kirim Sesi ${i}</button>
        `}
      </div>
    `;
    if (sudah) totalIsi++;
    wrapper.appendChild(div);
  }

  const statusEl = document.getElementById("sesi-status");
  if (statusEl) {
    statusEl.innerHTML = `
      <div class="alert alert-info text-center">
        🔄 ${totalIsi} dari 7 sesi telah diisi
      </div>
    `;
  }

  console.log('renderSesiForm called, totalIsi:', totalIsi);
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

  filterTanggal.innerHTML = `<option value="">-- Pilih Tanggal --</option>`;
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
// ==================== Monitor Laporan ====================
async function loadMonitorLaporan(bulanTahun, subbidFilter = "") {
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

  // Filter berdasarkan Jabatan, Sub Bidang, dan Sub Bidang yang dipilih
  const filteredLaporan = laporanUserBulan.filter(laporan => {
    if (userData.jabatan === 'Admin' || userData.jabatan === 'Kepala Dinas' || userData.jabatan === 'Sekretaris') {
      return true;  // Admin, Kepala Dinas, dan Sekretaris dapat melihat semua
    }

    if (userData.jabatan === 'Kepala Bidang' || userData.jabatan === 'Kepala Sub Bagian') {
      // Kepala Bidang atau Kepala Sub Bagian hanya bisa melihat laporan dari sub bidang mereka
      if (laporan.subbid === userData.subbid) {
        return true;  // Laporan yang sesuai dengan sub bidang
      }
    }

    // Menambahkan filter berdasarkan subbid yang dipilih
    if (subbidFilter && laporan.subbid !== subbidFilter) {
      return false; // Mengabaikan laporan yang subbidnya tidak sesuai dengan filter
    }
    return false;
  });

  // Menampilkan data pegawai yang sudah dan belum mengisi laporan
  const pegawaiLaporan = filteredLaporan.map(laporan => {
    const sesiTerisi = Object.keys(laporan).filter(key => key.includes("Sesi") && laporan[key].trim() !== "").length;
    const status = sesiTerisi === 7 ? 'Laporan Lengkap' : 'Belum Lengkap';

    return {
      nama: laporan.nama,
      tanggal: new Date(laporan.timestamp).toLocaleDateString(),
      sesiTerisi: sesiTerisi,
      status: status
    };
  });

  // Menampilkan data laporan di tabel
  const tbody = document.querySelector("#tabel-monitor-laporan tbody");
  tbody.innerHTML = "";  // Clear existing rows

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
