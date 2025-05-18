// === KONFIGURASI ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';

// === VARIABEL GLOBAL ===
let userData = {};

// === SAAT HALAMAN DIMUAT ===
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('btnFormLaporan').addEventListener('click', bukaFormLaporan);
  document.getElementById('filterWaktu').addEventListener('change', drawChart);
});

// === CEK LOGIN ===
function checkLogin() {
  const stored = localStorage.getItem('pegawai');
  if (!stored) return location.href = 'login.html';
  userData = JSON.parse(stored);
  tampilkanDataPribadi();
  muatDashboard();
}

// === TAMPILKAN DATA PRIBADI ===
function tampilkanDataPribadi() {
  document.getElementById('infoNama').innerText = userData.Nama;
  document.getElementById('infoNip').innerText = `NIP: ${userData.NIP}`;
  document.getElementById('infoSubbid').innerText = `Subbid: ${userData.Subbid}`;
  document.getElementById('infoGolongan').innerText = `Golongan: ${userData.Golongan}`;
  document.getElementById('infoJabatan').innerText = `Jabatan: ${userData.Jabatan}`;
}

// === LOGOUT ===
function logout() {
  localStorage.removeItem('pegawai');
  location.href = 'login.html';
}

// === BUKA FORM LAPORAN ===
function bukaFormLaporan() {
  location.href = 'form.html';
}

// === MUAT DATA DASHBOARD ===
function muatDashboard() {
  fetch(`${SCRIPT_URL}?action=dash&nip=${userData.NIP}`)
    .then(res => res.json())
    .then(data => {
      updateStatistik(data);
      buatTabelHariIni(data.hariIni);
      renderHeatmap(data.kalender);
      renderChart(data.grafik);
    });
}

// === UPDATE INFO CARD ===
function updateStatistik(data) {
  document.getElementById('jumlahLaporan').innerText = data.totalHari;
  document.getElementById('jumlahSesi').innerText = data.totalSesi;
  document.getElementById('jumlahJamKerja').innerText = (data.totalSesi * 7.5 / 7).toFixed(1);
}

// === TABEL DETAIL HARI INI ===
function buatTabelHariIni(sesi) {
  const tbody = document.getElementById('tabelHarian');
  tbody.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>Sesi ${i}</td><td>${sesi[`Sesi${i}`] || '-'}</td><td><a href="${sesi[`Bukti${i}`] || '#'}" target="_blank">Lihat</a></td>`;
    tbody.appendChild(row);
  }
}

// === HEATMAP ===
function renderHeatmap(kalender) {
  const cal = document.getElementById('calendarHeatmap');
  cal.innerHTML = '';
  kalender.forEach(hari => {
    const el = document.createElement('div');
    el.className = `heatmap-day heatmap-${hari.jumlah}`;
    el.innerText = new Date(hari.tanggal).getDate();
    cal.appendChild(el);
  });
}

// === CHART ===
let chart;
function renderChart(data) {
  const ctx = document.getElementById('chartPencapaian').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Jumlah Sesi',
        data: data.values,
        backgroundColor: '#0d6efd'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 7 }
      }
    }
  });
}

function drawChart() {
  const filter = document.getElementById('filterWaktu').value;
  fetch(`${SCRIPT_URL}?action=grafik&nip=${userData.NIP}&filter=${filter}`)
    .then(res => res.json())
    .then(renderChart);
}
